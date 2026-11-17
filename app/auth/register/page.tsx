"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRegister } from "@/hooks/useRegister";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KEYCLOAK_LOGIN_URL } from "@/lib/auth-routes";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error } = useRegister();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await register({
      full_name: fullName,
      email,
      password,
    });
    if (result) {
      router.push(KEYCLOAK_LOGIN_URL);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sign up to get started with ATLAS
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <Input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Creating account..." : "Sign up"}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <button
            onClick={() => router.push(KEYCLOAK_LOGIN_URL)}
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
