"use client";

import { useMemo } from "react";
import { useSimulation } from "@/providers/simulation-provider";
import { mockGreenhouseDetails, mockWeather } from "@/lib/mock-data";
import type { PlantSlot } from "@/lib/types";

// Unique SVG IDs per instance to avoid clashes when rendered multiple times
let instanceCounter = 0;
function useInstanceId() {
  return useMemo(() => `gh-${++instanceCounter}`, []);
}

function getGrowthStage(p: number) {
  if (p <= 0) return 0;
  if (p < 20) return 1;
  if (p < 45) return 2;
  if (p < 70) return 3;
  if (p < 90) return 4;
  return 5;
}

function healthColor(status: string) {
  if (status === "HEALTHY") return "#4ead6b";
  if (status === "NEEDS_ATTENTION") return "#d4aa30";
  if (status === "CRITICAL") return "#8b4030";
  return "#3d3530";
}

function leafDark(status: string) {
  if (status === "HEALTHY") return "#3a7a48";
  if (status === "NEEDS_ATTENTION") return "#9a8025";
  if (status === "CRITICAL") return "#6b3525";
  return "#2a2520";
}

// Crop-specific fruit color
function fruitColor(name: string) {
  if (name === "Herbs") return "#7c6aad";
  if (name === "Radish") return "#c75a6a";
  if (name === "Beans & Peas") return "#8a9a44";
  if (name === "Potato") return "#d4aa30";
  return "#d4924a"; // Lettuce
}

// Crop-specific shape variation
function cropShape(name: string): "round" | "tall" | "bushy" | "rosette" | "root" {
  if (name === "Lettuce") return "rosette";
  if (name === "Beans & Peas") return "tall";
  if (name === "Herbs") return "bushy";
  if (name === "Potato" || name === "Radish") return "root";
  return "round";
}

