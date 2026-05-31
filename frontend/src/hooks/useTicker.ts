import { useEffect, useState } from "react";
const tickerSeed = [
  "Maya started a session on Design Tokens",
  "Diego published a new roadmap: 'Vector DBs 101'",
  "Sara joined Polyglots Café · 12 online",
  "Kenji is live in Jazz Lab",
  "Noah earned the Architect badge",
  "Priya +8 credits from Growth workshop",
  "Hana scheduled a Breathwork circle",
  "Daniel pushed a D3 storyboard draft",
];

export function useTicker(intervalMs = 3500) {
  const [items, setItems] = useState<string[]>(() => tickerSeed.slice(0, 4));
  useEffect(() => {
    let i = 4;
    const t = setInterval(() => {
      setItems((prev) => [tickerSeed[i % tickerSeed.length], ...prev].slice(0, 5));
      i++;
    }, intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return items;
}
