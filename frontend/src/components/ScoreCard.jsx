import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function ScoreCard({ title, score, highlight }) {
  const numericScore = Number(score) || 0;
  
  // Decide a subtle color based on score magnitude if we want, or just a static nice color
  const colorClass = highlight 
    ? "text-primary border-primary/50 bg-primary/5" 
    : "text-muted-foreground";

  return (
    <Card className={cn("overflow-hidden transition-all duration-200 hover:shadow-md", highlight ? "border-primary/50" : "")}>
      <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
        <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
        <p className={cn("text-3xl font-bold tracking-tight", colorClass)}>
          {numericScore.toFixed(2)}
        </p>
      </CardContent>
    </Card>
  );
}
