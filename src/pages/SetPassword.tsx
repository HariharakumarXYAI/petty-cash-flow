import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";
import { Eye, EyeOff, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { markFirstLoginComplete, getRoleHomePage } from "@/lib/mock-credentials";

export default function SetPassword() {
  const { firstLoginCredential, clearFirstLogin, user, logout, requiresPasswordReset, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requirements = useMemo(() => [
    { label: "At least 8 characters", met: newPassword.length >= 8 },
    { label: "At least one uppercase letter (A–Z)", met: /[A-Z]/.test(newPassword) },
    { label: "At least one number (0–9)", met: /[0-9]/.test(newPassword) },
    { label: "At least one special character (!@#$%^&*)", met: /[!@#$%^&*]/.test(newPassword) },
    { label: "Passwords match", met: newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword },
  ], [newPassword, confirmPassword]);

  const allMet = requirements.every(r => r.met);
  const showMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  // Guard: not authenticated → login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Guard: authenticated but not first login → role home
  if (!requiresPasswordReset || !firstLoginCredential) {
    const role = user?.role ?? "store_user";
    return <Navigate to={getRoleHomePage(role)} replace />;
  }

  const handleSubmit = async () => {
    setError(null);

    if (newPassword === firstLoginCredential.password) {
      setError("New password cannot be the same as your temporary password");
      return;
    }

    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      markFirstLoginComplete(firstLoginCredential.username, newPassword);
      clearFirstLogin();

      toast.success("Password set successfully. Redirecting...", { duration: 3000 });

      const role = user?.role ?? firstLoginCredential.role;
      setTimeout(() => navigate(getRoleHomePage(role)), 1500);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#F5F5F5" }}>
      <div className="w-full max-w-[480px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">PettyCash 360</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Makro Group</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          {/* Info banner */}
          <div
            className="rounded-lg"
            style={{
              background: "#E6F0FF",
              borderLeft: "4px solid #0052CC",
              borderRadius: "8px",
              padding: "12px 16px",
              fontSize: "14px",
              color: "#003D99",
              lineHeight: "1.5",
            }}
          >
            🔐 You're logging in for the first time. Please set a secure password to continue.
          </div>

          {/* Heading */}
          <h2 style={{ fontSize: "22px", fontWeight: 600, color: "#1A1A1A", marginBottom: "0" }}>
            Set Your New Password
          </h2>

          {/* New Password */}
          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-sm font-medium">New Password <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                placeholder="Create a strong password"
                autoComplete="new-password"
                className="pr-10"
                style={{ height: "44px", borderRadius: "8px" }}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Requirements checklist */}
          <div className="space-y-0.5">
            {requirements.map((req, i) => (
              <div key={i} className="flex items-center gap-2" style={{ lineHeight: "1.8" }}>
                <span style={{ fontSize: "13px" }}>{req.met ? "✅" : "❌"}</span>
                <span style={{
                  fontSize: "13px",
                  color: req.met ? "#52C41A" : "#999999",
                }}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                className={`pr-10 ${showMismatch ? "border-destructive" : ""}`}
                style={{ height: "44px", borderRadius: "8px" }}
                onKeyDown={(e) => e.key === "Enter" && allMet && !loading && handleSubmit()}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {showMismatch && (
              <p className="text-xs text-destructive mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Error alert */}
          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                background: "#FFF1F0",
                border: "1px solid #FFA39E",
                color: "#CF1322",
                borderRadius: "8px",
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!allMet || loading}
            className="w-full text-sm font-medium text-white disabled:opacity-40"
            style={{
              height: "48px",
              borderRadius: "8px",
              backgroundColor: allMet && !loading ? "#0052CC" : undefined,
            }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Setting password...
              </span>
            ) : (
              "Set Password"
            )}
          </Button>

          {/* Logout link */}
          <button
            onClick={handleLogout}
            className="block mx-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
