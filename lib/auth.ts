import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { authConfig } from "../auth.config";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { sendVerificationRequest } from "@/lib/auth/sendVerificationRequest";
import { slugify } from "@/lib/utils";

const providers: Provider[] = [
  Credentials({
    credentials: {
      email: {},
      password: {},
    },
    async authorize(credentials) {
      const email = credentials?.email;
      const password = credentials?.password;
      if (typeof email !== "string" || typeof password !== "string") return null;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash) return null;

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) return null;

      return { id: user.id, email: user.email };
    },
  }),
  {
    id: "email",
    name: "Email",
    type: "email" as const,
    maxAge: 24 * 60 * 60,
    from: process.env.EMAIL_FROM ?? "noreply@aakasadigital.com",
    sendVerificationRequest,
  },
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      // Auto-provision an Organization + owner Profile + free Subscription
      // for brand-new Google sign-ins, matching the pre-migration behavior
      // of the old /auth/google/callback route. Credentials/invitation
      // sign-ins already have a Profile created explicitly by signUp/
      // acceptInvitation. Magic-link (portal customer) sign-ins deliberately
      // do NOT get an agent org — portal identity is resolved separately.
      if (account?.provider === "google" && user.id) {
        const existingProfile = await prisma.profile.findUnique({ where: { userId: user.id } });
        if (!existingProfile) {
          const fullName = user.name ?? user.email?.split("@")[0] ?? "User";
          const orgName = `${fullName}'s Workspace`;
          const slug = `${slugify(orgName)}-${Math.random().toString(36).slice(2, 7)}`;

          await prisma.$transaction(async (tx) => {
            const org = await tx.organization.create({ data: { name: orgName, slug } });
            await tx.profile.create({
              data: {
                userId: user.id!,
                organizationId: org.id,
                role: "owner",
                fullName,
                email: user.email ?? "",
                avatarUrl: user.image ?? null,
              },
            });
            await tx.subscription.create({
              data: { organizationId: org.id, plan: "free", status: "active" },
            });
          });
        }
      }
      return true;
    },
  },
});
