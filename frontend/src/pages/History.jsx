import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fraudApi } from "@/services/api";
import RiskBadge from "@/components/RiskBadge";
import { RefreshCw } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function History() {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get("q")?.toLowerCase() || "";

  const loadHistory = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fraudApi.getHistory();
      setHistory(response.history || []);
    } catch (err) {
      setError(err.message || "Failed to load history.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    let result = history;
    
    if (searchQuery) {
      result = result.filter(item => 
        (item.transaction_id && item.transaction_id.toLowerCase().includes(searchQuery))
      );
    }

    if (riskFilter !== "All") {
      result = result.filter(item => item.risk_level === riskFilter);
    }

    // Sort by created_at descending
    result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setFilteredHistory(result);
  }, [history, searchQuery, riskFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transaction History</h2>
          <p className="text-muted-foreground">View past transactions and alerts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by Risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Risk Levels</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Very Low">Very Low</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadHistory} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analysis History</CardTitle>
          <CardDescription>
            Review previously completed fraud analyses stored in the system.
            {searchQuery && (
              <span className="ml-2 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
                Searching: {searchQuery}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Adaptive</TableHead>
                  <TableHead className="text-center">Fund Flow</TableHead>
                  <TableHead className="text-center">Phishing</TableHead>
                  <TableHead className="text-center">Final Score</TableHead>
                  <TableHead className="text-center">Risk Level</TableHead>
                  <TableHead>Explanation</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      {isLoading ? "Loading history..." : "No analysis history found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHistory.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium whitespace-nowrap">{item.transaction_id || "N/A"}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {item.currency || "$"} {Number(item.amount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">{Number(item.adaptive_score || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-center">{Number(item.fund_flow_score || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-center">{Number(item.phishing_score || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-center font-bold">{Number(item.final_score || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-center whitespace-nowrap">
                        <RiskBadge level={item.risk_level} />
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={item.explanation || ""}>
                        {item.explanation || "N/A"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-xs whitespace-nowrap">
                        {item.created_at ? new Date(item.created_at).toLocaleString() : "Unknown"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
