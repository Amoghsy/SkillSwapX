import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

const weeklyActivity = [
  { d: "Mon", taught: 2, learned: 1 },
  { d: "Tue", taught: 1, learned: 2 },
  { d: "Wed", taught: 3, learned: 1 },
  { d: "Thu", taught: 2, learned: 3 },
  { d: "Fri", taught: 1, learned: 2 },
  { d: "Sat", taught: 4, learned: 1 },
  { d: "Sun", taught: 2, learned: 2 },
];

export function WeeklyBars() {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={weeklyActivity} barCategoryGap={18}>
          <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
          <XAxis dataKey="d" tick={{ fill: "oklch(0.7 0.02 250)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "oklch(0.7 0.02 250)", fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
          <Tooltip contentStyle={{ background: "oklch(0.22 0.04 265)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }} cursor={{ fill: "oklch(1 0 0 / 0.04)" }} />
          <Bar dataKey="taught" fill="oklch(0.70 0.18 255)" radius={[6,6,0,0]} />
          <Bar dataKey="learned" fill="oklch(0.62 0.22 295)" radius={[6,6,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
