import { Progress } from "@/components/ui/progress";

export default function ScoreBar({ name, score, weight }) {
  const numericScore = Number(score) || 0;

  // Determine color based on score
  let indicatorColor = "bg-emerald-500";
  if (numericScore > 75) indicatorColor = "bg-red-500";
  else if (numericScore > 50) indicatorColor = "bg-amber-500";

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-end">
        <div>
          <span className="text-sm font-medium">{name}</span>
          {weight && <span className="ml-2 text-xs text-muted-foreground">{weight}</span>}
        </div>
        <span className="text-sm font-bold">{numericScore.toFixed(2)}</span>
      </div>
      <Progress value={numericScore} indicatorColor={indicatorColor} className="h-2" />
    </div>
  );
}
