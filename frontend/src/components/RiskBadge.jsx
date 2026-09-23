import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function RiskBadge({ level, className }) {
  const getRiskStyle = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case "very low":
        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200";
      case "low":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200";
      case "medium":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200";
      case "high":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200";
      case "critical":
        return "bg-red-100 text-red-800 hover:bg-red-100 border-red-200";
      default:
        return "bg-slate-100 text-slate-800 hover:bg-slate-100 border-slate-200";
    }
  };

  return (
    <Badge variant="outline" className={cn("font-bold px-2.5 py-0.5 text-xs uppercase", getRiskStyle(level), className)}>
      {level || "Unknown"}
    </Badge>
  );
}
