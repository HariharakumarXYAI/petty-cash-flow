import { AlertItem } from "@/components/AlertItem";
import { mockAlerts } from "@/lib/mock-data";

export default function Alerts() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Alerts & Investigations</h1>
        <p className="text-sm text-muted-foreground">{mockAlerts.length} active alerts across all countries</p>
      </div>
      <div className="space-y-2 max-w-2xl">
        {mockAlerts.map((alert) => (
          <AlertItem key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );
}
