import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

export default function Home() {
  const nav = useNavigate();

  const [showSignInPopup, setShowSignInPopup] = useState(false);

  const handleFeedbackClick = () => {
    const token = localStorage.getItem("servespot_token");
    if (!token) {
      setShowSignInPopup(true);
      return;
    }
    nav("/feedback");
  };

  const goToSigninForFeedback = () => {
    setShowSignInPopup(false);
    nav("/signin?redirect=/feedback");
  };

  const ICONS = {
    electrician:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none">
        <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8Z" stroke="#111827" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M4 14h7" stroke="#4f46e5" stroke-width="2" stroke-linecap="round"/>
      </svg>`),

    appliance:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none">
        <rect x="6" y="3" width="12" height="18" rx="2" stroke="#111827" stroke-width="1.8"/>
        <path d="M8.5 7h7" stroke="#4f46e5" stroke-width="2" stroke-linecap="round"/>
        <path d="M9 17h6" stroke="#111827" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="9" cy="5.5" r="0.8" fill="#111827"/>
        <circle cx="11.8" cy="5.5" r="0.8" fill="#111827"/>
      </svg>`),

    painting:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none">
        <path d="M4 12l6-6 8 8-6 6H4v-8Z" stroke="#111827" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M14.5 4.5l5 5" stroke="#4f46e5" stroke-width="2" stroke-linecap="round"/>
        <path d="M7 17h4" stroke="#111827" stroke-width="1.8" stroke-linecap="round"/>
      </svg>`),

    womenSpa:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none">
        <path d="M12 3c2 2 2 4 0 6s-2 4 0 6" stroke="#111827" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M8 6c1.7 1.7 1.7 3.3 0 5s-1.7 3.3 0 5" stroke="#4f46e5" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M16 6c1.7 1.7 1.7 3.3 0 5s-1.7 3.3 0 5" stroke="#4f46e5" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M6 19h12" stroke="#111827" stroke-width="1.8" stroke-linecap="round"/>
      </svg>`),

    menSalon:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none">
        <path d="M7 3l10 6-10 6V3Z" stroke="#111827" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M9 21c1.5-4 4.5-4 6 0" stroke="#4f46e5" stroke-width="2" stroke-linecap="round"/>
        <path d="M12 15v3" stroke="#111827" stroke-width="1.8" stroke-linecap="round"/>
      </svg>`),

    cleaning:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none">
        <path d="M6 21h12" stroke="#111827" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M9 21V9h6v12" stroke="#111827" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M8 9l1-5h6l1 5" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`),
  };

  const cards = [
    {
      icon: ICONS.electrician,
      front: "Electrician, Plumber and Carpenter",
      back: "Fix wiring ⚡ | Plumbing 🚰 | Carpentry 🔨",
    },
    {
      icon: ICONS.appliance,
      front: "Ac&Appliance Repair",
      back: "AC ❄️ | Fridge | Washing Machine Repair",
    },
    {
      icon: ICONS.painting,
      front: "Painting&Waterproofing",
      back: "Wall Painting 🎨 | Leak Protection 💧",
    },
    {
      icon: ICONS.womenSpa,
      front: "Women spa/saloon",
      back: "Facial 💆‍♀️ | Hair styling | Beauty care",
    },
    {
      icon: ICONS.menSalon,
      front: "Men saloon",
      back: "Haircut 💈 | Beard styling | Grooming",
    },
    {
      icon: ICONS.cleaning,
      front: "Cleaning & Pest control",
      back: "Deep cleaning 🧹 | Pest removal 🐜",
    },
  ];

  const fullSubtitle =
    "ServeSpot helps you find trusted professionals near you — from home repairs to cleaning and grooming.";
  const [typedSubtitle, setTypedSubtitle] = useState("");
  const [typingDone, setTypingDone] = useState(false);

  useEffect(() => {
    let i = 0;
    setTypedSubtitle("");
    setTypingDone(false);

    const timer = setInterval(() => {
      i += 1;
      setTypedSubtitle(fullSubtitle.slice(0, i));

      if (i >= fullSubtitle.length) {
        clearInterval(timer);
        setTypingDone(true);
      }
    }, 50);

    return () => clearInterval(timer);
  }, []);

  return (
    <div style={styles.page}>
      {}
      <div className="ss-topGlass">
        <Navbar
          showAdmin
          showUserMenu
          animateLogo
          showHome={false}
          showSignin={false}
          showSignup={false}
        />
      </div>

      {}
      <main style={styles.main} className="ss-content">
        <section style={styles.hero}>
          <h1 style={styles.title} className="ss-heroTitle">
            Home Services at your Doorstep
          </h1>

          <p style={styles.subtitle} className="ss-heroSub">
            <span className="ss-typedText">{typedSubtitle}</span>
            {!typingDone && <span className="ss-caret">|</span>}
          </p>
        </section>

        <div style={{ textAlign: "center" }}>
          <h2 style={styles.middleHeading} className="ss-breathe">
            What are U looking for!!!
          </h2>
        </div>

        <section style={styles.section}>
          <div style={styles.grid}>
            {cards.map((c, i) => (
              <div key={i} className="flipWrapper">
                <div className="flipCard">
                  <div className="flipFront">
                    <img className="ss-cardIcon" src={c.icon} alt="" />
                    <h3 style={{ margin: 0 }}>{c.front}</h3>
                  </div>

                  <div className="flipBack">
                    <p style={{ margin: 0 }}>{c.back}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {}
      <footer style={styles.footer} className="ss-footer">
        © Servespot- 2026
      </footer>

      {}
      <button className="ss-feedback" onClick={handleFeedbackClick}>
        FEEDBACK
      </button>

      {}
      {showSignInPopup && (
        <div
          className="ss-modal-overlay"
          onClick={() => setShowSignInPopup(false)}
        >
          <div className="ss-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ss-modal-title">Please sign in to give feedback</div>
            <div className="ss-modal-actions">
              <button
                className="ss-btn ss-btn-ghost"
                onClick={() => setShowSignInPopup(false)}
              >
                Cancel
              </button>
              <button
                className="ss-btn ss-btn-primary"
                onClick={goToSigninForFeedback}
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .ss-content{ position: relative; z-index: 2; }

        .ss-topGlass{
          position: sticky;
          top: 0;
          z-index: 20;
          background: transparent;
          border-bottom: 0;
          box-shadow: none;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }

        .ss-footer{
          position: relative;
          z-index: 5;
        }

        /* ✅ flip cards: ONLY rotate + shadow */
        .flipWrapper{ perspective: 1000px; }

        .flipCard{
          position: relative;
          width: 100%;
          height: 170px;
          transform-style: preserve-3d;
          transition: transform 0.6s;
        }

        .flipWrapper:hover .flipCard{
          transform: rotateY(180deg);
        }

        .flipFront,
        .flipBack{
          position:absolute;
          inset:0;
          border-radius:18px;
          display:flex;
          align-items:center;
          justify-content:center;
          text-align:center;
          padding:18px;
          backface-visibility:hidden;
          overflow:hidden;

          background: rgba(255,255,255,0.20);
          border: 1px solid rgba(255,255,255,0.38);
          box-shadow: 0 16px 36px rgba(0,0,0,0.12);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .flipFront{
          font-weight: 900;
          flex-direction: column;
          gap: 10px;
        }

        .ss-cardIcon{
          width: 46px;
          height: 46px;
          opacity: 0.95;
          filter: drop-shadow(0 10px 18px rgba(79,70,229,0.20));
          user-select:none;
          pointer-events:none;
          position:relative;
        }

        .flipBack{
          transform: rotateY(180deg);
          font-weight: 800;
        }

        /* feedback button */
        .ss-feedback{
          position: fixed;
          right: 14px;
          top: 50%;
          transform: translateY(-50%) rotate(180deg);
          padding: 14px 12px;
          border-radius: 12px;
          border: 0;
          background: #2563eb;
          color: #fff;
          font-weight: 900;
          letter-spacing: 1px;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(0,0,0,0.18);
          writing-mode: vertical-rl;
          text-orientation: mixed;
          z-index:999;
        }
        .ss-feedback:hover{
          transform: translateY(-50%) rotate(180deg) scale(1.05);
          box-shadow: 0 16px 36px rgba(0,0,0,0.22);
        }

        /* hero title shimmer */
        .ss-heroTitle{
          position: relative;
          display: inline-block;
          line-height: 1.1;
          background: linear-gradient(90deg, #111827, #4f46e5, #111827);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: titleShimmer 2.6s ease-in-out infinite, titleFloat 3.2s ease-in-out infinite;
          text-shadow: 0 8px 26px rgba(79,70,229,0.18);
        }
        @keyframes titleShimmer{
          0%{ background-position: 0% 50%; }
          50%{ background-position: 100% 50%; }
          100%{ background-position: 0% 50%; }
        }
        @keyframes titleFloat{
          0%, 100%{ transform: translateY(0px); }
          50%{ transform: translateY(-6px); }
        }

        .ss-heroSub{ margin-top: 16px; text-align: center; }

        .ss-typedText{
          background: linear-gradient(90deg, #111827, #4f46e5, #111827);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: subShimmer 2.4s ease-in-out infinite;
          font-weight: 800;
        }
        @keyframes subShimmer{
          0%{ background-position: 0% 50%; }
          50%{ background-position: 100% 50%; }
          100%{ background-position: 0% 50%; }
        }

        .ss-caret{
          display: inline-block;
          margin-left: 2px;
          color: #4f46e5;
          font-weight: 900;
          animation: caretBlink 0.65s infinite;
        }
        @keyframes caretBlink{
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }

        .ss-breathe{
          display: inline-block;
          animation: ssBreathe 2.4s ease-in-out infinite;
          transform-origin: center;
          text-align:center;
          margin: 0 auto;
        }
        @keyframes ssBreathe{
          0%, 100%{ transform: scale(1); opacity: 0.85; }
          50%{ transform: scale(1.06); opacity: 1; }
        }

        /* ✅ SIGNIN POPUP STYLES */
        .ss-modal-overlay{
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 18px;
        }

        .ss-modal{
          width: min(420px, 100%);
          border-radius: 18px;
          background: rgba(255,255,255,0.75);
          border: 1px solid rgba(229,231,235,0.95);
          box-shadow: 0 24px 70px rgba(0,0,0,0.22);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: 18px 18px 16px;
        }

        .ss-modal-title{
          font-weight: 900;
          font-size: 16px;
          color: #0f172a;
        }

        .ss-modal-sub{
          margin-top: 6px;
          font-size: 13px;
          font-weight: 700;
          color: rgba(15,23,42,0.70);
          line-height: 1.35;
        }

        .ss-modal-actions{
          margin-top: 14px;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .ss-btn{
          border: 0;
          border-radius: 12px;
          padding: 10px 12px;
          font-weight: 900;
          cursor: pointer;
        }

        .ss-btn-ghost{
          background: rgba(15,23,42,0.06);
          color: rgba(15,23,42,0.85);
        }

        .ss-btn-primary{
          background: rgba(99,102,241,0.95);
          color: white;
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#1f2937",
    display: "flex",
    flexDirection: "column",
    position: "relative",
  },

  main: {
    width: "min(1100px,92%)",
    margin: "0 auto",
    flex: 1,
    position: "relative",
    zIndex: 2,
  },

  hero: {
    padding: "70px 0 20px",
    textAlign: "center",
  },

  title: {
    fontSize: "clamp(28px,4vw,48px)",
    fontWeight: 900,
    margin: 0,
  },

  subtitle: {
    maxWidth: 820,
    margin: "16px auto 0",
    fontSize: 16,
    lineHeight: 1.7,
    color: "#6b7280",
  },

  middleHeading: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: 800,
    marginTop: 40,
    marginBottom: 20,
  },

  section: { padding: "10px 0 70px" },

  grid: {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(3,1fr)",
  },

  footer: {
    borderTop: "0",
    padding: "22px 0",
    textAlign: "center",
    color: "#6b7280",
    fontWeight: 800,
    background: "transparent",
  },
};