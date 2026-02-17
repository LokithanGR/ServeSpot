import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AppLoader from "./components/AppLoader.jsx"; // ✅ LOADER

import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Home from "./pages/Home.jsx";
import SignIn from "./pages/SignIn.jsx";
import UserSignup from "./pages/UserSignup.jsx";
import ProviderSignup from "./pages/ProviderSignup.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import ProviderDashboard from "./pages/ProviderDashboard.jsx";
import Feedback from "./pages/Feedback.jsx";

export default function App() {

  // ✅ loading state
  const [isLoaded, setIsLoaded] = useState(false);

  // ✅ FIRST show loader
  if (!isLoaded) {
    return (
      <AppLoader
        onDone={() => {
          setIsLoaded(true);
        }}
      />
    );
  }

  // ✅ AFTER loading -> show routes
  return (
    <Routes>

      <Route path="/" element={<Home />} />

      <Route path="/signin" element={<SignIn />} />

      <Route path="/signup/user" element={<UserSignup />} />

      <Route path="/signup/provider" element={<ProviderSignup />} />

      <Route path="/dashboard/user" element={<UserDashboard />} />

      <Route path="/dashboard/provider" element={<ProviderDashboard />} />

      <Route path="/admin/login" element={<AdminLogin />} />

      <Route path="/admin/dashboard" element={<AdminDashboard />} />

      <Route path="/feedback" element={<Feedback />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}
