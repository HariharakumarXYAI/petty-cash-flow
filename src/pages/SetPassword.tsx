import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";
import { Eye, EyeOff, Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { markFirstLoginComplete, getRoleHomePage } from "@/lib/mock-credentials";

export default function SetPassword() {
  const { firstLoginCredential, clearFirstLogin, user, logout, requiresPasswordReset } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requirements = useMemo(() => [
    { label: "At least 8 characters", met: newPassword.length >= 8 },
    { label: "At least 1 uppercase letter", met: /[A-Z]/.test(newPassword) },
    { label: "At least 1 number", met: /[0-9]/.test(newPassword) },
    { label: "At least 1 special character (e.g. @, #, !)", met: /[^A-Za-z0-9]/.test(newPassword) },
  ], [newPassword]);

  const allMet = requirements.every(r => r.met);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const canSubmit = allMet && passwordsMatch;

  // Guard: only accessible during first-login flow
  if (!firstLoginCredential) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = () => {
    setError(null);

    if (newPassword === firstLoginCredential.password) {
      setError("New password cannot be the same as your temporary password");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }

    markFirstLoginComplete(firstLoginCredential.username, newPassword);
    clearFirstLogin();

    toast.success("Password set successfully!");

    const role = user?.role ?? firstLoginCredential.role;
    navigate(getRoleHomePage(role));
  };

  const handleBackToLogin = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(222,47%,11%)] p-4">
      <div className="w-full max-w-[420px]">
        <div className="bg-card rounded-2xl shadow-xl p-8 space-y-6">
          {/* First-login info banner */}
          {requiresPasswordReset && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                background: "#E6F0FF",
                borderLeft: "4px solid #0052CC",
                color: "#333333",
                fontSize: "14px",
              }}
            >
              🔐 You're logging in for the first time. Please set a new password to access the portal.
            </div>
          )}

          {/* Icon + Heading */}
          <div className="text-center space-y-2">
            <div className="text-4xl">🔐</div>
            <h2 className="text-lg font-bold text-foreground">Set Your New Password</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your temporary password has expired.<br />
              Please create a new password to continue.
            </p>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-xs">New Password *</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                placeholder="Enter new password"
                className="h-10 pr-10"
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
          <div className="space-y-1.5">
            {requirements.map((req, i) => (
              <div key={i} className="flex items-center gap-2">
                {req.met ? (
                  <Check className="h-3.5 w-3.5 text-status-approved shrink-0" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                )}
                <span className={`text-[11px] ${req.met ? "text-status-approved" : "text-muted-foreground"}`}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password" className="text-xs">Confirm New Password *</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                placeholder="Re-enter new password"
                className="h-10 pr-10"
                onKeyDown={(e) => e.key === "Enter" && canSubmit && handleSubmit()}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-[11px] text-destructive">Passwords do not match</p>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-[11px] text-destructive">{error}</p>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full h-11 text-sm font-medium rounded-lg bg-[hsl(222,47%,11%)] text-white hover:bg-[hsl(222,47%,18%)] disabled:opacity-40"
          >
            Set Password & Continue
          </Button>

          {/* Back link */}
          <button
            onClick={handleBackToLogin}
            className="block mx-auto text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
