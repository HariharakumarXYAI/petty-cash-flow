import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Store as StoreIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  loadRoles, saveRoles, storeOptions, type DynamicRole,
} from "@/lib/permissions-catalog";
import { PermissionsMatrix } from "@/components/role/PermissionsMatrix";
import { emptyModulePermissions, type ModulePermissions } from "@/lib/role-modules";

export default function RoleNewPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [storeCodes, setStoreCodes] = useState<string[]>([]);
  const [modulePermissions, setModulePermissions] =
    useState<ModulePermissions>(emptyModulePermissions());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = name.trim().length > 0 && !saving;

  const toggleStore = (code: string) => {
    setStoreCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Role name is required.");
      return;
    }
    const roles = loadRoles();
    if (roles.some((r) => r.name.toLowerCase() === trimmed.toLowerCase())) {
      setError("A role with this name already exists.");
      return;
    }

    setSaving(true);
    const newRole: DynamicRole = {
      id: `role_${Date.now()}`,
      name: trimmed,
      description: description.trim(),
      isSystem: false,
      grants: {},
      storeCodes,
      dataScope: "own_store",
      createdAt: new Date().toISOString(),
      modulePermissions,
    };
    await new Promise((r) => setTimeout(r, 300));
    saveRoles([...roles, newRole]);
    setSaving(false);
    toast.success("Role created");
    navigate("/admin/roles");
  };

  const handleCancel = () => navigate("/admin/roles");

  return (
    <div className="-m-6 min-h-full bg-gray-50">
      <div className="p-6 pb-24">
        <div className="max-w-[1100px]">
          <Link
            to="/admin/roles"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Roles
          </Link>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Create Role</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Define the role's name, store access and what actions it can perform.
            </p>
          </div>

          <div className="space-y-6">
            <Card className="bg-white p-8">
              <div className="mb-6 pb-3 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-foreground">Role Information</h2>
              </div>
              <div className="space-y-5">
                <div>
                  <Label htmlFor="role-name" className="text-sm font-medium">
                    Role Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="role-name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(null); }}
                    placeholder="e.g. Regional Auditor"
                    className={cn(
                      "mt-1.5 border-gray-300",
                      error && "border-destructive focus-visible:ring-destructive",
                    )}
                  />
                  {error && <p className="text-xs text-destructive mt-1">{error}</p>}
                </div>
                <div>
                  <Label htmlFor="role-desc" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="role-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What can this role do?"
                    rows={3}
                    className="mt-1.5 border-gray-300"
                  />
                </div>
              </div>
            </Card>

            <Card className="bg-white p-8">
              <div className="mb-6 pb-3 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-foreground">Permissions</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Toggle which actions this role can perform on each module.
                </p>
              </div>
              <PermissionsMatrix value={modulePermissions} onChange={setModulePermissions} />
            </Card>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.04)] py-4 px-8">
        <div className="max-w-[1100px] flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
            className="border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md px-5"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!canSubmit}
            className={cn(
              "bg-blue-600 hover:bg-blue-700 text-white rounded-md px-5",
              !canSubmit && "opacity-50 cursor-not-allowed",
            )}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Role
          </Button>
        </div>
      </div>
    </div>
  );
}
