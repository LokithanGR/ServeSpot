import React, { useEffect, useMemo, useState } from "react";

// ✅ If you have a logo image, put it in: src/assets/logo.png
// then uncomment below line and use <img ... />
// import logo from "../assets/logo.png";

export default function AppLoader({ onDone }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let p = 0;

    const timer = setInterval(() => {
      // ✅ nice smooth speed (random-ish but controlled)
      const step = p < 60 ? 3 : p < 85 ? 2 : 1;
      p = Math.min(100, p + step);

      setPct(p);

      if (p === 100) {
        clearInterval(timer);
        // ✅ small delay to feel complete
        setTimeout(() => onDone?.(), 250);
      }
    }, 35); // speed

    return () => clearInterval(timer);
  }, [onDone]);

  // ✅ SVG circle math
  const size = 180;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = useMemo(() => c - (pct / 100) * c, [pct, c]);

  return (
    <div className="ss-loaderPage">
      <div className="ss-loaderCard">
        <div className="ss-ringWrap">
          <svg width={size} height={size} className="ss-ring">
            {/* track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              className="ss-track"
            />
            {/* progress */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              className="ss-progress"
              style={{
                strokeDasharray: c,
                strokeDashoffset: dash,
              }}
            />
          </svg>

          {/* center logo / image */}
          <div className="ss-centerLogo">
            {/* ✅ Option A: text logo */}
            <div className="ss-logoText">ServeSpot</div>

            {/* ✅ Option B: image logo (uncomment and add logo.png) */}
            {/*
            <img
              src={logo}
              alt="ServeSpot"
              style={{ width: 72, height: 72, objectFit: "contain" }}
            />
            */}
          </div>

          {/* percent */}
          <div className="ss-pct">{pct}%</div>
        </div>

        <div className="ss-loadingLabel">Loading your services… ✨</div>
      </div>

      <style>{`
        .ss-loaderPage{
          min-height: 100vh;
          display: grid;
          place-items: center;
          background:
            radial-gradient(900px 520px at 15% 20%, rgba(79,70,229,0.14), transparent 60%),
            radial-gradient(900px 520px at 85% 25%, rgba(34,197,94,0.10), transparent 60%),
            linear-gradient(180deg, #f8fafc 0%, #eef2ff 40%, #f8fafc 100%);
        }

        .ss-loaderCard{
          width: min(520px, 92%);
          padding: 26px 20px;
          border-radius: 22px;
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(229,231,235,0.9);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 24px 60px rgba(0,0,0,0.14);
          display: grid;
          justify-items: center;
          gap: 14px;
        }

        .ss-ringWrap{
          position: relative;
          width: 220px;
          height: 220px;
          display: grid;
          place-items: center;
        }

        .ss-ring{
          transform: rotate(-90deg);
          filter: drop-shadow(0 16px 28px rgba(79,70,229,0.15));
        }

        .ss-track{
          fill: none;
          stroke: rgba(17,24,39,0.10);
          stroke-width: ${stroke};
        }

        .ss-progress{
          fill: none;
          stroke-width: ${stroke};
          stroke-linecap: round;
          /* ✅ gradient stroke */
          stroke: url(#ssGrad);
          transition: stroke-dashoffset 0.50s ease;
        }

        /* ✅ SVG gradient definition */
        .ss-ring defs { display:none; }

        /* we inject gradient via CSS trick using background? better: inline defs below */
      `}</style>

      {/* ✅ inline defs for gradient (works reliably) */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="ssGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
      </svg>

      <style>{`
        .ss-centerLogo{
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          pointer-events: none;
        }

        .ss-logoText{
          font-weight: 1000;
          font-size: 22px;
          letter-spacing: 0.5px;
          background: linear-gradient(90deg, #111827, #4f46e5, #111827);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: ssShimmer 2.2s ease-in-out infinite;
        }

        @keyframes ssShimmer{
          0%{ background-position: 0% 50%; }
          50%{ background-position: 100% 50%; }
          100%{ background-position: 0% 50%; }
        }

        .ss-pct{
          position: absolute;
          bottom: 22px;
          font-weight: 1000;
          font-size: 16px;
          color: #111827;
          background: rgba(255,255,255,0.75);
          border: 1px solid rgba(229,231,235,0.9);
          padding: 6px 10px;
          border-radius: 999px;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .ss-loadingLabel{
          font-weight: 900;
          color: #374151;
        }
      `}</style>
    </div>
  );
}