function Plant({
  cx,
  groundY,
  slot,
  scale = 1,
}: {
  cx: number;
  groundY: number;
  slot: PlantSlot;
  scale?: number;
}) {
  if (!slot.cropName) {
    return (
      <rect x={cx - 8 * scale} y={groundY - 1} width={16 * scale} height={2} rx={1} fill="#3d3530" opacity={0.6} />
    );
  }

  const stage = getGrowthStage(slot.growthStagePercent);
  const hc = healthColor(slot.status);
  const dc = leafDark(slot.status);
  const fc = fruitColor(slot.cropName);
  const shape = cropShape(slot.cropName);
  const s = scale;

  if (stage === 0) {
    return <rect x={cx - 6 * s} y={groundY - 1} width={12 * s} height={2} rx={1} fill="#3d3530" opacity={0.4} />;
  }

  // Scale dimensions by growth stage
  const stemH = [0, 6, 14, 22, 28, 32][stage] * s;
  const leafR = [0, 2, 5, 8, 10, 12][stage] * s;
  const showFruit = stage >= 4;
  const harvestReady = stage === 5 && slot.status === "HEALTHY";

  return (
    <g>
      {/* Soil mound */}
      <ellipse cx={cx} cy={groundY} rx={8 * s} ry={2 * s} fill="#3d3530" />

      {/* Root hint for mature */}
      {stage >= 3 && (
        <line x1={cx} y1={groundY} x2={cx} y2={groundY + 3 * s} stroke="#4a3a30" strokeWidth={0.5 * s} opacity={0.3} />
      )}

      {/* Main stem */}
      <line
        x1={cx}
        y1={groundY - 1}
        x2={cx}
        y2={groundY - stemH}
        stroke={slot.status === "CRITICAL" ? "#6b5040" : "#3a6a40"}
        strokeWidth={Math.max(0.8, stage * 0.3) * s}
        strokeLinecap="round"
      />

      {/* Shape-specific rendering */}
      {shape === "rosette" && (
        <g>
          {/* Low, spreading leaves — lettuce */}
          {stage >= 2 && (
            <>
              <ellipse cx={cx - leafR * 0.7} cy={groundY - stemH * 0.4} rx={leafR * 0.9} ry={leafR * 0.35} fill={hc} opacity={0.85} transform={`rotate(-20 ${cx - leafR * 0.7} ${groundY - stemH * 0.4})`} />
              <ellipse cx={cx + leafR * 0.7} cy={groundY - stemH * 0.5} rx={leafR * 0.9} ry={leafR * 0.35} fill={hc} opacity={0.85} transform={`rotate(20 ${cx + leafR * 0.7} ${groundY - stemH * 0.5})`} />
            </>
          )}
          {stage >= 3 && (
            <>
              <ellipse cx={cx - leafR * 0.3} cy={groundY - stemH * 0.7} rx={leafR * 0.7} ry={leafR * 0.3} fill={dc} opacity={0.7} transform={`rotate(-40 ${cx - leafR * 0.3} ${groundY - stemH * 0.7})`} />
              <ellipse cx={cx + leafR * 0.3} cy={groundY - stemH * 0.75} rx={leafR * 0.7} ry={leafR * 0.3} fill={dc} opacity={0.7} transform={`rotate(40 ${cx + leafR * 0.3} ${groundY - stemH * 0.75})`} />
            </>
          )}
          <ellipse cx={cx} cy={groundY - stemH} rx={leafR * 0.6} ry={leafR * 0.4} fill={hc} />
        </g>
      )}

      {shape === "tall" && (
        <g>
          {/* Upright with side branches — beans/peas */}
          {stage >= 2 && (
            <>
              <line x1={cx} y1={groundY - stemH * 0.4} x2={cx - leafR * 0.8} y2={groundY - stemH * 0.55} stroke="#3a6a40" strokeWidth={0.5 * s} />
              <ellipse cx={cx - leafR * 0.8} cy={groundY - stemH * 0.55} rx={leafR * 0.5} ry={leafR * 0.25} fill={hc} opacity={0.8} transform={`rotate(-25 ${cx - leafR * 0.8} ${groundY - stemH * 0.55})`} />
              <line x1={cx} y1={groundY - stemH * 0.6} x2={cx + leafR * 0.7} y2={groundY - stemH * 0.72} stroke="#3a6a40" strokeWidth={0.5 * s} />
              <ellipse cx={cx + leafR * 0.7} cy={groundY - stemH * 0.72} rx={leafR * 0.5} ry={leafR * 0.25} fill={hc} opacity={0.8} transform={`rotate(25 ${cx + leafR * 0.7} ${groundY - stemH * 0.72})`} />
            </>
          )}
          {stage >= 3 && (
            <ellipse cx={cx} cy={groundY - stemH + leafR * 0.2} rx={leafR * 0.55} ry={leafR * 0.35} fill={dc} opacity={0.8} />
          )}
          <ellipse cx={cx} cy={groundY - stemH} rx={leafR * 0.4} ry={leafR * 0.3} fill={hc} />
        </g>
      )}

      {shape === "bushy" && (
        <g>
          {/* Bushy herb shape */}
          {stage >= 2 && (
            <>
              <ellipse cx={cx - leafR * 0.4} cy={groundY - stemH * 0.5} rx={leafR * 0.7} ry={leafR * 0.4} fill={hc} opacity={0.75} />
              <ellipse cx={cx + leafR * 0.4} cy={groundY - stemH * 0.6} rx={leafR * 0.7} ry={leafR * 0.4} fill={dc} opacity={0.7} />
            </>
          )}
          <ellipse cx={cx} cy={groundY - stemH} rx={leafR * 0.65} ry={leafR * 0.45} fill={hc} />
          {stage >= 3 && (
            <ellipse cx={cx} cy={groundY - stemH - leafR * 0.2} rx={leafR * 0.4} ry={leafR * 0.3} fill={dc} opacity={0.6} />
          )}
        </g>
      )}

      {shape === "root" && (
        <g>
          {/* Root vegetable — potato/radish: visible tuber bulge at soil line */}
          {stage >= 2 && (
            <ellipse cx={cx} cy={groundY - stemH * 0.5} rx={leafR * 0.6} ry={leafR * 0.35} fill={dc} opacity={0.7} />
          )}
          <ellipse cx={cx} cy={groundY - stemH} rx={leafR * 0.5} ry={leafR * 0.35} fill={hc} />
          {/* Tuber/root bulge at soil line */}
          {stage >= 3 && (
            <ellipse cx={cx} cy={groundY + 1} rx={leafR * 0.45} ry={leafR * 0.3} fill={fc} opacity={0.6} />
          )}
          {stage >= 4 && (
            <ellipse cx={cx} cy={groundY + 1} rx={leafR * 0.55} ry={leafR * 0.35} fill={fc} opacity={0.7} />
          )}
        </g>
      )}

      {shape === "round" && (
        <g>
          {stage >= 2 && (
            <ellipse cx={cx} cy={groundY - stemH * 0.6} rx={leafR * 0.6} ry={leafR * 0.35} fill={dc} opacity={0.7} />
          )}
          <ellipse cx={cx} cy={groundY - stemH} rx={leafR * 0.5} ry={leafR * 0.4} fill={hc} />
        </g>
      )}

      {/* Fruit / flower dots (non-root crops) */}
      {showFruit && shape !== "root" && (
        <>
          <circle cx={cx - 3 * s} cy={groundY - stemH * 0.65} r={1.8 * s} fill={fc}>
            <animate attributeName="opacity" values="0.75;1;0.75" dur="3s" repeatCount="indefinite" />
          </circle>
          {stage === 5 && (
            <>
              <circle cx={cx + 4 * s} cy={groundY - stemH * 0.5} r={2.2 * s} fill={fc}>
                <animate attributeName="opacity" values="0.85;0.6;0.85" dur="2.5s" repeatCount="indefinite" />
              </circle>
              <circle cx={cx - 1 * s} cy={groundY - stemH * 0.8} r={1.5 * s} fill={fc} opacity={0.7} />
            </>
          )}
        </>
      )}

      {/* Harvest-ready golden glow */}
      {harvestReady && (
        <circle cx={cx} cy={groundY - stemH * 0.7} r={leafR + 5 * s} fill="#d4924a" opacity={0.06}>
          <animate attributeName="r" values={`${leafR + 3 * s};${leafR + 7 * s};${leafR + 3 * s}`} dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.03;0.09;0.03" dur="2.5s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Stress blink */}
      {slot.status === "CRITICAL" && (
        <circle cx={cx} cy={groundY - stemH - 5 * s} r={1.5 * s} fill="#c75a3a">
          <animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Needs attention subtle pulse */}
      {slot.status === "NEEDS_ATTENTION" && (
        <circle cx={cx} cy={groundY - stemH - 4 * s} r={1.2 * s} fill="#d4aa30" opacity={0.5}>
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );
}

function DustParticles({ intensity, viewW }: { intensity: number; viewW: number }) {
  if (intensity < 2) return null;
  const count = Math.min(Math.floor(intensity * 4), 25);
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const startX = (i * 41) % viewW;
        const y = 15 + (i * 19) % 70;
        const size = 0.6 + (i % 4) * 0.4;
        const dur = 1.5 + (i % 5) * 0.8;
        const opacity = 0.08 + intensity * 0.025;
        return (
          <circle key={i} r={size} fill="#d4aa30" opacity={opacity}>
            <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={`M${startX},${y} L${startX + 100},${y - 8 + (i % 3) * 4}`} />
          </circle>
        );
      })}
    </g>
  );
}

