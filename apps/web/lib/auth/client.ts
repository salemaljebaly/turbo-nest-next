import { createAuthClient } from 'better-auth/react';
import { organizationClient } from 'better-auth/client/plugins';

// NEXT_PUBLIC_AUTH_URL is the root URL of the NestJS API (no /api suffix).
// Better Auth appends /api/auth internally to reach the auth endpoints.
export const authClient = createAuthClient({
  baseURL: process.env['NEXT_PUBLIC_AUTH_URL'] ?? 'http://localhost:3001',
  plugins: [organizationClient()],
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  // Organization methods
  organization,
} = authClient;
