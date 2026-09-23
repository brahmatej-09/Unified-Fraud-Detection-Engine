import { useState } from "react";
import { fraudApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function Login({ onLogin }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!formData.email || !formData.password) {
      setError("Email and password are required.");
      return;
    }
    
    if (!isLoginMode && !formData.name) {
      setError("Name is required.");
      return;
    }

    setIsLoading(true);
    
    try {
      if (isLoginMode) {
        const data = await fraudApi.login(formData.email, formData.password);
        localStorage.setItem("token", data.token);
        onLogin();
      } else {
        await fraudApi.register(formData.name, formData.email, formData.password);
        // After successful registration, automatically switch to login or log them in.
        // The old app just switched mode and showed a success message. We can just login directly or switch mode.
        setIsLoginMode(true);
        setFormData(prev => ({ ...prev, password: "" })); // Clear password
        setError("Registration successful. Please log in."); // Reusing error as a message box, or maybe we just log in directly. Let's just log them in to be user-friendly, or stick to what App.old.jsx did.
        // App.old.jsx did: setIsLogin(true); setMessage(response.data.message); setName(""); setPassword("");
      }
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <div className="flex items-center gap-2 mb-8 text-primary">
        <ShieldAlert className="w-8 h-8" />
        <h1 className="text-2xl font-bold tracking-tight">BNP Fraud Engine</h1>
      </div>
      
      <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <CardHeader>
          <CardTitle>{isLoginMode ? "Welcome back" : "Create an account"}</CardTitle>
          <CardDescription>
            {isLoginMode 
              ? "Enter your credentials to access the system" 
              : "Register to access the fraud detection engine"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {!isLoginMode && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="John Doe" 
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="analyst@bnpparibas.com" 
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className={`p-3 text-sm rounded-md border ${
                error.includes("successful") 
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                  : "bg-destructive/10 text-destructive border-destructive/20"
              }`}>
                {error}
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Please wait..." : (isLoginMode ? "Sign in" : "Register")}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4">
          <Button 
            variant="link" 
            className="text-sm text-muted-foreground"
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError("");
            }}
          >
            {isLoginMode 
              ? "Don't have an account? Register" 
              : "Already have an account? Sign in"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
