import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isAppRole } from "@/lib/roles";

// Gates the demo role-impersonation provider below. On by default outside a
// production build; a real deployment must set DEMO_MODE=false explicitly
// (or just ship with NODE_ENV=production, which already disables it) — this
// must never be reachable in front of real customer/driver data.
export function isDemoModeEnabled(): boolean {
  if (process.env.DEMO_MODE === "false") return false;
  if (process.env.DEMO_MODE === "true") return true;
  return process.env.NODE_ENV !== "production";
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;
        if (!isAppRole(user.role)) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          warehouseId: user.warehouseId,
          regionId: user.regionId,
        };
      },
    }),
    // Demo-only role switcher (top bar). Never reachable when isDemoModeEnabled()
    // is false — see the check inside authorize().
    CredentialsProvider({
      id: "demo",
      name: "Demo role switch",
      credentials: {
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!isDemoModeEnabled()) return null;
        const role = credentials?.role;
        if (!role || !isAppRole(role)) return null;

        const user = await prisma.user.findFirst({ where: { role } });
        if (!user) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          warehouseId: user.warehouseId,
          regionId: user.regionId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.warehouseId = user.warehouseId;
        token.regionId = user.regionId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.warehouseId = token.warehouseId;
      session.user.regionId = token.regionId;
      return session;
    },
  },
};
