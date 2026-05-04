import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import "./Auth.css";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await login(email, password);
        if (error) throw error;
        navigate("/analyze");
      } else {
        const { error } = await signup(email, password);
        if (error) throw error;
        setMsg(t("auth.reg_success"));
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message || t("auth.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Full-screen tropical background */}
      <img
        src="/images/auth-bg.png"
        alt=""
        className="auth-bg"
        draggable={false}
      />

      {/* Back to Landing Page */}
      <Link to="/" className="auth-back-btn">
        <span className="auth-back-arrow">←</span>
        Back to Home
      </Link>

      {/* Auth Card */}
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <span className="auth-brand-icon">🌱</span>
          <span className="auth-brand-name">SoilSense AI</span>
        </div>

        <h1 className="auth-title">
          {isLogin ? t("auth.welcome_back") : t("auth.join")}
        </h1>
        <p className="auth-subtitle">
          {isLogin ? t("auth.sign_in") : t("auth.create_account")}
        </p>

        {error && <div className="auth-error">{error}</div>}
        {msg && <div className="auth-msg">{msg}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>{t("auth.email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.enter_email")}
              required
            />
          </div>
          <div className="input-group">
            <label>{t("auth.password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.enter_password")}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? <span className="spinner" /> : (isLogin ? t("auth.log_in") : t("auth.sign_up"))}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? t("auth.no_account") : t("auth.has_account")}
          <button type="button" className="btn-link" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? t("auth.sign_up") : t("auth.log_in")}
          </button>
        </div>
      </div>
    </div>
  );
}
