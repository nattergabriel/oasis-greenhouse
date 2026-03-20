"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

/* Deterministic pseudo-random so SSR matches client (no hydration mismatch) */
function seeded(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const STARS = Array.from({ length: 80 }, (_, i) => ({
  x: seeded(i * 1.1) * 1200,
  y: seeded(i * 2.3) * 560,
  r: seeded(i * 3.7) * 1.2 + 0.3,
  opacity: seeded(i * 5.1) * 0.5 + 0.15,
  dur: (seeded(i * 7.3) * 3 + 2).toFixed(1),
}));

const ARC = "M 220,300 C 420,40 780,40 980,300";

export function EarthToMars() {
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowLogo(true), 3200);
    return () => clearTimeout(t);
  }, []);

  const fontSans = { fontFamily: "var(--font-sans), sans-serif" };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <svg
        viewBox="0 0 1200 600"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="trail-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3d8ab0" />
            <stop offset="50%" stopColor="#d4924a" />
            <stop offset="100%" stopColor="#c75a3a" />
          </linearGradient>

          <radialGradient id="earth-atmo" cx="50%" cy="50%" r="50%">
            <stop offset="82%" stopColor="#1a5a8a" stopOpacity="0" />
            <stop offset="100%" stopColor="#4a9fff" stopOpacity="0.12" />
          </radialGradient>

          <radialGradient id="mars-atmo" cx="50%" cy="50%" r="50%">
            <stop offset="82%" stopColor="#c75a3a" stopOpacity="0" />
            <stop offset="100%" stopColor="#d4924a" stopOpacity="0.08" />
          </radialGradient>

          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>

          <filter id="text-glow" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* ---- Stars ---- */}
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.opacity}>
            <animate
              attributeName="opacity"
              values={`${s.opacity};${(s.opacity * 0.15).toFixed(2)};${s.opacity}`}
              dur={`${s.dur}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}

        {/* ---- Faint planned trajectory ---- */}
        <path
          d={ARC}
          fill="none"
          stroke="#352f28"
          strokeWidth="1"
          strokeDasharray="6 8"
          opacity="0.35"
        />

        {/* ---- Animated trail (glow) ---- */}
        <path
          d={ARC}
          fill="none"
          stroke="url(#trail-grad)"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.08"
          strokeDasharray="1300"
          strokeDashoffset="1300"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="1300"
            to="0"
            dur="2.5s"
            begin="0.5s"
            fill="freeze"
          />
        </path>

        {/* ---- Animated trail (core) ---- */}
        <path
          d={ARC}
          fill="none"
          stroke="url(#trail-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.6"
          strokeDasharray="1300"
          strokeDashoffset="1300"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="1300"
            to="0"
            dur="2.5s"
            begin="0.5s"
            fill="freeze"
          />
        </path>

        {/* ---- Earth ---- */}
        <g>
          <circle cx="150" cy="300" r="72" fill="url(#earth-atmo)" />
          <circle cx="150" cy="300" r="66" fill="none" stroke="#4a9fff" strokeWidth="1" opacity="0.12" />
          <circle cx="150" cy="300" r="60" fill="#0c2d4a" />
          <circle cx="150" cy="300" r="58" fill="#1a4a7a">
            {/* Slight pulse on launch */}
            <animate attributeName="r" values="58;55;58" dur="0.4s" begin="0.5s" fill="freeze" />
          </circle>
          {/* Continents */}
          <path d="M 126,280 Q 143,270 149,290 Q 140,310 122,296 Z" fill="#2d7a4e" opacity="0.75" />
          <path d="M 158,272 Q 176,278 172,298 Q 162,292 158,272 Z" fill="#2d7a4e" opacity="0.65" />
          <path d="M 138,314 Q 158,318 163,326 Q 144,332 138,314 Z" fill="#2d7a4e" opacity="0.55" />
          {/* Specular */}
          <circle cx="134" cy="280" r="18" fill="white" opacity="0.05" />
          {/* Label */}
          <text
            x="150" y="392"
            textAnchor="middle"
            fill="#4a9fff"
            fontSize="13"
            letterSpacing="3"
            opacity="0.45"
            style={fontSans}
          >
            EARTH
          </text>
        </g>

        {/* ---- Mars ---- */}
        <g>
          <circle cx="1050" cy="300" r="62" fill="url(#mars-atmo)" />
          <circle cx="1050" cy="300" r="56" fill="none" stroke="#c75a3a" strokeWidth="1" opacity="0.08" />
          <circle cx="1050" cy="300" r="52" fill="#8a3a20" />
          <circle cx="1050" cy="300" r="50" fill="#c75a3a">
            {/* Pulse on arrival */}
            <animate attributeName="r" values="50;53;50" dur="0.35s" begin="3s" fill="freeze" />
          </circle>
          {/* Surface features */}
          <circle cx="1034" cy="286" r="8" fill="#a04828" opacity="0.45" />
          <circle cx="1062" cy="312" r="12" fill="#d4724a" opacity="0.2" />
          <ellipse cx="1043" cy="308" rx="6" ry="3.5" fill="#a04828" opacity="0.3" />
          {/* Polar cap */}
          <path
            d="M 1024,262 Q 1050,254 1076,262"
            fill="none"
            stroke="#e8e2d9"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.18"
          />
          <circle cx="1036" cy="284" r="14" fill="white" opacity="0.035" />
          {/* Label */}
          <text
            x="1050" y="380"
            textAnchor="middle"
            fill="#c75a3a"
            fontSize="13"
            letterSpacing="3"
            opacity="0.45"
            style={fontSans}
          >
            MARS
          </text>
        </g>

        {/* ---- Landing glow ---- */}
        <circle cx="980" cy="300" r="0" fill="#d4924a" opacity="0" filter="url(#glow)">
          <animate attributeName="r" from="0" to="30" dur="0.5s" begin="3s" fill="freeze" />
          <animate attributeName="opacity" values="0;0.35;0" dur="0.7s" begin="3s" fill="freeze" />
        </circle>

        {/* ---- Spaceship ---- */}
        <g opacity="0">
          {/* Appear just before motion starts */}
          <animate attributeName="opacity" from="0" to="1" dur="0.01s" begin="0.48s" fill="freeze" />
          <animateMotion
            dur="2.5s"
            begin="0.5s"
            fill="freeze"
            rotate="auto"
            path={ARC}
          />

          {/* Exhaust outer */}
          <path d="M -10,-3.5 L -20,0 L -10,3.5" fill="#d4924a" opacity="0.7">
            <animate
              attributeName="d"
              values="M -10,-3.5 L -18,0 L -10,3.5;M -10,-3.5 L -25,0 L -10,3.5;M -10,-3.5 L -18,0 L -10,3.5"
              dur="0.2s"
              repeatCount="indefinite"
            />
          </path>
          {/* Exhaust inner */}
          <path d="M -10,-2 L -14,0 L -10,2" fill="#d4aa30" opacity="0.5">
            <animate
              attributeName="d"
              values="M -10,-2 L -13,0 L -10,2;M -10,-2 L -17,0 L -10,2;M -10,-2 L -13,0 L -10,2"
              dur="0.15s"
              repeatCount="indefinite"
            />
          </path>
          {/* Body */}
          <path d="M -10,-4.5 L 8,-4.5 L 14,0 L 8,4.5 L -10,4.5 Z" fill="#e8e2d9" />
          {/* Window */}
          <circle cx="4" cy="0" r="2.5" fill="#3d8ab0" />
          {/* Top fin */}
          <path d="M -7,-4.5 L -3,-10 L 1,-4.5" fill="#9c9488" />
          {/* Bottom fin */}
          <path d="M -7,4.5 L -3,10 L 1,4.5" fill="#9c9488" />
        </g>

        {/* ---- Logo at bottom center ---- */}
        {showLogo && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9 }}
          >
            {/* Glow behind title */}
            <text
              x="600" y="510"
              textAnchor="middle"
              fill="#d4924a"
              fontSize="32"
              fontWeight="700"
              letterSpacing="5"
              opacity="0.2"
              filter="url(#text-glow)"
              style={fontSans}
            >
              MARS GREENHOUSE
            </text>
            <text
              x="600" y="510"
              textAnchor="middle"
              fill="#d4924a"
              fontSize="32"
              fontWeight="700"
              letterSpacing="5"
              style={fontSans}
            >
              MARS GREENHOUSE
            </text>
            <text
              x="600" y="548"
              textAnchor="middle"
              fill="#9c9488"
              fontSize="15"
              letterSpacing="7"
              style={fontSans}
            >
              COMMAND CENTER
            </text>
          </motion.g>
        )}
      </svg>
    </div>
  );
}
