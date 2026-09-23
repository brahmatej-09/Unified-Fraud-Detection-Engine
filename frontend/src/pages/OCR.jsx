import { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, CheckCircle } from "lucide-react";
import { fraudApi } from "@/services/api";

export default function OCR() {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError("");
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please upload a document");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await fraudApi.analyzeOCR(file);

      setResult(data.result || data);
    } catch (err) {
      setError(
        err.message || "Failed to analyze document."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Statement OCR
        </h2>

        <p className="text-muted-foreground">
          Extract details from official documents using AI vision.
        </p>
      </div>

      <div
        className={
          result
            ? "grid grid-cols-1 md:grid-cols-2 gap-6"
            : "grid grid-cols-1"
        }
      >

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              Upload Document
            </CardTitle>

            <CardDescription>
              Upload a bank statement or ID document in PDF,
              PNG, or JPG format.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">

            {/* File Upload */}
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-12 text-center hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() =>
                fileInputRef.current?.click()
              }
            >
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />

              <p className="text-sm font-medium">
                Click to upload or drag and drop
              </p>

              <p className="text-xs text-muted-foreground mt-1">
                {file
                  ? file.name
                  : "PNG, JPG or PDF (max. 5MB)"}
              </p>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png,image/jpeg,application/pdf"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
                {error}
              </div>
            )}
          </CardContent>

          <CardFooter className="bg-muted/50 py-4 border-t flex justify-end">
            <Button
              disabled={
                !file ||
                isLoading
              }
              onClick={handleAnalyze}
              size="lg"
            >
              {isLoading
                ? "Extracting..."
                : "Run Extraction"}
            </Button>
          </CardFooter>
        </Card>

        {/* Extraction Results */}
        {result && (
          <Card className="animate-in slide-in-from-right-4">

            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                Extraction Results
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {result.records && result.records.length > 0 ? (
                <div className="space-y-8">
                  {result.records.map((record, index) => (
                    <div key={index} className="border rounded-md p-4 bg-card">
                      <h3 className="font-semibold text-lg mb-4">Transaction: {record.transaction_id || record.parsed_fund_flow?.transactionId || "Unknown"}</h3>
                      
                      {record.validation_errors && record.validation_errors.length > 0 && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md mb-4">
                          <h4 className="font-bold text-destructive mb-2">Incomplete Analysis</h4>
                          <p className="text-sm text-destructive mb-2">
                            A consolidated risk score could not be calculated because the following required components are missing for this transaction:
                          </p>
                          <ul className="list-disc list-inside text-sm text-destructive/90 space-y-1">
                            {record.validation_errors.map((err, idx) => (
                              <li key={idx}><strong>{err.component}</strong>: {err.reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Ledger Record</p>
                          <p className="font-medium">{record.parsed_fund_flow?.ledger_record || "N/A"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Currency</p>
                          <p className="font-medium">{record.parsed_fund_flow?.currency || "N/A"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Counterparties</p>
                          <p className="font-medium">{record.parsed_fund_flow?.InDegree !== undefined ? `${record.parsed_fund_flow.InDegree} / ${record.parsed_fund_flow.OutDegree}` : "N/A"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Holding Minutes</p>
                          <p className="font-medium">{record.parsed_fund_flow?.HoldingMinutes !== undefined ? record.parsed_fund_flow.HoldingMinutes : "N/A"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Total Sent</p>
                          <p className="font-medium">{record.parsed_fund_flow?.TotalSent !== undefined ? record.parsed_fund_flow.TotalSent : "N/A"}</p>
                        </div>
                        <div className="space-y-1 col-span-2 md:col-span-3">
                          <p className="text-xs text-muted-foreground">Balance Retained</p>
                          <p className="font-medium">{record.parsed_fund_flow?.RemainingBalance !== undefined ? record.parsed_fund_flow.RemainingBalance : "N/A"}</p>
                        </div>
                      </div>

                      {record.valid === true && (
                        <div className="mt-6 border-t pt-4">
                          <h3 className="text-lg font-semibold mb-4 text-emerald-600">Fraud Analysis Complete</h3>
                          <div className="grid grid-cols-2 gap-4 bg-emerald-500/10 p-4 rounded-md border border-emerald-500/20">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Final Risk Score</p>
                              <p className="font-bold text-lg">{record.final_result?.final_score !== undefined ? Number(record.final_result.final_score).toFixed(2) : "N/A"}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Risk Level</p>
                              <p className="font-bold text-lg">{record.final_result?.risk_level || "N/A"}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Adaptive Friction</p>
                              <p className="font-medium">{record.adaptive_friction?.adaptive_friction_score !== undefined ? Number(record.adaptive_friction.adaptive_friction_score).toFixed(2) : "N/A"}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Fund Flow</p>
                              <p className="font-medium">{record.fund_flow?.fund_flow_score !== undefined ? Number(record.fund_flow.fund_flow_score).toFixed(2) : "N/A"}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Phishing</p>
                              <p className="font-medium">{record.phishing?.phishing_score !== undefined ? Number(record.phishing.phishing_score).toFixed(2) : "N/A"}</p>
                            </div>
                          </div>

                          <div className="mt-4 bg-muted p-4 rounded-md">
                            <h4 className="font-semibold text-sm mb-2">Recommended Actions</h4>
                            <ul className="list-disc list-inside text-sm text-muted-foreground mb-4 space-y-1">
                              {record.final_result?.recommended_action ? (
                                record.final_result.recommended_action.map((action, actIdx) => (
                                  <li key={actIdx}>{action}</li>
                                ))
                              ) : (
                                <li>N/A</li>
                              )}
                            </ul>

                            <h4 className="font-semibold text-sm mb-2">Explanation</h4>
                            <p className="text-sm text-muted-foreground">
                              {record.explanation?.summary || "N/A"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No transactions were found in the document.
                </div>
              )}

              <div className="space-y-1 border-t pt-4 mt-6">
                <p className="text-xs text-muted-foreground">Extracted Text</p>
                <div className="bg-muted p-3 rounded-md text-sm font-mono whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                  {result.extracted_text || "No text could be extracted."}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}