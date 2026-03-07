import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { DollarSign, Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    login();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] bg-sidebar flex-col justify-between p-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sidebar-accent flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-sidebar-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-primary tracking-tight">PettyCash 360</h1>
            <p className="text-[11px] text-sidebar-foreground/50 uppercase tracking-widest">Makro Group</p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-sidebar-primary leading-tight">
            Enterprise Petty Cash<br />Control Platform
          </h2>
          <p className="text-sm text-sidebar-foreground/60 leading-relaxed max-w-sm">
            Automated claim processing, real-time oversight, and audit-ready
            compliance across Thailand, Cambodia, and Myanmar.
          </p>
          <div className="flex items-center gap-6 text-[11px] text-sidebar-foreground/40 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> SOC 2</span>
            <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Encrypted</span>
            <span>Multi-Country</span>
          </div>
        </div>

        <p className="text-[10px] text-sidebar-foreground/30">
          © {new Date().getFullYear()} Makro Group · PettyCash 360 v1.0
        </p>
      </div>

      {/* Right sign-in panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 lg:hidden mb-6">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-base font-bold text-foreground">PettyCash 360</h1>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">Sign in to your account</h3>
            <p className="text-sm text-muted-foreground">
              Use your Makro Group corporate Microsoft account to continue.
            </p>
          </div>

          {/* Microsoft SSO button */}
          <Button
            onClick={handleLogin}
            className="w-full h-12 text-sm font-medium gap-3 bg-foreground text-background hover:bg-foreground/90 rounded-lg"
          >
            <svg className="h-5 w-5" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#F25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
              <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
            </svg>
            Sign in with Microsoft
          </Button>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Enterprise SSO</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                This application is restricted to authorized Makro Group employees.
                Personal Microsoft accounts and external email addresses are not supported.
              </p>
              <p className="text-xs text-muted-foreground">
                Contact <span className="font-medium text-foreground">IT Service Desk</span> if you need access.
              </p>
            </div>
          </div>

          {/* Demo role switcher */}
          <div className="border-t pt-6">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">Demo: Quick Login As</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                ["store_user", "Store User"],
                ["store_manager", "Store Manager"],
                ["regional_manager", "Regional Mgr"],
                ["ho_finance", "HO Finance"],
                ["internal_audit", "Internal Audit"],
                ["system_admin", "System Admin"],
              ] as const).map(([role, label]) => (
                <button
                  key={role}
                  onClick={() => {
                    const { switchRole } = useAuth as any;
                    // We'll handle this via the auth context
                    import("@/lib/roles").then(({ mockUsers }) => {
                      const found = mockUsers.find(u => u.role === role);
                      if (found) {
                        // Direct login simulation
                        handleLogin();
                      }
                    });
                  }}
                  className="text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-3 py-2 text-left transition-colors border border-transparent hover:border-border"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
