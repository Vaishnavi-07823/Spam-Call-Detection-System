import { Outlet, Link, createRootRoute, HeadContent, Scripts, useLocation } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeToggle } from "@/components/ThemeToggle";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TrueShield AI — Real-Time Scam Call Detection" },
      { name: "description", content: "AI-powered real-time scam call detection and protection." },
      { name: "author", content: "TrueShield AI" },
      { name: "theme-color", content: "#1a1a2e" },
      { property: "og:title", content: "TrueShield AI — Real-Time Scam Call Detection" },
      { name: "twitter:title", content: "TrueShield AI — Real-Time Scam Call Detection" },
      { property: "og:description", content: "AI-powered real-time scam call detection and protection." },
      { name: "twitter:description", content: "AI-powered real-time scam call detection and protection." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/53454237-cf7a-4473-bc17-df91008e2e23" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/53454237-cf7a-4473-bc17-df91008e2e23" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "/icons/icon-192.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/icons/icon-192.png" },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const isConsentPage = location.pathname === "/.lovable/oauth/consent";
  const isHomePage = location.pathname === "/";

  if (isLoginPage || isConsentPage) {
    return (
      <div className="mx-auto max-w-lg min-h-screen relative">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <Outlet />
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background text-foreground relative selection:bg-primary/30 flex flex-col">
        {/* Top Navbar matching Reference Image (VoiceGuard style) */}
        <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#070D1F]/90 backdrop-blur-xl text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Brand Logo with Soundwave Icon */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex items-center gap-0.5 h-6 px-1">
                <span className="w-1 h-3.5 bg-blue-500 rounded-full group-hover:h-5 transition-all" />
                <span className="w-1 h-5 bg-blue-400 rounded-full group-hover:h-3 transition-all" />
                <span className="w-1 h-6 bg-blue-500 rounded-full group-hover:h-6 transition-all" />
                <span className="w-1 h-4 bg-cyan-400 rounded-full group-hover:h-5 transition-all" />
                <span className="w-1 h-2.5 bg-blue-500 rounded-full group-hover:h-4 transition-all" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-white leading-none">
                  Voice<span className="text-blue-500">Guard</span>
                </span>
                <span className="text-[9px] text-slate-400 tracking-wider uppercase mt-0.5 font-medium">
                  Live Call Detection System
                </span>
              </div>
            </Link>

            {/* Desktop Center Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
              <Link
                to="/"
                className="hover:text-blue-400 transition-colors"
                activeProps={{ className: "text-blue-400 font-bold" }}
              >
                Home
              </Link>
              <Link
                to="/monitoring"
                className="hover:text-blue-400 transition-colors"
                activeProps={{ className: "text-blue-400 font-bold" }}
              >
                Live Calls
              </Link>
              <Link
                to="/upload"
                className="hover:text-blue-400 transition-colors"
                activeProps={{ className: "text-blue-400 font-bold" }}
              >
                Transcripts
              </Link>
              <Link
                to="/history"
                className="hover:text-blue-400 transition-colors"
                activeProps={{ className: "text-blue-400 font-bold" }}
              >
                Detections
              </Link>
              <Link
                to="/settings"
                className="hover:text-blue-400 transition-colors"
                activeProps={{ className: "text-blue-400 font-bold" }}
              >
                Settings
              </Link>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Shield Active
              </div>

              <Link to="/login">
                <button className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors">
                  Login
                </button>
              </Link>

              <Link to="/monitoring">
                <button className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-xl shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  Start Live Call
                </button>
              </Link>

              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className={`flex-1 w-full ${isHomePage ? "p-0" : "max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24"}`}>
          <Outlet />
        </main>

        <BottomNav />
      </div>
    </AuthGuard>
  );
}
