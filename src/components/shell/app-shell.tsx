import Link from "next/link";
import { ROLE_LABEL, type AppRole } from "@/lib/roles";
import { NAV_LINKS } from "@/lib/nav-links";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { NotificationBell, type NotificationItem } from "@/components/shell/notification-bell";
import { UserMenu } from "@/components/shell/user-menu";
import { ChatWidget } from "@/components/shell/chat-widget";
import { ViewFrame } from "@/components/shell/view-frame";

const EXCEPTION_LINK_BASE: Partial<Record<AppRole, string>> = {
  DRIVER: "/driver/exception",
  WAREHOUSE_MANAGER: "/warehouse/exception",
  REGIONAL_MANAGER: "/regional/exception",
  LEADERSHIP: "/leadership/exception",
};

const CHATBOT_ROLES = new Set<AppRole>(["WAREHOUSE_MANAGER", "REGIONAL_MANAGER", "LEADERSHIP"]);

export function AppShell({
  role,
  userName,
  initialNotifications,
  children,
}: {
  role: AppRole;
  userName: string;
  initialNotifications: NotificationItem[];
  children: React.ReactNode;
}) {
  const links = NAV_LINKS[role];
  // @container is scoped to ONLY this header-group div, not the whole shell —
  // setting container-type (which @container does) makes an element the
  // containing block for its *fixed*-position descendants too, not just its
  // layout children. Wrapping <main>/<ChatWidget> in it as well silently
  // broke every `fixed` element inside them (the chat widget floating button,
  // notification toasts): "bottom-6 right-6" resolved against this div's own
  // box instead of the real viewport, so the button ended up positioned right
  // under the header instead of pinned to the screen's bottom-right corner,
  // with page content rendering over it. @lg: (not sm:) is still needed here
  // so the cosmetic mobile-frame preview (ViewFrame), which constrains width
  // but not the browser viewport, gets the compact nav.
  const shell = (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="@container">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-dark-slate/10 bg-app-surface/95 px-4 py-3 shadow-sm backdrop-blur print:hidden @lg:px-6">
          <div className="flex min-w-0 items-center gap-6">
            <span className="flex shrink-0 items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-sm font-bold text-white">
                IT
              </span>
              <span className="hidden @lg:inline">IntelliTrack</span>
            </span>
            <nav className="hidden items-center gap-1 @lg:flex">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-foreground/70 transition hover:bg-accent/10 hover:text-accent"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 @lg:gap-3">
            <span className="hidden rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-dark @lg:inline">
              {ROLE_LABEL[role]}
            </span>
            <NotificationBell
              initialNotifications={initialNotifications}
              exceptionLinkBase={EXCEPTION_LINK_BASE[role] ?? null}
            />
            <ThemeToggle />
            <UserMenu userName={userName} />
          </div>
        </header>

        <nav className="flex items-center gap-1 overflow-x-auto border-b border-dark-slate/10 bg-app-surface px-4 py-1.5 print:hidden @lg:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium text-foreground/70 transition hover:bg-accent/10 hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <main className="flex flex-1 flex-col bg-app-bg print:bg-white">{children}</main>
      {CHATBOT_ROLES.has(role) && <ChatWidget />}
    </div>
  );

  if (role === "DRIVER") {
    return (
      <div className="flex min-h-full flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-dark-slate/10 bg-app-surface/95 px-4 py-3 shadow-sm backdrop-blur print:hidden">
          <span className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-sm font-bold text-white">
              IT
            </span>
            IntelliTrack
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <NotificationBell
              initialNotifications={initialNotifications}
              exceptionLinkBase={EXCEPTION_LINK_BASE[role] ?? null}
            />
            <ThemeToggle />
            <UserMenu userName={userName} />
          </div>
        </header>

        <main className="flex flex-1 flex-col bg-app-bg print:bg-white">{children}</main>

        <nav
          className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-dark-slate/10 bg-app-surface/95 backdrop-blur print:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-foreground/60 transition hover:text-accent"
            >
              <DriverNavIcon href={link.href} className="h-6 w-6" />
              <span className="text-[11px] font-medium leading-none">{link.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    );
  }

  return <ViewFrame>{shell}</ViewFrame>;
}

function DriverNavIcon({ href, className }: { href: string; className?: string }) {
  if (href === "/driver") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12l2-2h4l2 2v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7zM9 12h6M15 8h3l3 3v4a1 1 0 0 1-1 1h-1M15 8v11M6 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"
        />
      </svg>
    );
  }

  if (href === "/driver/exception/new") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v4m0 3.5h.01M10.3 4.3 2.8 17a1.5 1.5 0 0 0 1.3 2.25h15.8a1.5 1.5 0 0 0 1.3-2.25L13.7 4.3a1.5 1.5 0 0 0-2.6 0z"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4h5v5H4V4zM15 4h5v5h-5V4zM4 15h5v5H4v-5zM15 15h2v2M19 15v2M15 19h2M19 19h.01M13 4v3M13 17v3M10 13h1M13 10h3"
      />
    </svg>
  );
}
