import {
  Search, Bell, ChevronDown, Globe, Store, CalendarDays, LogOut, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { useAuth } from "@/contexts/AuthContext";
import { countries, stores } from "@/lib/mock-data";
import type { Country } from "@/lib/mock-data";
import { roleLabels, roleBadgeColors, scopeLabels, type AppRole } from "@/lib/roles";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export function AppTopBar() {
  const { country, storeId, dateRange, searchQuery, setCountry, setStoreId, setDateRange, setSearchQuery } = useGlobalFilter();
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const filteredStores = country === "all" ? stores : stores.filter(s => s.country === country);
  const [dateOpen, setDateOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="h-14 border-b bg-card flex items-center px-3 gap-2 shrink-0 sticky top-0 z-20">
      <SidebarTrigger className="mr-1" />

      {/* Country */}
      <Select value={country} onValueChange={(v) => setCountry(v as Country | "all")}>
        <SelectTrigger className="w-[130px] h-8 text-xs">
          <Globe className="h-3.5 w-3.5 mr-1 text-muted-foreground shrink-0" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Countries</SelectItem>
          {countries.map(c => (
            <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Store */}
      <Select value={storeId} onValueChange={setStoreId}>
        <SelectTrigger className="w-[160px] h-8 text-xs hidden sm:flex">
          <Store className="h-3.5 w-3.5 mr-1 text-muted-foreground shrink-0" />
          <SelectValue placeholder="All Stores" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Stores</SelectItem>
          {filteredStores.map(s => (
            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date Range */}
      <Popover open={dateOpen} onOpenChange={setDateOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-xs hidden md:flex gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            {format(dateRange.from, "MMM d")} – {format(dateRange.to, "MMM d, yyyy")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{ from: dateRange.from, to: dateRange.to }}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                setDateRange({ from: range.from, to: range.to });
              }
            }}
            numberOfMonths={2}
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden lg:block">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search claims, stores..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-8 w-56 text-xs"
        />
      </div>

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="h-8 w-8 relative">
        <Bell className="h-4 w-4 text-muted-foreground" />
        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-status-hold text-[9px] font-bold text-primary-foreground flex items-center justify-center">4</span>
      </Button>

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
