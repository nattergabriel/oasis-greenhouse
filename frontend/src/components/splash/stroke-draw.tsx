"use client";

export function StrokeDraw() {
  const fontSans = { fontFamily: "var(--font-sans), sans-serif" };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <svg viewBox="0 0 820 220" className="w-full max-w-4xl px-8">
        <defs>
          <clipPath id="fill-reveal">
            <rect x="0" y="220" width="820" height="220">
              <animate
                attributeName="y"
                from="220"
                to="0"
                dur="0.8s"
                begin="1.8s"
                fill="freeze"
              />
            </rect>
          </clipPath>

          <filter id="stroke-glow" x="-10%" y="-30%" width="120%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
          </filter>
        </defs>

        {/* Glow layer - fades in during fill phase */}
        <text
          x="410" y="95"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#d4924a"
          fontSize="68"
          fontWeight="700"
          letterSpacing="5"
          opacity="0"
          filter="url(#stroke-glow)"
          style={fontSans}
        >
          <animate
            attributeName="opacity"
            from="0"
            to="0.2"
            dur="0.8s"
            begin="1.8s"
            fill="freeze"
          />
          MARS GREENHOUSE
        </text>

        {/* Stroke text - draws the outline */}
        <text
          x="410" y="95"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="none"
          stroke="#d4924a"
          strokeWidth="1.5"
          fontSize="68"
          fontWeight="700"
          letterSpacing="5"
          style={fontSans}
          strokeDasharray="3000"
          strokeDashoffset="3000"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="3000"
            to="0"
            dur="1.5s"
            begin="0.2s"
            fill="freeze"
          />
          MARS GREENHOUSE
        </text>

        {/* Fill text - reveals from bottom via clipPath */}
        <text
          x="410" y="95"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#d4924a"
          fontSize="68"
          fontWeight="700"
          letterSpacing="5"
          clipPath="url(#fill-reveal)"
          style={fontSans}
        >
          MARS GREENHOUSE
        </text>

        {/* Subtitle */}
        <text
          x="410" y="165"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#9c9488"
          fontSize="22"
          letterSpacing="8"
          opacity="0"
          style={fontSans}
        >
          <animate
            attributeName="opacity"
            from="0"
            to="1"
            dur="0.5s"
            begin="2.8s"
            fill="freeze"
          />
          COMMAND CENTER
        </text>
      </svg>
    </div>
  );
}
