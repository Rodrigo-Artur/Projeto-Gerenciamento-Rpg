import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { authenticatePassword, googleAccount, rateAllowed } from "@/lib/server/authDatabase";

const providers: Array<ReturnType<typeof Credentials> | ReturnType<typeof Google>> = [
  Credentials({
    name: "E-mail e senha",
    credentials: {
      email: { label: "E-mail", type: "email" },
      password: { label: "Senha", type: "password" },
    },
    async authorize(credentials, request) {
      if (typeof credentials?.email !== "string" || typeof credentials.password !== "string") return null;
      const clientIp = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
      if (!rateAllowed("login", clientIp + ":" + credentials.email.toLowerCase(), 15, 900)) return null;
      const account = authenticatePassword(credentials.email, credentials.password);
      if (!account) return null;
      return { id: account.id, name: account.name, email: account.email };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google({
    clientId: process.env.AUTH_GOOGLE_ID,
    clientSecret: process.env.AUTH_GOOGLE_SECRET,
  }));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;
      const verified = (profile as { email_verified?: boolean } | undefined)?.email_verified === true;
      if (!verified || !user.email || !account.providerAccountId) return false;
      const linked = googleAccount(account.providerAccountId, user.email, user.name ?? "Jogador");
      // Never link the provider to an existing password account based only on email.
      if (!linked) return false;
      user.id = linked.id;
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as typeof session.user & { id: string }).id = token.sub;
      }
      return session;
    },
  },
});

