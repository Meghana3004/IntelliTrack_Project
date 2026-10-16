import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getServerSession } from "next-auth/next";
import { authOptions, isDemoModeEnabled } from "@/lib/auth";
import { isAppRole } from "@/lib/roles";
import { DemoBar } from "@/components/demo/demo-bar";
import { SwCleanup } from "@/components/shell/sw-cleanup";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IntelliTrack",
  description: "Delivery Exception Tracker",
};

const themeInitScript = `
try {
  var theme = window.localStorage.getItem("intellitrack-theme");
  document.documentElement.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
} catch (e) {}
`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const demoModeEnabled = isDemoModeEnabled();
  const session = demoModeEnabled ? await getServerSession(authOptions) : null;
  const currentRole = session?.user && isAppRole(session.user.role) ? session.user.role : null;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <SwCleanup />
        {demoModeEnabled && <DemoBar currentRole={currentRole} />}
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
