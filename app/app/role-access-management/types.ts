export type Role = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type RolePayload = Pick<Role, "name" | "description">;

export const ROLE_ACCESS_LEVELS = [
  "no_access",
  "view_only",
  "edit",
  "full_access",
] as const;

export type RoleAccessLevel = (typeof ROLE_ACCESS_LEVELS)[number];

export type RoleAccess = {
  access_level: RoleAccessLevel;
  module_key: string;
  role_id: string;
};

export type RoleAccessPayload = RoleAccess;

export type RoleListFilters = {
  name?: string;
  page_size?: number;
  page_token?: string;
};

export type RoleListResponse = {
  items: Role[];
  next_page_token: string;
  total_count: number;
};
