import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { canAccess, isGuardedPath } from "@/lib/canAccess";
import { useToast } from "@/hooks/use-toast";

/**
 * Route guard — redirects to /dashboard with a toast if the current user's
 * role is not allowed to access the current path (per src/lib/canAccess.ts).
 *
 * Paths NOT declared in PAGE_ACCESS are unguarded (legacy/admin pages).
 * Pages must NOT contain hardcoded role checks — use this guard + the scope service.
 */
export function RouteGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const lastBlockedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const path = location.pathname;
    if (!isGuardedPath(path)) return;
    if (canAccess(path, user.role)) {
      lastBlockedRef.current = null;
      return;
    }
    if (lastBlockedRef.current === path) return;
    lastBlockedRef.current = path;
    toast({
      title: "Access denied",
      description: "You don't have access to that page.",
      variant: "destructive",
    });
    navigate("/dashboard", { replace: true });
  }, [location.pathname, user, navigate, toast]);

  return null;
}
