const clientRequired = {
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  NEXT_PUBLIC_GOOGLE_REDIRECT_URI:
    process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
  NEXT_PUBLIC_GOOGLE_ADS_REDIRECT_URI:
    process.env.NEXT_PUBLIC_GOOGLE_ADS_REDIRECT_URI,
  NEXT_PUBLIC_YAHOO_CLIENT_ID: process.env.NEXT_PUBLIC_YAHOO_CLIENT_ID,
  NEXT_PUBLIC_YAHOO_REDIRECT_URI: process.env.NEXT_PUBLIC_YAHOO_REDIRECT_URI,
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
} as const;

const serverRequired = {
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  KEYCLOAK_ISSUER: process.env.KEYCLOAK_ISSUER,
  KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID,
  KEYCLOAK_CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
} as const;

function getServerVar(key: keyof typeof serverRequired): string {
  const value = serverRequired[key];
  if (!value) {
    throw new Error(`Missing server environment variable: ${key}`);
  }
  return value;
}

export const env = {
  apiBaseUrl: clientRequired.NEXT_PUBLIC_API_BASE_URL,
  // Socket.IO server origin. Falls back to the API base URL when not set.
  socketUrl:
    clientRequired.NEXT_PUBLIC_SOCKET_URL ??
    clientRequired.NEXT_PUBLIC_API_BASE_URL,
  get nextAuthSecret() {
    return getServerVar("NEXTAUTH_SECRET");
  },
  get nextAuthUrl() {
    return serverRequired.NEXTAUTH_URL ?? "http://localhost:3000";
  },
  get keycloakIssuer() {
    return serverRequired.KEYCLOAK_ISSUER;
  },
  get keycloakClientId() {
    return serverRequired.KEYCLOAK_CLIENT_ID;
  },
  get keycloakClientSecret() {
    return serverRequired.KEYCLOAK_CLIENT_SECRET;
  },
  get groqApiKey() {
    return getServerVar("GROQ_API_KEY");
  },
  googleClientId: clientRequired.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  googleRedirectUri: clientRequired.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
  googleAdsRedirectUri: clientRequired.NEXT_PUBLIC_GOOGLE_ADS_REDIRECT_URI,
  yahooClientId: clientRequired.NEXT_PUBLIC_YAHOO_CLIENT_ID,
  yahooRedirectUri: clientRequired.NEXT_PUBLIC_YAHOO_REDIRECT_URI,
  googleMapsApiKey: clientRequired.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
} as const;
