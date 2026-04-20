import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { DollarSign, Eye, EyeOff, AlertCircle, Ban, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { roleLabels, type AppRole } from "@/lib/roles";
import { authenticateUser, getRoleHomePage } from "@/lib/mock-credentials";

export default function Login() {
  const { switchRole, setFirstLoginCredential, setRequiresPasswordReset } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<"invalid" | "inactive" | "not_found" | null>(null);
  const [testOpen, setTestOpen] = useState(false);

  const handleMicrosoftLogin = () => {
    switchRole("ho_finance");
    navigate("/dashboard");
  };

  const handleLocalLogin = () => {
    setError(null);
    if (!username.trim() || !password.trim()) {
      setError("invalid");
      return;
    }
    const result = authenticateUser(username, password);
    if (!result.success) {
      setError(result.error!);
      return;
    }
    const cred = result.credential!;
    if (cred.isFirstLogin) {
      switchRole(cred.role);
      setFirstLoginCredential(cred);
      setRequiresPasswordReset(true);
      navigate("/login/set-password");
    } else {
      switchRole(cred.role);
      navigate(getRoleHomePage(cred.role));
    }
  };

  const handleTestLogin = (role: AppRole) => {
    switchRole(role);
    navigate(getRoleHomePage(role));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(222,47%,11%)] p-4">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">PettyCash 360</h1>
          <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Makro Group</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-xl p-8 space-y-6">
          {/* Section 1 — Microsoft SSO */}
          <div className="space-y-3">
            <Button
              onClick={handleMicrosoftLogin}
              className="w-full h-12 text-sm font-medium gap-3 rounded-lg"
              style={{ backgroundColor: "#0078D4" }}
            >
              <svg className="h-5 w-5" viewBox="0 0 21 21" fill="none">
                <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
              </svg>
              Sign in with Microsoft
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Use your Makro Group corporate account
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Section 2 — Store Users */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(null); }}
                placeholder="Enter your employee code (e.g. EMP001)"
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="Enter your password"
                  className="h-10 pr-10"
                  onKeyDown={(e) => e.key === "Enter" && handleLocalLogin()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              onClick={handleLocalLogin}
              className="w-full h-11 text-sm font-medium rounded-lg bg-[hsl(222,47%,11%)] text-white hover:bg-[hsl(222,47%,18%)]"
            >
              Login
            </Button>

            {/* Error States */}
            {error === "invalid" && (
              <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">
                  Incorrect username or password. Please try again.
                </p>
              </div>
            )}
            {error === "inactive" && (
              <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <Ban className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">
                  Your account has been deactivated. Please contact your Store Manager to reactivate.
                </p>
              </div>
            )}
            {error === "not_found" && (
              <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">
                  Account not found. Please ask your Store Manager to create your account in PC360.
                </p>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground text-center">
              Forgot password? Contact your Store Manager
            </p>
          </div>

          {/* Dev/Test Mode */}
          <div className="border-t pt-4">
            <button
              onClick={() => setTestOpen(!testOpen)}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors mx-auto"
            >
              🧪 Test Logins
              {testOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {testOpen && (
              <div className="grid grid-cols-3 gap-1.5 mt-3">
                {(["store_user", "store_manager", "regional_manager", "ho_finance", "internal_audit", "system_admin"] as AppRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => handleTestLogin(role)}
                    className="text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-2 py-1.5 transition-colors border border-border/50 hover:border-border text-center"
                  >
                    {roleLabels[role]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-[10px] text-white/30 text-center mt-6">
          © {new Date().getFullYear()} Makro Group · PettyCash 360 v1.0
        </p>
      </div>
    </div>
  );
}
