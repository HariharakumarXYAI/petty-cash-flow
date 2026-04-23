import { useState } from "react";
import { useLocation } from "react-router-dom";
import { DollarSign, ChevronDown, ChevronRight, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { getNavForRole, roleLabels } from "@/lib/roles";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, logout } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;

  const navGroups = user ? getNavForRole(user.role) : [];

  // Collapsible group state — auto-expand group containing active item
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of navGroups) {
      if (!group.label) continue;
      const hasActiveItem = group.items.some(
        (item) => pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(item.url + "/")),
      );
      initial[group.label] = !hasActiveItem; // collapsed = true means hidden
    }
    return initial;
  });

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => {
      const isOpening = prev[label]; // currently collapsed, about to open
      if (isOpening) {
        // Accordion: collapse all others, open this one
        const next: Record<string, boolean> = {};
        for (const group of navGroups) {
          if (group.label) next[group.label] = group.label !== label;
        }
        return next;
      }
      return { ...prev, [label]: true };
    });
  };

  const initials = user?.initials ?? "?";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-sidebar-accent flex items-center justify-center shrink-0">
            <DollarSign className="h-4 w-4 text-sidebar-primary" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-sm font-bold text-sidebar-primary tracking-tight">PettyCash 360</h2>
              <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider">Makro Group</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {navGroups.map((group, gi) => {
          const isGroupCollapsed = group.label ? !!collapsedGroups[group.label] : false;
          const hasActiveItem = group.items.some(
            (item) => pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(item.url + "/")),
          );

          return (
            <SidebarGroup key={gi} className={gi === 0 ? "pb-0" : ""}>
              {/* Group header — clickable to collapse/expand */}
              {group.label && !collapsed && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center justify-between w-full px-2 mb-1 group"
                >
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-widest transition-colors ${
                      hasActiveItem
                        ? "text-sidebar-primary font-bold"
                        : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"
                    }`}
                  >
                    {group.label}
                  </span>
                  {isGroupCollapsed ? (
                    <ChevronRight className={`h-3 w-3 transition-colors ${hasActiveItem ? "text-sidebar-primary" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"}`} />
                  ) : (
                    <ChevronDown className={`h-3 w-3 transition-colors ${hasActiveItem ? "text-sidebar-primary" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"}`} />
                  )}
                </button>
              )}
              {group.label && collapsed && <div className="border-t border-sidebar-border my-2" />}

              {/* Items — hidden when group is collapsed (only in expanded sidebar mode) */}
              {(!group.label || !isGroupCollapsed || collapsed) && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const isActive =
                        pathname === item.url ||
                        (item.url !== "/dashboard" && pathname.startsWith(item.url + "/"));

                      return (
                        <SidebarMenuItem key={item.title + item.url}>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              end={item.end}
                              className={`transition-colors rounded-md text-[13px] ${
                                isActive
                                  ? "bg-blue-600 text-white font-medium hover:bg-blue-700 hover:text-white"
                                  : "text-sidebar-foreground/60 hover:text-sidebar-primary hover:bg-sidebar-accent/60"
                              }`}
                              activeClassName=""
                            >
                              <item.icon className="mr-2 h-4 w-4 shrink-0" />
                              {!collapsed && <span>{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-600/30 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-blue-300">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-sidebar-foreground/80 truncate font-medium">{user.displayName}</div>
              <span className="text-[10px] font-semibold bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full">
                {roleLabels[user.role]}
              </span>
            </div>
            <button
              onClick={() => logout()}
              title="Sign out"
              className="p-1.5 rounded-lg text-sidebar-foreground/40 hover:text-red-400 hover:bg-sidebar-accent/60 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
        {collapsed && user && (
          <div className="flex justify-center">
            <div className="h-8 w-8 rounded-full bg-blue-600/30 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-300">{initials}</span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
