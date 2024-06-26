const User = require("../models/userModel");
const UserOTPVerifyEmail = require("../models/userOTPVerifyEmailModel");
const Login_History = require("../models/loginHistoryModel");
const cloudinary = require("cloudinary").v2;
const cityCodeIdentify = require("../data/cityCodeIdentify.json");

const bcrypt = require("bcryptjs");

const userController = {
  checkUserFromClient: async (req, res) => {
    try {
      const { email, password, type } = req.body;

      const user = await User.findOne({ email });

      if (type === "login") {
        if (!user) {
          return res.json({
            isCheckEmail: false,
          });
        } else if (user) {
          let isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return res.json({
              isCheckEmail: true,
              isCheckPassword: false,
            });
          } else {
            return res.json({
              isCheckEmail: true,
              isCheckPassword: true,
            });
          }
        }
      } else if (type === "register") {
        if (user) {
          return res.json({
            isCheckEmail: true,
          });
        } else if (!user) {
          return res.json({
            isCheckEmail: false,
          });
        }
      }
    } catch (err) {
      return res.status(500).json({
        msg: err.message,
        success: false,
      });
    }
  },
  //Admin
  getAllUser: async (req, res) => {
    try {
      const user_id = req.user.id;

      if (user_id) {
        const users = await User.find();
        return res.status(200).json({
          users,
          success: true,
        });
      }
    } catch (err) {
      return res.status(500).json({
        msg: err.message,
        success: false,
      });
    }
  },
  deleteUser: async (req, res) => {
    try {
      const user_id = req.user.id;

      if (user_id) {
        const id = req.params.id;

        await User.findByIdAndDelete(id);

        return res.status(200).json({
          msg: "Deleted user successfully!",
          success: true,
        });
      }
    } catch (err) {
      return res.status(500).json({
        msg: err.message,
        success: false,
      });
    }
  },
  //User
  getCurrentUser: async (req, res) => {
    try {
      const user_id = req.user.id;

      const user = await User.findById({ _id: user_id });

      if (!user) {
        return res.status(400).json({
          msg: "Token is not valid or user not found!",
          msg_vn: "Tài khoản không tồn tại!",
          success: false,
        });
      }

      const login_history = await Login_History.find({ user_id });

      return res.status(200).json({
        user: {
          ...user._doc,
          login_history,
          password: "",
        },
        success: true,
      });
    } catch (err) {
      return res.status(500).json({
        msg: err.message,
        success: false,
      });
    }
  },
  verifyIdentify: async (req, res) => {
    try {
      const user_id = req.user.id;

      if (user_id) {
        const { number_identify } = req.body;

        if (!number_identify) {
          return res.status(400).json({
            msg: "Please enter your identify number!",
            msg_vn: "Vui lòng nhập mã định danh của bạn!",
            success: false,
          });
        }
        if (number_identify.length !== 12) {
          return res.status(400).json({
            msg: "Incorrect identifier 12 characters!",
            msg_vn: "Mã định danh không đủ 12 ký tự!",
            success: false,
          });
        }

        const city_code = number_identify.slice(0, 3);
        if (!cityCodeIdentify.includes(city_code)) {
          return res.status(400).json({
            msg: "Identify number is incorrect format: city",
            msg_vn: "Mã định danh không đúng định dạng!: 3 số đầu",
            success: false,
          });
        }

        const genders = ["0", "1", "2", "3"];
        const gender_udentify = number_identify[3];
        if (!genders.includes(gender_udentify)) {
          return res.status(400).json({
            msg: "Identify number is incorrect format: gender",
            msg_vn: "Mã định danh không đúng định dạng!: số thứ 4",
            success: false,
          });
        }

        const birth_year = number_identify.slice(4, 6);
        const random_number = number_identify.slice(6, 12);

        const result = (
          city_code +
          gender_udentify +
          birth_year +
          random_number
        )
          .split(",")
          .join("");

        const updateIdentify = await User.findByIdAndUpdate(
          user_id,
          { identify: result },
          { new: true }
        );

        return res.status(500).json({
          msg: "Identifier authentication successful!",
          msg_vn: "Xác thực mã định danh thành công!",
          success: true,
          updateIdentify,
        });
      }
    } catch (err) {
      return res.status(500).json({
        msg: err.message,
        success: false,
      });
    }
  },
  verifyEmail: async (req, res) => {
    try {
      const user_id = req.user.id;

      const user = await User.findOne({ _id: user_id });
      const { otp } = req.body;

      if (!user) {
        return res.status(400).json({
          msg: "Empty user details are not allowed",
          msg_vn: "Tài khoản này không tồn tại!",
          success: false,
        });
      }

      if (!otp || otp.length !== 6) {
        return res.status(400).json({
          msg: "OTP is incorrect format!",
          msg_vn: "Mã OTP không đúng định dạng. Vui lòng nhập đủ 6 số OTP!",
          success: false,
        });
      }

      const user_otp = await UserOTPVerifyEmail.find({ user_id: user._id });

      const oldOTP = user_otp[0].otp;
      const oldOTPExpiredAt = user_otp[0].expiredAt;
      if (otp !== oldOTP) {
        return res.status(400).json({
          msg: "OTP code is incorrect with OTP code in email. Please check email again!",
          msg_vn: "Mã OTP không đúng. Vui lòng kiểm tra lại mã OTP ở Email!",
          success: false,
        });
      }

      if (oldOTPExpiredAt.getTime() < new Date().getTime()) {
        return res.status(400).json({
          msg: "OTP code is expired! Please resend OTP code again is verify!",
          msg_vn: "Mã OTP đã hết hạn. Vui lòng gửi lại mã OTP để xác thực!",
          success: false,
        });
      }
      const updateVerifyEmail = await User.findByIdAndUpdate(
        user._id,
        { isVerify: true },
        { new: true }
      );
      await UserOTPVerifyEmail.deleteMany({ user_id: user._id });

      return res.status(200).json({
        msg: "Verify email is successfully!",
        msg_vn: "Xác thực email thành công!",
        success: true,
        updateVerifyEmail,
      });
    } catch (err) {
      return res.status(500).json({
        msg: err.message,
        success: false,
      });
    }
  },
  getLoginHistory: async (req, res) => {
    try {
      const user_id = req.user.id;

      const login_history = await Login_History.find({ user_id });

      return res.status(200).json({
        login_history,
        success: true,
      });
    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  },
  updateUser: async (req, res) => {
    try {
      const user_id = req.user.id;

      if (req.body.email) {
        return res.status(400).json({
          msg: "Email cann't be changed!",
          msg_vn: "Email không thể thay đổi, vì lý do bảo mật!",
          success: false,
        });
      }

      let updateData = {
        ...req.body,
      };

      if (updateData.avatar) {
        const user = await User.findById({ _id: user_id });

        if (user.avatar.isChange) {
          const public_id = user.avatar.public_id;
          await cloudinary.uploader.destroy(public_id);
        }

        await cloudinary.uploader.upload(
          updateData.avatar,
          {
            folder: "movies_project/avatar",
            width: 200,
            crop: "scale",
          },
          (error, result) => {
            if (error) {
              return res.status(500).json({
                msg: error,
                success: false,
              });
            }

            updateData = {
              ...updateData,
              avatar: {
                public_id: result.public_id,
                url: result.secure_url,
                isChange: true,
              },
            };
          }
        );
      }

      const updateUser = await User.findByIdAndUpdate(user_id, updateData, {
        new: true,
      });

      return res.status(200).json({
        updateUser,
        success: true,
        msg: "Updated succeed!",
        msg_vn: "Cập nhật thành công!",
      });
    } catch (err) {
      return res.status(500).json({
        msg: err.message,
        success: false,
      });
    }
  },
};

module.exports = userController;
