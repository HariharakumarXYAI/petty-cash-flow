import { ChevronDown, LogOut, Shield } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { roleLabels, roleBadgeColors, type AppRole } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export function AppTopBar() {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="h-14 border-b bg-card flex items-center px-3 gap-2 shrink-0 sticky top-0 z-20">
      <SidebarTrigger className="mr-1" />

      {/* Spacer */}
      <div className="flex-1" />

      {/* User profile dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 ml-1 pl-2 border-l hover:bg-muted/50 rounded-md px-2 py-1 transition-colors">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-foreground leading-tight">{user?.displayName || "User"}</p>
              <p className="text-[10px] text-muted-foreground">{user ? roleLabels[user.role] : ""}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">{user?.initials || "?"}</span>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="pb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">{user?.initials}</span>
              </div>
              <div>
                <p className="text-sm font-medium">{user?.displayName}</p>
                <p className="text-[11px] text-muted-foreground font-normal">{user?.email}</p>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Role & Scope */}
          {user && (
            <div className="px-2 py-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Role</span>
                <Badge variant="outline" className={cn("text-[10px]", roleBadgeColors[user.role])}>
                  {roleLabels[user.role]}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Scope</span>
                <span className="text-xs text-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3 text-muted-foreground" />
                  {user.scope.label}
                </span>
              </div>
              {user.approvalLimit && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Approval</span>
                  <span className="text-xs font-medium text-foreground">≤ {user.approvalLimit.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          <DropdownMenuSeparator />

          {/* Demo role switcher */}
          <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Demo: Switch Role
          </DropdownMenuLabel>
          {(["store_user", "store_manager", "regional_manager", "ho_finance", "internal_audit", "system_admin"] as AppRole[]).map((r) => (
            <DropdownMenuItem
              key={r}
              onClick={() => switchRole(r)}
              className={cn("text-xs", user?.role === r && "bg-muted font-medium")}
            >
              {roleLabels[r]}
              {user?.role === r && <span className="ml-auto text-[10px] text-primary">Active</span>}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleLogout} className="text-xs text-status-hold">
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
