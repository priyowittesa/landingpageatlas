"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";

const LOGIN_SELECTOR =
  '.atlas-landing a[href="/api/auth/signin/keycloak?callbackUrl=%2Fauth%2Fredirect"]';

// "Log in" links start the Keycloak flow through next-auth instead of a plain navigation.
export function useLoginRedirect() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest(LOGIN_SELECTOR)) return;

      event.preventDefault();
      void signIn("keycloak", { callbackUrl: "/auth/redirect" });
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);
}