export function GreenhouseCrossSection({ compact = false }: { compact?: boolean }) {
  const instId = useInstanceId();
  const { state } = useSimulation();
  const ghId = state.selectedGreenhouseId ?? state.greenhouses[0]?.id;
  const detail = ghId ? mockGreenhouseDetails[ghId] : null;
  const weather = mockWeather;

  if (!detail) return null;

  const viewW = 480;
  const viewH = compact ? 200 : 240;
  const groundY = viewH - 28;
  const domeW = viewW - 60;
  const domeCX = viewW / 2;
  const domeRY = groundY - 25;
  const halfDomeW = domeW / 2;
  const isDusty = weather.dustStormIndex > 3;

  // Half-dome arc paths (semicircle from left base to right base)
  const domeArc = `M ${domeCX - halfDomeW} ${groundY} A ${halfDomeW} ${domeRY} 0 0 1 ${domeCX + halfDomeW} ${groundY}`;
  const domeClosedArc = `${domeArc} Z`;

  // Sun position — follows an arc across the sky based on mission day
  const solPhase = (state.currentMissionDay % 5) / 5;
  const sunAngle = Math.PI * (0.15 + solPhase * 0.7);
  const sunArcRX = viewW * 0.38;
  const sunArcRY = viewH * 0.52;
  const sunX = domeCX - sunArcRX * Math.cos(sunAngle);
  const sunY = groundY - sunArcRY * Math.sin(sunAngle);
  const sunHeight = Math.sin(sunAngle);
  const starBrightness = Math.max(0.08, 0.35 - sunHeight * 0.3);

  // Show 2 rows of plants to fill the dome
  const row0 = detail.slots.filter((s) => s.position.row === 0);
  const row1 = detail.slots.filter((s) => s.position.row === 1);
  const plantStartX = domeCX - halfDomeW + 40;
  const plantAreaW = domeW - 80;

  return (
    <div className="rounded-lg overflow-hidden border border-border bg-[#060504] h-full">
      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        className="w-full"
        style={{ display: "block", height: compact ? "100%" : "280px" }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Sky */}
          <linearGradient id={`${instId}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d0806" />
            <stop offset="30%" stopColor="#1a0e08" />
            <stop offset="70%" stopColor="#2d1810" />
            <stop offset="100%" stopColor="#3d2518" />
          </linearGradient>
          {/* Dome glass */}
          <radialGradient id={`${instId}-glass`} cx="50%" cy="70%" r="70%">
            <stop offset="0%" stopColor="#e8e2d9" stopOpacity={0.05} />
            <stop offset="100%" stopColor="#e8e2d9" stopOpacity={0.015} />
          </radialGradient>
          {/* Dome highlight */}
          <radialGradient id={`${instId}-highlight`} cx="35%" cy="40%" r="40%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.04} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
          </radialGradient>
          {/* Interior glow */}
          <radialGradient id={`${instId}-glow`} cx="50%" cy="80%" r="60%">
            <stop offset="0%" stopColor="#7c6aad" stopOpacity={0.04} />
            <stop offset="100%" stopColor="#7c6aad" stopOpacity={0} />
          </radialGradient>
          {/* Clip to half-dome */}
          <clipPath id={`${instId}-clip`}>
            <path d={domeClosedArc} />
          </clipPath>
        </defs>

        {/* Background */}
        <rect width={viewW} height={viewH} fill={`url(#${instId}-sky)`} />

        {/* Stars — brightness varies with sun position */}
        {Array.from({ length: 20 }, (_, i) => (
          <circle
            key={i}
            cx={12 + ((i * 43 + 7) % (viewW - 24))}
            cy={5 + ((i * 17 + 3) % 50)}
            r={0.3 + (i % 4) * 0.2}
            fill="#e8e2d9"
            opacity={starBrightness + (i % 5) * 0.04}
          >
            <animate attributeName="opacity" values={`${starBrightness * 0.5};${starBrightness + 0.1};${starBrightness * 0.5}`} dur={`${2.5 + (i % 6) * 0.7}s`} repeatCount="indefinite" />
          </circle>
        ))}

        {/* Distant Mars mountains */}
        <polygon points={`0,${groundY} 60,${groundY - 18} 130,${groundY - 8} 200,${groundY - 22} 280,${groundY - 12} 360,${groundY - 20} 420,${groundY - 10} ${viewW},${groundY} ${viewW},${groundY}`} fill="#1e1210" opacity={0.6} />

        {/* Mars terrain */}
        <rect x={0} y={groundY} width={viewW} height={viewH - groundY} fill="#2d1810" />
        {/* Terrain texture */}
        <ellipse cx={35} cy={groundY + 6} rx={25} ry={4} fill="#3d2518" opacity={0.4} />
        <ellipse cx={viewW - 50} cy={groundY + 8} rx={35} ry={5} fill="#3d2518" opacity={0.35} />
        <ellipse cx={viewW / 2 + 60} cy={groundY + 4} rx={20} ry={3} fill="#3a2015" opacity={0.3} />

        {/* Dust */}
        <DustParticles intensity={weather.dustStormIndex} viewW={viewW} />

        {/* Sun — position follows arc based on mission day */}
        <circle cx={sunX} cy={sunY} r={14} fill="#d4924a" opacity={isDusty ? 0.08 : 0.15}>
          <animate attributeName="opacity" values={isDusty ? "0.05;0.12;0.05" : "0.1;0.2;0.1"} dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx={sunX} cy={sunY} r={7} fill="#d4924a" opacity={isDusty ? 0.2 : 0.45} />
        {/* Sun rays toward dome */}
        {!isDusty && [0, 1, 2].map((i) => (
          <line
            key={i}
            x1={sunX}
            y1={sunY + 12}
            x2={domeCX + 30 - i * 30}
            y2={groundY - domeRY * (0.4 + i * 0.1)}
            stroke="#d4924a"
            strokeWidth={0.4}
            opacity={0.05 - i * 0.012}
          />
        ))}

        {/* === DOME (half-circle) === */}
        {/* Dome fill */}
        <path d={domeClosedArc} fill={`url(#${instId}-glass)`} />
        {/* Dome highlight */}
        <path d={domeClosedArc} fill={`url(#${instId}-highlight)`} />

        {/* Dome structural frame — arc outline + flat base */}
        <path d={domeArc} fill="none" stroke="#9c948860" strokeWidth={1.2} />
        <line x1={domeCX - halfDomeW} y1={groundY} x2={domeCX + halfDomeW} y2={groundY} stroke="#9c948860" strokeWidth={1.2} />

        {/* Horizontal ribs */}
        {[0.35, 0.6].map((f) => {
          const ribY = groundY - domeRY * f;
          const ribHalfW = halfDomeW * Math.sqrt(1 - f * f);
          return (
            <line key={f} x1={domeCX - ribHalfW} y1={ribY} x2={domeCX + ribHalfW} y2={ribY} stroke="#9c9488" strokeWidth={0.3} opacity={0.15} />
          );
        })}
        {/* Vertical ribs */}
        {[0.2, 0.4, 0.5, 0.6, 0.8].map((t) => {
          const ribX = domeCX - halfDomeW + domeW * t;
          const normalized = (t - 0.5) * 2;
          const ribH = Math.sqrt(Math.max(0, 1 - normalized * normalized)) * domeRY;
          return (
            <line key={t} x1={ribX} y1={groundY} x2={ribX} y2={groundY - ribH} stroke="#9c9488" strokeWidth={0.3} opacity={0.12} />
          );
        })}

        {/* === INTERIOR (clipped to half-dome) === */}
        <g clipPath={`url(#${instId}-clip)`}>
          {/* Interior ambient glow from LEDs */}
          <ellipse cx={domeCX} cy={groundY - 10} rx={domeW * 0.4} ry={domeRY * 0.5} fill={`url(#${instId}-glow)`} />

          {/* Interior floor */}
          <rect x={domeCX - halfDomeW + 15} y={groundY - 5} width={domeW - 30} height={6} rx={1} fill="#14110e" />

          {/* LED grow lights on ceiling */}
          {Array.from({ length: 7 }, (_, i) => {
            const lx = plantStartX + (plantAreaW / 8) * (i + 1);
            return (
              <g key={i}>
                <rect x={lx - 5} y={groundY - domeRY * 0.55} width={10} height={2.5} rx={1} fill="#7c6aad" opacity={0.5} />
                {/* Light cone */}
                <polygon
                  points={`${lx - 3},${groundY - domeRY * 0.53} ${lx + 3},${groundY - domeRY * 0.53} ${lx + 10},${groundY - 8} ${lx - 10},${groundY - 8}`}
                  fill="#7c6aad"
                  opacity={0.02}
                />
              </g>
            );
          })}

          {/* Irrigation pipe */}
          <line
            x1={plantStartX - 5}
            y1={groundY - 2}
            x2={plantStartX + plantAreaW + 5}
            y2={groundY - 2}
            stroke="#3d8ab0"
            strokeWidth={0.8}
            opacity={0.25}
            strokeDasharray="3 1.5"
          />

          {/* Back row of plants (row 1) — smaller, pushed back */}
          {row1.map((slot, i) => {
            const spacing = plantAreaW / Math.max(row1.length, 1);
            return (
              <Plant
                key={slot.id}
                cx={plantStartX + spacing * i + spacing / 2}
                groundY={groundY - 14}
                slot={slot}
                scale={0.7}
              />
            );
          })}

          {/* Front row of plants (row 0) — full size */}
          {row0.map((slot, i) => {
            const spacing = plantAreaW / Math.max(row0.length, 1);
            return (
              <Plant
                key={slot.id}
                cx={plantStartX + spacing * i + spacing / 2}
                groundY={groundY - 5}
                slot={slot}
                scale={1}
              />
            );
          })}

          {/* Sensor nodes on walls */}
          {[0.15, 0.85].map((t) => {
            const nx = domeCX - halfDomeW + domeW * t;
            const ny = groundY - domeRY * 0.3;
            return (
              <g key={t}>
                <rect x={nx - 2} y={ny - 2} width={4} height={4} rx={1} fill="#211f1b" stroke="#9c9488" strokeWidth={0.3} opacity={0.5} />
                <circle cx={nx} cy={ny} r={0.8} fill="#4ead6b" opacity={0.6}>
                  <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" />
                </circle>
              </g>
            );
          })}
        </g>

        {/* SOL label */}
        <text x={10} y={viewH - 8} fill="#9c9488" fontSize={8} fontFamily="monospace" opacity={0.6}>
          SOL {state.currentMissionDay}
        </text>
      </svg>
    </div>
  );
}
