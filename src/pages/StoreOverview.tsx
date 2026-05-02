import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MOCK_CLAIMS } from "@/data/mockClaims";
import { stores } from "@/lib/mock-data";
import { applyScope, getDefaultScope } from "@/lib/scope";
import { Store as StoreIcon, Wallet, FileText, AlertTriangle } from "lucide-react";

export default function StoreOverview() {
  const { user } = useAuth();

  const store = useMemo(
    () => (user?.store_id ? stores.find((s) => s.id === user.store_id) : null),
    [user?.store_id],
  );

  const storeClaims = useMemo(() => {
    if (!user) return [];
    const scope = getDefaultScope(user);
    return applyScope(MOCK_CLAIMS, scope, user);
  }, [user]);

  const monthStart = useMemo(() => {
    const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d;
  }, []);

  const claimsThisMonth = storeClaims.filter(
    (c) => new Date(c.transaction_date) >= monthStart,
  );
  const approvedThisMonth = claimsThisMonth.filter(
    (c) => c.status === "Approved" || c.status === "Approved with Alert",
  );
  const totalApproved = approvedThisMonth.reduce((s, c) => s + c.amount, 0);
  const alertCount = storeClaims.filter((c) => c.alert).length;

  if (!store) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Store Overview</h1>
        <p className="text-sm text-muted-foreground">No store assigned to your profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Store Overview</h1>
          <p className="text-sm text-muted-foreground">
            {store.name} · {store.country} · Float ฿{store.floatLimit.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Wallet} label="Cash on hand" value={`฿${store.currentBalance.toLocaleString()}`} />
        <StatCard icon={FileText} label="Claims this month" value={claimsThisMonth.length.toString()} />
        <StatCard icon={FileText} label="Approved (MTD)" value={`฿${totalApproved.toLocaleString()}`} />
        <StatCard icon={AlertTriangle} label="Open alerts" value={alertCount.toString()} />
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <StoreIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Store details</h3>
        </div>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <Row label="Legal entity" value={store.legalEntity} />
          <Row label="Type" value={store.type} />
          <Row label="Currency" value={store.currency} />
          <Row label="Min balance" value={`฿${store.minBalance.toLocaleString()}`} />
          <Row label="Max float" value={`฿${store.maxFloat.toLocaleString()}`} />
          <Row label="Replenishment threshold" value={`฿${store.replenishmentThreshold.toLocaleString()}`} />
        </dl>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-2xl font-bold text-foreground tabular-nums mt-2">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-border last:border-b-0 py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
