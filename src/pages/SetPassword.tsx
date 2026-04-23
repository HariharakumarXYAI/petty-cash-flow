import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";
import { Eye, EyeOff, DollarSign, Loader2, Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { markFirstLoginComplete, getRoleHomePage } from "@/lib/mock-credentials";

type Strength = 0 | 1 | 2 | 3 | 4;

function calcStrength(pw: string, rulesMet: number): Strength {
  if (!pw) return 0;
  if (rulesMet <= 2) return 1;
  if (rulesMet === 3) return 2;
  if (rulesMet === 4) return 3;
  return 4;
}

const strengthMeta: Record<Strength, { label: string; color: string; segments: number }> = {
  0: { label: "—", color: "bg-muted", segments: 0 },
  1: { label: "Weak", color: "bg-destructive", segments: 1 },
  2: { label: "Fair", color: "bg-[hsl(var(--status-validating))]", segments: 2 },
  3: { label: "Good", color: "bg-[hsl(var(--status-approved))]", segments: 3 },
  4: { label: "Strong", color: "bg-[hsl(var(--status-approved))]", segments: 4 },
};

export default function SetPassword() {
  const { firstLoginCredential, clearFirstLogin, user, requiresPasswordReset, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const rules = useMemo(() => [
    { key: "len", label: "At least 10 characters", met: newPassword.length >= 10 },
    { key: "upper", label: "One uppercase letter", met: /[A-Z]/.test(newPassword) },
    { key: "lower", label: "One lowercase letter", met: /[a-z]/.test(newPassword) },
    { key: "num", label: "One number", met: /[0-9]/.test(newPassword) },
    { key: "special", label: "One special character (!@#$%^&*)", met: /[!@#$%^&*]/.test(newPassword) },
    {
      key: "diff",
      label: "Not the same as the temporary password",
      met: newPassword.length > 0 && newPassword !== firstLoginCredential?.password,
    },
  ], [newPassword, firstLoginCredential]);

  const rulesMet = rules.filter((r) => r.met).length;
  const allRulesMet = rulesMet === rules.length;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = allRulesMet && passwordsMatch && !loading;
  const strength = calcStrength(newPassword, rulesMet);
  const meter = strengthMeta[strength];

  // Guards
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!requiresPasswordReset || !firstLoginCredential) {
    const role = user?.role ?? "store_user";
    return <Navigate to={getRoleHomePage(role)} replace />;
  }

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);

    try {
      // Mock: PATCH /auth/complete-first-login
      await new Promise((resolve) => setTimeout(resolve, 800));
      markFirstLoginComplete(firstLoginCredential.username, newPassword);
      clearFirstLogin();
      const role = user?.role ?? firstLoginCredential.role;
      navigate(getRoleHomePage(role), { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const email = user?.email ?? firstLoginCredential.username;
  const initials = user?.initials ?? firstLoginCredential.displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(222,47%,11%)] p-4">
      <div className="w-full max-w-[420px]">
        {/* Brand strip — matches /login */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">PettyCash 360</h1>
          <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Makro Group</p>
        </div>

        {/* Card — matches /login style */}
        <div className="bg-card rounded-2xl shadow-xl p-8 space-y-6">
          {/* Heading */}
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-foreground">Set your new password</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              For security, replace the temporary password sent to your email before continuing to the portal.
            </p>
          </div>

          {/* Identity strip */}
          <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2.5">
            <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Signed in as</p>
              <p className="text-sm text-foreground truncate">{email}</p>
            </div>
          </div>

          {/* New password */}
          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-xs">New password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                placeholder="Enter a new password"
                autoComplete="new-password"
                className="h-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                aria-label={showNew ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Strength meter */}
            <div className="pt-1.5 space-y-1">
              <div className="flex gap-1" aria-hidden="true">
                {[1, 2, 3, 4].map((seg) => (
                  <div
                    key={seg}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      seg <= meter.segments ? meter.color : "bg-muted",
                    )}
                  />
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Strength: <span className="text-foreground font-medium">{meter.label}</span>
              </p>
            </div>
          </div>

          {/* Rules checklist */}
          <ul aria-live="polite" className="space-y-1">
            {rules.map((rule) => (
              <li key={rule.key} className="flex items-center gap-2 text-xs">
                {rule.met ? (
                  <Check className="h-3.5 w-3.5 text-[hsl(var(--status-approved))]" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground/50" />
                )}
                <span className={rule.met ? "text-foreground" : "text-muted-foreground"}>
                  {rule.label}
                </span>
              </li>
            ))}
          </ul>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password" className="text-xs">Confirm new password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setConfirmTouched(true);
                  setError(null);
                }}
                placeholder="Re-enter your new password"
                autoComplete="new-password"
                className="h-10 pr-10"
                onKeyDown={(e) => e.key === "Enter" && canSubmit && handleSubmit()}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmTouched && confirmPassword.length > 0 && (
              <p
                className={cn(
                  "text-xs mt-1",
                  passwordsMatch ? "text-[hsl(var(--status-approved))]" : "text-destructive",
                )}
              >
                {passwordsMatch ? "Passwords match" : "Passwords don't match yet"}
              </p>
            )}
          </div>

          {/* Error slot */}
          <div aria-live="assertive">
            {error && (
              <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
            className="w-full h-11 text-sm font-medium rounded-lg"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Setting password...
              </span>
            ) : (
              "Set password & continue"
            )}
          </Button>

          {/* Footer helper */}
          <p className="text-[11px] text-muted-foreground text-center">
            You'll be redirected to your portal home after your password is set.
          </p>
        </div>
      </div>
    </div>
  );
}
