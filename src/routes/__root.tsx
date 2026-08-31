import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const APP_NAME = "Pi Zero Case Builder (Test)";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      {
        name: "description",
        content: "Orbit, set the lattice, and download a Voronoi-lid Raspberry Pi Zero case.",
      },
      { name: "theme-color", content: "#141414" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Roboto+Mono:wght@400;500&family=Roboto:wght@400;500;700&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="en" suppressHydrationWarning style={{ background: "#141414", color: "#F9FAFB" }}>
      <head>
        <HeadContent />
      </head>
      <body style={{ margin: 0, background: "#141414", color: "#F9FAFB", fontFamily: "Roboto, sans-serif" }}>
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
