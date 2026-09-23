import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Activity, AlertOctagon, AlertTriangle, ShieldAlert } from "lucide-react";
import { fraudApi } from "@/services/api";
import RiskBadge from "@/components/RiskBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    highRisk: 0,
    critical: 0,
    mediumRisk: 0,
    veryLow: 0,
    low: 0,
  });
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fraudApi.getHistory();
        const history = response.history || [];
        const totalAnalyses = history.length;
        
        let highRisk = 0, critical = 0, mediumRisk = 0, veryLow = 0, low = 0;
        
        history.forEach(h => {
          if (h.risk_level === "Critical") critical++;
          else if (h.risk_level === "High") highRisk++;
          else if (h.risk_level === "Medium") mediumRisk++;
          else if (h.risk_level === "Low") low++;
          else if (h.risk_level === "Very Low") veryLow++;
        });

        setStats({ totalAnalyses, highRisk, critical, mediumRisk, veryLow, low });
        
        // Get top 5 recent analyses
        const sorted = [...history].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRecentAnalyses(sorted.slice(0, 5));
        
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of fraud detection metrics and alerts.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalAnalyses}</div>
            <p className="text-xs text-muted-foreground">Recorded fraud analyses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.highRisk}</div>
            <p className="text-xs text-muted-foreground">High-risk transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertOctagon className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.critical}</div>
            <p className="text-xs text-muted-foreground">Critical-risk transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Risk</CardTitle>
            <ShieldAlert className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.mediumRisk}</div>
            <p className="text-xs text-muted-foreground">Medium-risk transactions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Analyses</CardTitle>
            <CardDescription>Latest transaction evaluations from the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
                ) : recentAnalyses.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No recent analyses found</TableCell></TableRow>
                ) : (
                  recentAnalyses.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.transaction_id || "N/A"}</TableCell>
                      <TableCell><RiskBadge level={item.risk_level} /></TableCell>
                      <TableCell className="font-bold">{Number(item.final_score || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Unknown"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>Breakdown of all analyses by risk level.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {loading ? (
              <div className="text-center p-4">Loading...</div>
            ) : (
              <>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm font-medium">Critical</span>
                  <span className="text-sm font-bold">{stats.critical}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm font-medium">High</span>
                  <span className="text-sm font-bold">{stats.highRisk}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm font-medium">Medium</span>
                  <span className="text-sm font-bold">{stats.mediumRisk}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm font-medium">Low</span>
                  <span className="text-sm font-bold">{stats.low}</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-sm font-medium">Very Low</span>
                  <span className="text-sm font-bold">{stats.veryLow}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-background to-muted/50 border-muted">
        <CardHeader>
          <CardTitle>Fraud Detection Center</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground max-w-md">
            Analyze transactions using adaptive, fund-flow and phishing risk signals.
          </p>
          <Button asChild size="lg" className="shrink-0 transition-transform hover:scale-105">
            <Link to="/analysis">Analyze Transaction</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
