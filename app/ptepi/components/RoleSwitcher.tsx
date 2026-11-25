"use client";

import { FlaskConical, UserCog } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useRoleStore } from "../store/role-store";
import { DEMO_ROLES, getDemoRole, type DemoRoleId } from "../store/roles";
import { useT } from "./Tr";

/** Demo only: changes what the action tracker enables and highlights. Not real access control. */
export function RoleSwitcher() {
  const roleId = useRoleStore((state) => state.roleId);
  const setRole = useRoleStore((state) => state.setRole);
  const t = useT();
  const label = t("Demo only, not access control");

  return (
    <div className="flex items-center gap-2">
      <span className="hidden items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[0.75rem] font-semibold text-amber-900 lg:inline-flex">
        <FlaskConical size={12} aria-hidden />
        {label}
      </span>
      <UserCog size={16} className="hidden text-muted-foreground sm:block" aria-hidden />
      <Select value={roleId} onValueChange={(value) => setRole(value as DemoRoleId)}>
        <SelectTrigger
          aria-label={`${t("Demo role")}. ${label}`}
          title={`${t(getDemoRole(roleId).description)} ${label}.`}
          className="h-8 w-32 bg-background text-xs sm:w-36 xl:w-48"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {DEMO_ROLES.map((role) => (
            <SelectItem key={role.id} value={role.id}>
              {t(role.label)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
