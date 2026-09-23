import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { fraudApi } from "@/services/api";
import ScoreCard from "@/components/ScoreCard";
import ScoreBar from "@/components/ScoreBar";
import RiskBadge from "@/components/RiskBadge";

export default function Analysis() {
  const [activeTab, setActiveTab] = useState("dataset");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  
  // Dataset state
  const [tableName, setTableName] = useState("table1");
  const [transactionId, setTransactionId] = useState("");

  // New Transaction State
  const [formData, setFormData] = useState({
    transaction_id: "",
    amount: "",
    currency: "USD",
    distance_km: "",
    historical_avg_amount: "",
    current_device: "",
    known_device: "yes",
    in_degree: "",
    out_degree: "",
    balance: "",
    total_amount_sent: "",
    holding_time_hours: "",
    submitted_at: "",
    registration_date: "",
    certificate_valid: "yes",
    in_blacklist: "no"
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAnalyzeDataset = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fraudApi.analyzeDataset(tableName, transactionId);
      setResult(res);
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeNewTransaction = async () => {
    setIsLoading(true);
    setError("");
    try {
      const payload = {
        transaction_id: formData.transaction_id,
        adaptive_friction: {
          liveTransaction: {
            amount: Number(formData.amount),
            currency: formData.currency,
            distanceKm: Number(formData.distance_km),
            deviceFingerprint: {
              os: formData.current_device,
              browser: "Chrome",
              ipAddress: "127.0.0.1",
              userAgent: "Mozilla"
            }
          },
          storedProfile: {
            historicalAvgAmount: Number(formData.historical_avg_amount),
            knownDeviceFingerprint: {
              os: formData.known_device === "yes" ? formData.current_device : "Unknown",
              browser: "Chrome",
              ipAddress: "127.0.0.1",
              userAgent: "Mozilla"
            }
          }
        },
        fund_flow: {
          InDegree: Number(formData.in_degree),
          OutDegree: Number(formData.out_degree),
          RemainingBalance: Number(formData.balance),
          TotalSent: Number(formData.total_amount_sent),
          HoldingMinutes: Number(formData.holding_time_hours) * 60
        },
        phishing: {
          submittedAt: formData.submitted_at || new Date().toISOString(),
          domain: { registrationDate: formData.registration_date || "2020-01-01" },
          certificate: {
            selfSigned: formData.certificate_valid === "no",
            validFrom: "2020-01-01",
            validTo: "2030-01-01"
          },
          localListing: formData.in_blacklist === "yes" ? "blacklist" : "clear"
        }
      };
      
      const res = await fraudApi.getRiskScore(payload);
      setResult(res);
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Transaction Analysis</h2>
        <p className="text-muted-foreground">Analyze dataset transactions or input new ones manually.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="dataset">Dataset Analysis</TabsTrigger>
          <TabsTrigger value="new">New Transaction</TabsTrigger>
        </TabsList>
        
        {/* Stage 4: Dataset Analysis */}
        <TabsContent value="dataset" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dataset Analysis</CardTitle>
              <CardDescription>
                Select a dataset and enter a transaction ID to analyze historical records.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="space-y-2 flex-1 max-w-[200px]">
                  <Label htmlFor="dataset">Dataset</Label>
                  <Select value={tableName} onValueChange={setTableName}>
                    <SelectTrigger id="dataset">
                      <SelectValue placeholder="Select dataset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="table1">Table 1</SelectItem>
                      <SelectItem value="table2">Table 2</SelectItem>
                      <SelectItem value="table3">Table 3</SelectItem>
                      <SelectItem value="table4">Table 4</SelectItem>
                      <SelectItem value="table5">Table 5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 flex-1">
                  <Label htmlFor="transactionId">Transaction ID</Label>
                  <Input 
                    id="transactionId" 
                    placeholder="e.g. TXN-2026-04" 
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                </div>
                
                <Button disabled={isLoading} onClick={handleAnalyzeDataset} className="w-full sm:w-auto">
                  {isLoading ? "Analyzing..." : "Analyze"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stage 5: New Transaction */}
        <TabsContent value="new" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>New Transaction</CardTitle>
              <CardDescription>
                Input manual transaction details for real-time risk scoring.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Transaction Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Transaction Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Transaction ID</Label>
                    <Input value={formData.transaction_id} onChange={(e) => handleInputChange('transaction_id', e.target.value)} placeholder="e.g. TXN-999" />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input value={formData.amount} onChange={(e) => handleInputChange('amount', e.target.value)} type="number" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={formData.currency} onValueChange={(val) => handleInputChange('currency', val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Adaptive Friction */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Adaptive Friction</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Distance (km)</Label>
                    <Input value={formData.distance_km} onChange={(e) => handleInputChange('distance_km', e.target.value)} type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Historical Amount</Label>
                    <Input value={formData.historical_avg_amount} onChange={(e) => handleInputChange('historical_avg_amount', e.target.value)} type="number" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Device</Label>
                    <Input value={formData.current_device} onChange={(e) => handleInputChange('current_device', e.target.value)} placeholder="e.g. iPhone 13" />
                  </div>
                  <div className="space-y-2">
                    <Label>Known Device</Label>
                    <Select value={formData.known_device} onValueChange={(val) => handleInputChange('known_device', val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Fund Flow */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Fund Flow</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label>In Degree</Label>
                    <Input value={formData.in_degree} onChange={(e) => handleInputChange('in_degree', e.target.value)} type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Out Degree</Label>
                    <Input value={formData.out_degree} onChange={(e) => handleInputChange('out_degree', e.target.value)} type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Balance</Label>
                    <Input value={formData.balance} onChange={(e) => handleInputChange('balance', e.target.value)} type="number" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Sent</Label>
                    <Input value={formData.total_amount_sent} onChange={(e) => handleInputChange('total_amount_sent', e.target.value)} type="number" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Holding Time (hrs)</Label>
                    <Input value={formData.holding_time_hours} onChange={(e) => handleInputChange('holding_time_hours', e.target.value)} type="number" placeholder="0" />
                  </div>
                </div>
              </div>

              {/* Phishing */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Phishing</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Submitted At</Label>
                    <Input value={formData.submitted_at} onChange={(e) => handleInputChange('submitted_at', e.target.value)} type="datetime-local" />
                  </div>
                  <div className="space-y-2">
                    <Label>Registration Date</Label>
                    <Input value={formData.registration_date} onChange={(e) => handleInputChange('registration_date', e.target.value)} type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Certificate Valid</Label>
                    <Select value={formData.certificate_valid} onValueChange={(val) => handleInputChange('certificate_valid', val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>In Blacklist</Label>
                    <Select value={formData.in_blacklist} onValueChange={(val) => handleInputChange('in_blacklist', val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

            </CardContent>
            <CardFooter className="bg-muted/50 py-4 border-t mt-4 flex justify-end">
              <Button disabled={isLoading} onClick={handleAnalyzeNewTransaction} size="lg" className="w-full sm:w-auto">
                {isLoading ? "Analyzing..." : "Analyze Transaction"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20 mt-6 animate-in fade-in">
          {error}
        </div>
      )}
      
      {result && (
        <div className="mt-6 animate-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-xl font-bold mb-4">Risk Analysis Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Breakdown Cards */}
            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ScoreCard 
                title="Adaptive Friction" 
                score={result.details?.adaptive_friction?.adaptive_friction_score} 
              />
              <ScoreCard 
                title="Fund Flow" 
                score={result.details?.fund_flow?.fund_flow_score} 
              />
              <ScoreCard 
                title="Phishing" 
                score={result.details?.phishing?.phishing_score} 
              />

              {/* Detailed Breakdown Bars */}
              <Card className="sm:col-span-3 mt-2">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm">Detailed Score Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <ScoreBar name="Adaptive Friction" score={result.details?.adaptive_friction?.adaptive_friction_score} weight="45%" />
                  <ScoreBar name="Fund Flow" score={result.details?.fund_flow?.fund_flow_score} weight="35%" />
                  <ScoreBar name="Phishing" score={result.details?.phishing?.phishing_score} weight="20%" />
                </CardContent>
              </Card>
            </div>

            {/* Final Risk Score & Actions */}
            <Card className="border-primary/50 bg-primary/5 h-full flex flex-col">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Final Risk Score</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center flex-1 py-6 space-y-4">
                <div className="text-6xl font-black text-primary">
                  {Number(result.details?.final_result?.final_score || 0).toFixed(2)}
                </div>
                <RiskBadge level={result.details?.final_result?.risk_level} className="text-sm px-3 py-1" />
              </CardContent>
              
              {result.details?.final_result?.recommended_action && (
                <div className="p-4 bg-background border-t w-full">
                  <p className="text-sm font-bold mb-2 text-foreground">Recommended Actions</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                    {Array.isArray(result.details.final_result.recommended_action) ? (
                      result.details.final_result.recommended_action.map((action, i) => (
                        <li key={i}>{action}</li>
                      ))
                    ) : (
                      <li>{result.details.final_result.recommended_action}</li>
                    )}
                  </ul>
                </div>
              )}

              {result.details?.str_generated && (
                <div className="p-4 bg-destructive/10 border-t w-full flex flex-col items-center gap-2">
                  <span className="text-sm font-bold text-destructive uppercase tracking-widest">
                    STR Generated
                  </span>
                  <div className="flex gap-2">
                    {result.details?.html_report_path && (
                      <Button asChild variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive hover:text-white">
                        <a href={`http://localhost:5001${result.details.html_report_path}`} target="_blank" rel="noreferrer">HTML Report</a>
                      </Button>
                    )}
                    {result.details?.pdf_report_path && (
                      <Button asChild variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive hover:text-white">
                        <a href={`http://localhost:5001${result.details.pdf_report_path}`} target="_blank" rel="noreferrer">PDF Report</a>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>

          </div>
        </div>
      )}
    </div>
  );
}
