"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { logoutAction } from "@/lib/actions/logout";

const PLAN_LABEL: Record<string, { label: string; color: string }> = {
  free: { label: "Free",  color: "#6b7280" },
  pro:  { label: "Pro",   color: "#8b5cf6" },
  team: { label: "Team",  color: "#0ea5e9" },
};

function Avatar({ user, size = 32 }: { user: { name?: string | null; email?: string | null; image?: string | null }; size?: number }) {
  const initial = (user.name ?? user.email ?? "U")[0].toUpperCase();
  if (user.image) {
    return <img src={user.image} alt="" width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span
      className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4, background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
    >
      {initial}
    </span>
  );
}

export default function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!session?.user) return null;

  const user = session.user;
  const plan: string = (session.user as { plan?: string }).plan ?? "free";
  const planMeta = PLAN_LABEL[plan] ?? PLAN_LABEL.free;

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-full transition-all hover:bg-black/[0.06] cursor-pointer"
        aria-label="User menu"
      >
        <Avatar user={user} size={28} />
        <span className="text-[13px] font-medium text-gray-700 max-w-[120px] truncate hidden sm:block">{user.name ?? user.email}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-gray-400 hidden sm:block" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-60 rounded-2xl overflow-hidden z-50"
          style={{
            background: "var(--surface, #fff)",
            border: "1px solid var(--border, #e5e7eb)",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 20px 40px -8px rgba(0,0,0,0.12)",
          }}
        >
          {/* Header */}
          <div className="px-4 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border, #e5e7eb)" }}>
            <Avatar user={user} size={36} />
            <div className="min-w-0">
              {user.name && <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text-1, #0E0F12)" }}>{user.name}</p>}
              <p className="text-[11px] truncate" style={{ color: "var(--text-3, #6b7280)" }}>{user.email}</p>
              <span
                className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${planMeta.color}18`, color: planMeta.color }}
              >
                {planMeta.label}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="py-1.5">
            <MenuItem href="/chat" icon={<IconChat />}>Chat</MenuItem>
            <MenuItem href="/dashboard" icon={<IconDashboard />}>Dashboard</MenuItem>
            <MenuItem href="/security" icon={<IconShieldLock />}>Security &amp; 2FA</MenuItem>
          </div>

          <div style={{ borderTop: "1px solid var(--border, #e5e7eb)" }} className="py-1.5">
            <button
              onClick={() => logoutAction("/")}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors cursor-pointer hover:bg-red-50 text-red-500"
            >
              <IconSignOut />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-black/[0.04] cursor-pointer"
      style={{ color: "var(--text-2, #374151)" }}
    >
      <span className="w-4 h-4 flex-shrink-0 opacity-60">{icon}</span>
      {children}
    </a>
  );
}

function IconChat() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <rect x="3" y="3" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="14" y="3" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3" y="14" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="14" y="14" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconShieldLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="9" y="10.5" width="6" height="5" rx="1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 10.5V9a1.5 1.5 0 013 0v1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSignOut() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
