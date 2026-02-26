import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// ✅ Put png here: src/assets/user.png (change path if needed)
import userIcon from "../assets/user.png";

export default function Navbar({
  showSignup = false,
  showSignin = true,
  showHome = true,

  // ✅ Landing page logo animation
  animateLogo = false,

  // ✅ NEW: show Admin button
  showAdmin = false,

  // ✅ NEW: show User Icon dropdown (Signin/Signup)
  showUserMenu = false,
}) {
  const nav = useNavigate();

  // ✅ Logo typing animation
  const fullText = "ServeSpot";
  const [logoText, setLogoText] = useState(fullText);

  // ✅ User dropdown open/close
  const [userOpen, setUserOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (!animateLogo) {
      setLogoText(fullText);
      return;
    }

    let i = 0;
    setLogoText("");

    const interval = setInterval(() => {
      i++;
      setLogoText(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(interval);
    }, 130);

    return () => clearInterval(interval);
  }, [animateLogo]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target)) setUserOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <header style={styles.navbar}>
      {/* ✅ BRAND */}
      <div
        style={{ ...styles.brand, ...(animateLogo ? styles.brandAnim : null) }}
        aria-label="ServeSpot logo"
        onClick={() => nav("/")}
        role="button"
      >
        {logoText}
        {animateLogo && logoText.length < fullText.length && (
          <span className="ss-cursor">|</span>
        )}
      </div>

      {/* ✅ RIGHT LINKS */}
      <nav style={styles.navLinks}>
        {/* ✅ Admin button (Landing page need) */}
        {showAdmin && (
          <Link to="/admin/login" style={styles.link}>
            Admin
          </Link>
        )}

        {/* ✅ Home button only where needed (Signin/Signup pages) */}
        {showHome && (
          <Link to="/" style={styles.link}>
            Home
          </Link>
        )}

        {/* ✅ Normal Signin button (optional) */}
        {showSignin && (
          <Link to="/signin" style={styles.link}>
            Signin
          </Link>
        )}

        {/* ✅ Normal Signup dropdown (optional) */}
        {showSignup && (
          <div className="signup-wrap">
            <button type="button" style={{ ...styles.link, cursor: "pointer" }}>
              Signup ▾
            </button>

            <div className="signup-menu">
              <Link to="/signup/user" className="signup-item">
                User
              </Link>
              <Link to="/signup/provider" className="signup-item">
                Service Provider
              </Link>
            </div>
          </div>
        )}

        {/* ✅ NEW: User icon dropdown (Landing page requirement) */}
        {showUserMenu && (
          <div ref={userMenuRef} style={{ position: "relative" }}>
            <button
              type="button"
              style={styles.userBtn}
              onClick={() => setUserOpen((p) => !p)}
              aria-label="User menu"
            >
              <img src={userIcon} alt="User" style={styles.userImg} />
            </button>

            {userOpen && (
              <div className="user-menu">
                <button
                  type="button"
                  className="user-item"
                  onClick={() => {
                    setUserOpen(false);
                    nav("/signin");
                  }}
                >
                  Sign In
                </button>

                <button
                  type="button"
                  className="user-item"
                  onClick={() => {
                    setUserOpen(false);
                    nav("/signup/user");
                  }}
                >
                  Sign Up (User)
                </button>

                <button
                  type="button"
                  className="user-item"
                  onClick={() => {
                    setUserOpen(false);
                    nav("/signup/provider");
                  }}
                >
                  Sign Up (Provider)
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      <style>{`
        /* ✅ Signup dropdown */
        .signup-wrap { position: relative; display: inline-block; }
        .signup-menu {
          position: absolute;
          top: 46px;
          right: 0;
          min-width: 200px;
          background: rgba(255,255,255,0.92);
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.10);
          padding: 8px;
          display: none;
          z-index: 999;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .signup-wrap:hover .signup-menu { display: block; }
        .signup-item {
          display: block;
          padding: 10px 12px;
          border-radius: 10px;
          text-decoration: none;
          color: #1f2937;
          font-size: 14px;
          font-weight: 800;
        }
        .signup-item:hover { background: #f3f4f6; }

        /* ✅ Blinking cursor for logo typing */
        .ss-cursor {
          display: inline-block;
          margin-left: 2px;
          font-weight: 900;
          animation: ssBlink 0.8s infinite;
        }
        @keyframes ssBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }

        /* ✅ User dropdown */
        .user-menu{
          position: absolute;
          top: 50px;
          right: 0;
          width: 200px;
          background: rgba(255,255,255,0.92);
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          box-shadow: 0 18px 45px rgba(0,0,0,0.12);
          padding: 8px;
          z-index: 999;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
        .user-item{
          width:100%;
          text-align:left;
          padding: 10px 12px;
          border-radius: 12px;
          border: 0;
          background: transparent;
          cursor: pointer;
          font-weight: 900;
          color: #111827;
        }
        .user-item:hover{
          background:#f3f4f6;
        }
      `}</style>
    </header>
  );
}

const styles = {
  navbar: {
  position: "sticky",
  top: 0,
  zIndex: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 28px",

  background: "transparent",     
  borderBottom: "0",              
  boxShadow: "none",              
  backdropFilter: "none",         
  WebkitBackdropFilter: "none",
},

  brand: {
    fontWeight: 900,
    fontSize: 22,
    color: "#1f2937",
    cursor: "pointer",
    userSelect: "none",
  },

  brandAnim: {
    background: "linear-gradient(90deg, #111827, #4f46e5, #111827)",
    backgroundSize: "200% 100%",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  },

  navLinks: { display: "flex", gap: 14, alignItems: "center" },

  link: {
    textDecoration: "none",
    color: "#1f2937",
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(229,231,235,0.9)",
    background: "rgba(255,255,255,0.55)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    fontSize: 14,
    fontWeight: 900,
  },

  userBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    border: "1px solid rgba(229,231,235,0.9)",
    background: "rgba(255,255,255,0.55)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    padding: 0,
    overflow: "hidden",
  },

  userImg: { width: 22, height: 22, objectFit: "contain" },
};