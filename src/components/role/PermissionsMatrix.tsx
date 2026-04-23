import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  MODULE_ACTIONS, allModules, isModuleAllChecked, moduleGroups,
  setModuleAction, setModuleAll,
  type ModuleAction, type ModulePermissions,
} from "@/lib/role-modules";

interface Props {
  value: ModulePermissions;
  onChange: (next: ModulePermissions) => void;
  disabled?: boolean;
}

export function PermissionsMatrix({ value, onChange, disabled }: Props) {
  const allOn = useMemo(
    () => allModules.every((m) => isModuleAllChecked(value, m.id)),
    [value],
  );

  const setAllForGroup = (groupId: string, on: boolean) => {
    const group = moduleGroups.find((g) => g.id === groupId);
    if (!group) return;
    let next = value;
    for (const m of group.modules) next = setModuleAll(next, m.id, on);
    onChange(next);
  };

  const setAllGlobal = (on: boolean) => {
    let next = value;
    for (const m of allModules) next = setModuleAll(next, m.id, on);
    onChange(next);
  };

  const toggleCell = (moduleId: string, action: ModuleAction, checked: boolean) => {
    onChange(setModuleAction(value, moduleId, action, checked));
  };

  const toggleRowAll = (moduleId: string, on: boolean) => {
    onChange(setModuleAll(value, moduleId, on));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border bg-slate-50 px-4 py-3">
        <div>
          <Label className="text-sm font-semibold">Select All Permissions</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Grant every action on every module.
          </p>
        </div>
        <Switch
          checked={allOn}
          disabled={disabled}
          onCheckedChange={(c) => setAllGlobal(!!c)}
        />
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="min-w-[260px]">Type</TableHead>
              <TableHead className="text-center w-28">All</TableHead>
              {MODULE_ACTIONS.map((a) => (
                <TableHead key={a} className="text-center w-24 capitalize">
                  {a}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {moduleGroups.map((group) => {
              const groupAllOn = group.modules.every((m) =>
                isModuleAllChecked(value, m.id),
              );
              return (
                <GroupRows
                  key={group.id}
                  group={group}
                  groupAllOn={groupAllOn}
                  value={value}
                  disabled={disabled}
                  onGroupAll={(on) => setAllForGroup(group.id, on)}
                  onRowAll={toggleRowAll}
                  onCell={toggleCell}
                />
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function GroupRows({
  group, groupAllOn, value, disabled, onGroupAll, onRowAll, onCell,
}: {
  group: (typeof moduleGroups)[number];
  groupAllOn: boolean;
  value: ModulePermissions;
  disabled?: boolean;
  onGroupAll: (on: boolean) => void;
  onRowAll: (moduleId: string, on: boolean) => void;
  onCell: (moduleId: string, action: ModuleAction, checked: boolean) => void;
}) {
  return (
    <>
      <TableRow className="bg-slate-100/70 hover:bg-slate-100/70">
        <TableCell className="font-semibold text-sm tracking-wide text-slate-700">
          {group.label}
        </TableCell>
        <TableCell className="text-center">
          <Switch
            checked={groupAllOn}
            disabled={disabled}
            onCheckedChange={(c) => onGroupAll(!!c)}
          />
        </TableCell>
        <TableCell colSpan={MODULE_ACTIONS.length} />
      </TableRow>
      {group.modules.map((m) => {
        const grant = value[m.id] ?? {};
        const rowAll = isModuleAllChecked(value, m.id);
        return (
          <TableRow key={m.id}>
            <TableCell className="pl-8 text-sm">{m.label}</TableCell>
            <TableCell className="text-center">
              <Switch
                checked={rowAll}
                disabled={disabled}
                onCheckedChange={(c) => onRowAll(m.id, !!c)}
              />
            </TableCell>
            {MODULE_ACTIONS.map((a) => (
              <TableCell key={a} className="text-center">
                <Checkbox
                  checked={!!grant[a]}
                  disabled={disabled}
                  onCheckedChange={(c) => onCell(m.id, a, !!c)}
                  className={cn("h-4 w-4")}
                />
              </TableCell>
            ))}
          </TableRow>
        );
      })}
    </>
  );
}
