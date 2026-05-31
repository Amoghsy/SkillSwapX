const heatmap: number[][] = Array.from({ length: 7 }, () =>
  Array.from({ length: 16 }, () => Math.round(Math.random() * 4))
);

export function ActivityHeatmap() {
  return (
    <div className="space-y-1.5">
      {heatmap.map((row, ri) => (
        <div key={ri} className="flex gap-1.5">
          {row.map((v, ci) => {
            const shades = ["bg-white/5", "bg-primary/25", "bg-primary/45", "bg-accent/55", "bg-accent/80"];
            return <div key={ci} className={`h-4 w-4 rounded-md ${shades[v]}`} title={`${v} sessions`} />;
          })}
        </div>
      ))}
      <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
        <span>less</span>
        {["bg-white/5","bg-primary/25","bg-primary/45","bg-accent/55","bg-accent/80"].map((c,i)=>(
          <div key={i} className={`size-3 rounded ${c}`} />
        ))}
        <span>more</span>
      </div>
    </div>
  );
}
