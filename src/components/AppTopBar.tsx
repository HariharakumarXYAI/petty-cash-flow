import {
  Search, Bell, ChevronDown, Globe, Store, CalendarDays, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { countries, stores } from "@/lib/mock-data";
import type { Country } from "@/lib/mock-data";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useState } from "react";

export function AppTopBar() {
  const { country, storeId, dateRange, searchQuery, setCountry, setStoreId, setDateRange, setSearchQuery } = useGlobalFilter();
  const filteredStores = country === "all" ? stores : stores.filter(s => s.country === country);
  const [dateOpen, setDateOpen] = useState(false);

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

      {/* User */}
      <div className="flex items-center gap-2 ml-1 pl-2 border-l">
        <div className="hidden sm:block text-right">
          <p className="text-xs font-medium text-foreground leading-tight">Thanyarat C.</p>
          <p className="text-[10px] text-muted-foreground">Finance Controller</p>
        </div>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-semibold text-primary">TC</span>
        </div>
      </div>
    </header>
  );
}
