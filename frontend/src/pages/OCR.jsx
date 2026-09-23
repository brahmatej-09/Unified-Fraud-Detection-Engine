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
  const [transactionId, setTransactionId] = useState("");
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
    if (!transactionId.trim()) {
      setError("Transaction ID is required");
      return;
    }

    if (!file) {
      setError("Please upload a document");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await fraudApi.analyzeOCR(
        file,
        transactionId.trim()
      );

      setResult(data);
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

            {/* Transaction ID */}
            <div className="space-y-2">
              <label
                htmlFor="transactionId"
                className="text-sm font-medium"
              >
                Transaction ID
              </label>

              <Input
                id="transactionId"
                type="text"
                placeholder="e.g. TXN-2026-05"
                value={transactionId}
                onChange={(e) => {
                  setTransactionId(e.target.value);
                  setError("");
                }}
              />
            </div>

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
                !transactionId.trim() ||
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

            <CardContent className="space-y-4">

              <div className="grid grid-cols-2 gap-4">

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Transaction ID
                  </p>

                  <p className="font-medium">
                    {result.transaction_id ||
                      transactionId ||
                      "N/A"}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Document Type
                  </p>

                  <p className="font-medium">
                    {result.document_type || "N/A"}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Confidence
                  </p>

                  <p className="font-medium">
                    {typeof result.confidence === "number"
                      ? `${(
                          result.confidence * 100
                        ).toFixed(1)}%`
                      : "N/A"}
                  </p>
                </div>

              </div>

              <div className="space-y-1 border-t pt-4">
                <p className="text-xs text-muted-foreground">
                  Extracted Text
                </p>

                <div className="bg-muted p-3 rounded-md text-sm font-mono whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                  {result.extracted_text ||
                    "No text could be extracted."}
                </div>
              </div>

            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}