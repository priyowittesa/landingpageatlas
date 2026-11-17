"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { keycloakSignOut } from "@/lib/keycloak-logout";
import { KEYCLOAK_LOGIN_URL } from "@/lib/auth-routes";
import { ChevronDown } from "lucide-react";

function getInitials(name?: string | null) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserMenu() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session?.user) return null;

  const name = session.user.name ?? "User";
  const roles = session.roles ?? [];
  const roleLabel = roles.length > 0 ? roles.join(", ") : session.user.role;

  async function handleSignOut() {
    await keycloakSignOut(KEYCLOAK_LOGIN_URL);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="group flex items-center gap-2">
          <Avatar>
            <AvatarImage
              src={
                session.user.profilePictureUrl ??
                `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`
              }
              alt={name}
            />
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          </Avatar>

          <div className="flex flex-col">
            <span className="text-sm font-semibold">{name}</span>
            <span className="text-xs text-gray-500">{roleLabel}</span>
          </div>

          <ChevronDown
            size={22}
            className="transition-transform duration-200 group-data-[state=open]:rotate-180"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => router.push("/app/profile")}>
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/app/settings")}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
