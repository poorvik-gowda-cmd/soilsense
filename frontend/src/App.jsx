import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LandingPage from "./pages/LandingPage";
import Home from "./pages/Home";
import Results from "./pages/Results";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Auth from "./pages/Auth";
import Chatbot from "./pages/Chatbot";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./index.css";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  // Hide navbar on the landing page for a cinematic experience
  if (location.pathname === "/") {
    return null;
  }
  
  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };
  
  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <NavLink to="/analyze" className="nav-logo">
          🌱 <span className="grad-text">SoilSense AI</span>
        </NavLink>
        {user && (
          <ul className="nav-links" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <li><NavLink to="/analyze" className={({isActive}) => "nav-link" + (isActive ? " active" : "")}>{t('navbar.analyze', 'Analyze')}</NavLink></li>
            <li><NavLink to="/history" className={({isActive}) => "nav-link" + (isActive ? " active" : "")}>{t('navbar.history', 'History')}</NavLink></li>
            <li><NavLink to="/analytics" className={({isActive}) => "nav-link" + (isActive ? " active" : "")}>{t('navbar.analytics', 'Analytics')}</NavLink></li>
            <li><NavLink to="/chat" className={({isActive}) => "nav-link" + (isActive ? " active" : "")} style={{display: "flex", alignItems: "center", gap: "0.25rem"}}>✨ {t('navbar.chat', 'AI Chat')}</NavLink></li>
            <li>
              <select onChange={changeLanguage} value={i18n.language} className="lang-switcher" style={{ background: "transparent", color: "var(--text-light)", border: "1px solid var(--border-color)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                <option value="en" style={{ color: "#000" }}>English</option>
                <option value="hi" style={{ color: "#000" }}>हिंदी</option>
                <option value="kn" style={{ color: "#000" }}>ಕನ್ನಡ</option>
              </select>
            </li>
            <li><button className="btn-link nav-link" onClick={logout} style={{ marginLeft: "1rem" }}>{t("nav.logout")}</button></li>
          </ul>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"            element={<LandingPage />} />
          <Route path="/auth"        element={<Auth />} />
          <Route path="/analyze"     element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/chat"        element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
          <Route path="/results"     element={<ProtectedRoute><Results /></ProtectedRoute>} />
          <Route path="/history"     element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/analytics"   element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
