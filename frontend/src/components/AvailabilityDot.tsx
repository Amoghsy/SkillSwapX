export function AvailabilityDot({ online }: { online: boolean }) {
  return (
    <span className="relative inline-flex">
      <span className={`size-2 rounded-full ${online ? "bg-emerald-400" : "bg-muted-foreground/50"}`} />
      {online && <span className="absolute inset-0 size-2 animate-ping rounded-full bg-emerald-400/60" />}
    </span>
  );
}
