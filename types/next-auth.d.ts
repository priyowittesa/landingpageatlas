import { DefaultSession, DefaultUser } from "next-auth";

export type UserRole = "super_admin" | "admin" | "teacher" | "student";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      roles: string[];
      phoneNumber: string | null;
      profilePictureUrl: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
    roles: string[];
    error?: "RefreshTokenExpired";
  }

  interface User extends DefaultUser {
    role: UserRole;
    roles?: string[];
    accessToken: string;
    refreshToken: string;
    idToken?: string;
    phoneNumber: string | null;
    profilePictureUrl: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    roles?: string[];
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    accessTokenExpiry?: number;
    phoneNumber?: string | null;
    profilePictureUrl?: string | null;
    error?: "RefreshTokenExpired";
    provider?: string;
  }
}
