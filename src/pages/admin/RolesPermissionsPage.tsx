import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const roles = [
  { name: "Store User", count: 3, permissions: ["Submit Claims", "View Own Claims", "Submit Advances"] },
  { name: "Store Manager", count: 2, permissions: ["Submit Claims", "View Own Claims", "Approve Claims", "View Team Claims", "Manage Cashbook"] },
  { name: "HO Finance", count: 1, permissions: ["View All Claims", "Manage Investigations", "Run Reports", "Manage Alerts"] },
  { name: "System Admin", count: 1, permissions: ["Full Access"], highlight: true },
  { name: "Internal Audit", count: 0, permissions: ["View All Claims", "View Audit Logs", "Run Audit Reports"] },
];

export default function RolesPermissionsPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground mb-0.5">Roles & Permissions</h1>
      <p className="text-sm text-muted-foreground mb-6">Define what each role can do in the system</p>

      <div className="grid grid-cols-2 gap-4">
        {roles.map((role) => (
          <Card key={role.name}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{role.name}</CardTitle>
                <Badge variant="secondary" className="text-xs">{role.count} users</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.map((p) => (
                  <Badge
                    key={p}
                    variant="outline"
                    className={`text-[11px] ${role.highlight ? "bg-destructive/10 text-destructive border-destructive/20" : ""}`}
                  >
                    {p}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
