import NextAuth from "next-auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    {
      id: "oidc",
      name: "OIDC Provider",
      type: "oidc",
      issuer: process.env.OIDC_ISSUER_URL,
      clientId: process.env.OIDC_CLIENT_ID!,
      clientSecret: process.env.OIDC_CLIENT_SECRET!,
      authorization: { 
        params: { 
          scope: "openid email profile",
        } 
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
      }
      if (profile) {
        token.sub = profile.sub;
        token.email = profile.email;
        token.name = profile.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        (session as any).accessToken = token.accessToken;
        (session as any).idToken = token.idToken;
      }
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      // This gets called when user signs out
      // The actual IDP logout is handled by the signOutWithOIDC function
      // or the /api/auth/signout-oidc route which builds the appropriate
      // logout URL based on the provider's OIDC discovery document
      if (token?.idToken) {
        console.log('User signed out, ID token was present for IDP logout');
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
});

