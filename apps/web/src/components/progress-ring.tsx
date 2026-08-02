export function ProgressRing({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const percentage = Math.round(value * 100);
  return (
    <div
      className="progress-ring"
      style={{ "--progress": `${percentage * 3.6}deg` } as React.CSSProperties}
      role="img"
      aria-label={`${label}: ${percentage}% complete`}
    >
      <span>{percentage}%</span>
    </div>
  );
}
