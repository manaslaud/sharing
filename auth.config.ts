import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const { pathname } = request.nextUrl;
      const isAuthRoute =
        pathname.startsWith("/login") || pathname.startsWith("/signup");
      const isPublic =
        isAuthRoute ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/cron") ||
        pathname.startsWith("/icons") ||
        pathname.startsWith("/serwist") ||
        pathname === "/manifest.webmanifest" ||
        pathname === "/sw.js" ||
        pathname === "/offline";

      if (isPublic) {
        if (isLoggedIn && isAuthRoute) {
          return Response.redirect(new URL("/", request.nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) {
        const login = new URL("/login", request.nextUrl);
        login.searchParams.set("callbackUrl", pathname);
        return Response.redirect(login);
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
