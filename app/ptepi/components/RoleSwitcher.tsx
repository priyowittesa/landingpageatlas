"use client";

import { UserCog } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useRoleStore } from "../store/role-store";
import { DEMO_ROLES, getDemoRole, type DemoRoleId } from "../store/roles";

/** Demo only: changes what the action tracker enables and highlights. Not real access control. */
export function RoleSwitcher() {
  const roleId = useRoleStore((state) => state.roleId);
  const setRole = useRoleStore((state) => state.setRole);

  return (
    <div className="flex items-center gap-2">
      <UserCog size={16} className="hidden text-muted-foreground sm:block" aria-hidden />
      <Select value={roleId} onValueChange={(value) => setRole(value as DemoRoleId)}>
        <SelectTrigger
          aria-label="Demo role"
          title={`${getDemoRole(roleId).description} Demo only, no real login.`}
          className="h-8 w-32 bg-background text-xs sm:w-36 xl:w-56"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {DEMO_ROLES.map((role) => (
            <SelectItem key={role.id} value={role.id}>
              {role.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
