import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import "./styles/App.css";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MovieListPage from "./pages/MovieListPage";
import MovieDetailsPage from "./pages/MovieDetailsPage";
import PersonalInformation from "./pages/PersonalInformation";
import MoviesLikedPage from "./pages/MoviesLikedPage";
import WatchListPage from "./pages/WatchListPage";
import HistoryPage from "./pages/HistoryPage";
import SettingsPage from "./pages/SettingsPage";
import MyAccountManager from "./pages/MyAccountManager";
import NotFoundPage from "./pages/NotFoundPage";
import PrivateRoute from "./pages/PrivateRoute";
import HomePage from "./pages/HomePage";
import Alert from "./components/Alert";
import { useDispatch } from "react-redux";
import { getUserCurrentAction } from "./store/actions/authAction";

const App = () => {
  const dispatch = useDispatch();
  const [isLogin, setIsLogin] = useState(null);

  useEffect(() => {
    const isLogin = localStorage.getItem("isLogin");
    setIsLogin(isLogin);
  }, []);

  useEffect(() => {
    dispatch(getUserCurrentAction());
  }, [dispatch]);

  useEffect(() => {
    dispatch(getUserCurrentAction());
  }, [dispatch]);

  return (
    <React.Fragment>
      <Navbar />
      <Alert />
      <Routes>
        <Route element={<PrivateRoute />}>
          <Route path="/my-account-manager" element={<MyAccountManager />}>
            <Route
              path="personal-information"
              element={<PersonalInformation />}
            />
            <Route exact path="movies-liked" element={<MoviesLikedPage />} />
            <Route exact path="watch-list/:slug" element={<WatchListPage />} />
            <Route exact path="history" element={<HistoryPage />} />
            <Route exact path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route
          path="/login"
          element={!isLogin ? <LoginPage /> : <HomePage />}
        />
        <Route
          path="/register"
          element={!isLogin ? <RegisterPage /> : <HomePage />}
        />
        <Route path="/" element={<HomePage />} />
        <Route path="/movies" element={<MovieListPage />} />
        <Route path="/movie-details/:slug" element={<MovieDetailsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </React.Fragment>
  );
};

export default App;
