"use client";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";

const skillRadar = [
  { axis: "Engineering", you: 92, peers: 70 },
  { axis: "Design", you: 64, peers: 60 },
  { axis: "Communication", you: 78, peers: 72 },
  { axis: "Languages", you: 41, peers: 55 },
  { axis: "Music", you: 38, peers: 50 },
  { axis: "Strategy", you: 81, peers: 65 },
];

export function SkillRadar() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <RadarChart data={skillRadar} outerRadius="78%">
          <PolarGrid stroke="oklch(1 0 0 / 0.08)" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: "oklch(0.78 0.02 250)", fontSize: 11 }} />
          <Tooltip contentStyle={{ background: "oklch(0.22 0.04 265)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }} />
          <Radar name="Peers" dataKey="peers" stroke="oklch(0.62 0.22 295)" fill="oklch(0.62 0.22 295)" fillOpacity={0.15} />
          <Radar name="You" dataKey="you" stroke="oklch(0.70 0.18 255)" fill="oklch(0.70 0.18 255)" fillOpacity={0.35} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
