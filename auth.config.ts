import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe NextAuth config: no Prisma/pg imports here. This is what
 * middleware.ts uses (Next.js middleware runs on the Edge runtime, which
 * can't hold a TCP Postgres connection). Session strategy is JWT so
 * `auth()` in middleware only has to verify a signed cookie — it never
 * touches the database. Full providers (which do need Prisma) live in
 * lib/auth.ts and are only ever loaded in the Node.js runtime.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

// Edge-safe auth() — used only by middleware.ts. Since providers is empty
// here, this never touches Prisma; it only verifies the JWT session cookie.
export const { auth } = NextAuth(authConfig);
