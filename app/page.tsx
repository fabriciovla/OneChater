"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

// â”€â”€â”€ OneChat Logo Components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function OneChatIsotipo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" className={className}>
      <path d="M 32 22 Q 18 26 18 40 Q 20 54 34 54 Q 48 52 46 38 Q 44 24 32 22 Z" fill="#0E0F12" />
      <path d="M 68 26 Q 56 28 54 40 Q 56 54 70 54 Q 84 52 82 38 Q 80 26 68 26 Z" fill="#0E0F12" />
      <path d="M 50 56 Q 36 58 36 72 Q 38 86 52 84 Q 66 82 64 68 Q 62 56 50 56 Z" fill="#0E0F12" />
    </svg>
  );
}

function OneChatLogoFull({ className = "h-8" }: { className?: string }) {
  return (
    <Image
      src="/logos/horizontal-light.svg"
      alt="OneChat"
      height={44}
      width={220}
      className={className}
      priority
    />
  );
}

// â”€â”€â”€ SVG Icons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function IconBrain() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  );
}

function IconKey() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

function IconMessages() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconBarChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function IconZap() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconShuffle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function IconGithub() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-400">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// â”€â”€â”€ Model Logos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function OpenAILogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.677l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.843-3.369 2.02-1.168a.076.076 0 0 1 .071 0l4.83 2.786a4.494 4.494 0 0 1-.676 8.105v-5.677a.79.79 0 0 0-.402-.677zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
    </svg>
  );
}

function AnthropicLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
      <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017L3.674 20H0L6.57 3.52zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z" />
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function MistralLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-orange-400">
      <rect x="0" y="0" width="7" height="7" rx="1" />
      <rect x="17" y="0" width="7" height="7" rx="1" />
      <rect x="8.5" y="0" width="7" height="7" rx="1" />
      <rect x="0" y="8.5" width="7" height="7" rx="1" />
      <rect x="17" y="8.5" width="7" height="7" rx="1" />
      <rect x="0" y="17" width="7" height="7" rx="1" />
      <rect x="8.5" y="17" width="7" height="7" rx="1" />
      <rect x="17" y="17" width="7" height="7" rx="1" />
    </svg>
  );
}

function MetaLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-blue-400">
      <path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 2.92 1.22 1.978 0 3.262-1.081 4.069-2.753C23.88 17.085 24 15.8 24 14.449c0-2.6-.76-5.37-1.904-7.233-1.198-1.946-2.936-3.186-4.96-3.186-1.338 0-2.493.73-3.444 1.72C12.845 4.514 12 5.777 11.044 7.7c-.807-1.685-1.573-2.83-2.408-3.627C7.703 3.303 6.93 4.03 6.915 4.03z" />
    </svg>
  );
}

function GroqLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-green-400">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

// â”€â”€â”€ Navbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navItems = [
    { label: "Funcionalidades", href: "#features" },
    { label: "Como Funciona", href: "#how-it-works" },
    { label: "Precios", href: "#pricing" },
    { label: "GitHub", href: "https://github.com", external: true, icon: <IconGithub /> },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl border-b border-black/8 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center cursor-pointer group" aria-label="OneChat inicio">
          <div className="transition-opacity duration-200 group-hover:opacity-80">
            <OneChatLogoFull className="h-11 w-auto" />
          </div>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-black/[0.04] transition-all duration-200 cursor-pointer flex items-center gap-1.5"
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
            >
              {item.icon}
              {item.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a href="/chat" className="text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer px-4 py-2">
            Iniciar Sesion
          </a>
          <a href="/chat" className="btn-primary text-sm">
            Empezar gratis <IconArrowRight />
          </a>
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden p-2 text-gray-600 hover:text-gray-900 cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Abrir menÃº"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-black/8 px-6 py-4 flex flex-col gap-2">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 rounded-lg hover:bg-black/[0.04] transition-all cursor-pointer">
              {item.label}
            </a>
          ))}
          <a href="/chat" className="btn-primary text-sm mt-2 justify-center">
            Empezar gratis <IconArrowRight />
          </a>
        </div>
      )}
    </nav>
  );
}

// â”€â”€â”€ Hero Chat Preview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ChatPreview() {
  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <div
        className="rounded-2xl overflow-hidden border border-black/10"
        style={{
          background: "rgba(255,255,255,0.98)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.08)",
        }}
      >
        {/* Titlebar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-black/8 bg-gray-50/80">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-lg shadow-red-500/20" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-lg shadow-yellow-500/20" />
            <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-lg shadow-green-500/20" />
          </div>
          <div className="flex-1 mx-4">
            <div className="w-40 mx-auto h-6 rounded-lg bg-gray-100 border border-black/8 flex items-center justify-center">
              <span className="text-xs text-gray-500 font-mono">onechat.app/chat</span>
            </div>
          </div>
          <div className="flex gap-1.5">
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-br from-green-500/20 to-green-600/10 text-green-300 border border-green-500/30 shadow-sm">GPT-4o</span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-br from-orange-500/20 to-orange-600/10 text-orange-300 border border-orange-500/30 shadow-sm">Claude</span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-blue-300 border border-blue-500/30 shadow-sm">Gemini</span>
          </div>
        </div>

        {/* Chat area */}
        <div className="p-5 space-y-5 min-h-[300px] bg-white">
          {/* Memory chip */}
          <div className="group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-50 border border-black/10 shadow-sm w-fit hover:border-black/20 transition-all cursor-default">
            <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
            <span className="text-xs text-gray-700 font-medium">Memoria activa:</span>
            <span className="text-xs text-gray-500">Next.js Â· Cliente bancario Â· Respuestas cortas</span>
          </div>

          {/* User message */}
          <div className="flex justify-end">
            <div className="group max-w-[75%] px-5 py-3.5 rounded-2xl rounded-tr-sm text-sm text-white shadow-xl"
              style={{ background: "#0E0F12" }}>
              <p className="leading-relaxed font-medium">Â¿CÃ³mo optimizo esta query de Postgres?</p>
              <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center gap-3 text-xs text-white/70">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                  Enviado a 3 modelos
                </span>
                <span className="opacity-50">Â·</span>
                <span>Hace un momento</span>
              </div>
            </div>
          </div>

          {/* Three model responses */}
          <div className="grid grid-cols-3 gap-3">
            {/* GPT-4o */}
            <div className="group rounded-xl p-4 space-y-3 border border-black/8 bg-white hover:border-black/20 hover:shadow-md transition-all">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gray-100 border border-black/8 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                  <OpenAILogo />
                </div>
                <span className="text-sm font-semibold text-gray-900">GPT-4o</span>
                <div className="ml-auto w-2 h-2 rounded-full bg-green-500" />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                AgregÃ¡ un Ã­ndice compuesto en <code className="text-gray-700 bg-gray-100 px-1 py-0.5 rounded">user_id, created_at</code> y usÃ¡ EXPLAIN ANALYZE para verificar...
              </p>
              <div className="flex items-center gap-2 pt-2 border-t border-black/6">
                <span className="text-[10px] text-gray-400 font-medium">Respuesta completa â†’</span>
              </div>
            </div>

            {/* Claude */}
            <div className="group rounded-xl p-4 space-y-3 border border-black/8 bg-white hover:border-black/20 hover:shadow-md transition-all">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gray-100 border border-black/8 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                  <AnthropicLogo />
                </div>
                <span className="text-sm font-semibold text-gray-900">Claude</span>
                <div className="ml-auto w-2 h-2 rounded-full bg-green-500" />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Con pgvector en tu Supabase podÃ©s usar Ã­ndices <code className="text-gray-700 bg-gray-100 px-1 py-0.5 rounded">HNSW</code> para bÃºsquedas mÃ¡s eficientes...
              </p>
              <div className="flex items-center gap-2 pt-2 border-t border-black/6">
                <span className="text-[10px] text-gray-400 font-medium">Respuesta completa â†’</span>
              </div>
            </div>

            {/* Gemini */}
            <div className="group rounded-xl p-4 space-y-3 border border-black/8 bg-white hover:border-black/20 hover:shadow-md transition-all">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gray-100 border border-black/8 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                  <GoogleLogo />
                </div>
                <span className="text-sm font-semibold text-gray-900">Gemini</span>
                <div className="ml-auto w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
              </div>
              <div className="flex gap-1.5 items-center h-6">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-black/6">
                <span className="text-[10px] text-gray-400 font-medium">Generando respuesta...</span>
              </div>
            </div>
          </div>

          {/* Input bar */}
          <div className="flex gap-2 items-center mt-4">
            <div className="flex-1 h-9 rounded-xl bg-gray-50 border border-black/10 flex items-center px-3">
              <span className="text-xs text-gray-400">Preguntale a todos los modelos a la vez...</span>
            </div>
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer transition-transform hover:scale-105"
              style={{ background: "#0E0F12" }}
              aria-label="Enviar mensaje"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 rounded-full blur-3xl opacity-40"
        style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.02))" }}
      />
    </div>
  );
}

// â”€â”€â”€ Features â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const memorySubItems = [
  {
    icon: <IconZap />,
    label: "Captura automática",
    desc: "Extrae hechos y preferencias luego de cada chat sin intervención.",
  },
  {
    icon: <IconPencil />,
    label: "Perfil editable",
    desc: "Ves y controlás exactamente qué sabe OneChat sobre vos.",
  },
  {
    icon: <IconSearch />,
    label: "Búsqueda semántica",
    desc: "\"¿Qué decidimos el mes pasado?\" Respuesta en segundos.",
  },
  {
    icon: <IconShuffle />,
    label: "Portable entre modelos",
    desc: "GPT, Claude y Gemini te conocen igual. La memoria viaja.",
  },
];

const features = [
  {
    icon: <IconMessages />,
    title: "Chat multi-modelo",
    description:
      "Mandá un mensaje y recibí respuestas de GPT, Claude y Gemini en tiempo real. Comparalos lado a lado y elegí la mejor.",
    gradient: "from-blue-500 to-cyan-500",
    glow: "rgba(59,130,246,0.3)",
    subItems: ["Streaming en tiempo real", "Vista lado a lado", "Cambio sin perder contexto"],
  },
  {
    icon: <IconKey />,
    title: "Tus propias API keys",
    description:
      "Conectá tus keys de OpenAI, Anthropic y Google. Pagás directo a los proveedores — 0% de fee sobre inferencia.",
    gradient: "from-cyan-500 to-teal-500",
    glow: "rgba(34,211,238,0.25)",
    subItems: ["Encriptación AES-256", "Configuración única", "Privacidad total"],
  },
  {
    icon: <IconFolder />,
    title: "Proyectos aislados",
    description:
      "Agrupá conversaciones por cliente o tema. La memoria de cada proyecto vive separada de los demás.",
    gradient: "from-green-500 to-emerald-500",
    glow: "rgba(34,197,94,0.25)",
    subItems: ["Memoria por proyecto", "Prompts reutilizables", "Historial separado"],
  },
  {
    icon: <IconBarChart />,
    title: "Dashboard de gasto",
    description:
      "Visualizá cuánto gastás en cada modelo. Comparativas de costo por pregunta, alertas y presupuesto mensual.",
    gradient: "from-orange-400 to-amber-500",
    glow: "rgba(249,115,22,0.25)",
    subItems: ["Comparativa por modelo", "Alertas de consumo", "Presupuesto mensual"],
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="relative py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="section-label">Funcionalidades</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            Nunca más empezar de cero
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto text-lg">
            Cada vez que cambiás de modelo, perdés contexto. OneChat lo recuerda todo — en todos los modelos, siempre.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Living Memory — featured card (2 cols) */}
          <div className="md:col-span-2 glass-card-hover p-8 group">
            <div className="flex items-start gap-4 mb-6">
              <div
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                style={{ boxShadow: "0 4px 16px rgba(212,119,78,0.3)" }}
              >
                <IconBrain />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-xl font-bold text-gray-900">Living Memory</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-gray-700 bg-black/6 border border-black/12">
                    Diferenciador principal
                  </span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">
                  El único sistema de memoria persistente que funciona entre todos tus modelos de IA. Captura automática, perfil editable y búsqueda semántica de todo tu historial.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {memorySubItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-black/[0.03] border border-black/[0.06] hover:bg-black/[0.05] transition-colors"
                >
                  <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500/15 to-amber-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 flex-shrink-0 mt-0.5">
                    {item.icon}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{item.label}</div>
                    <div className="text-xs text-gray-500 leading-relaxed mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Regular feature cards */}
          {features.map((f) => (
            <div key={f.title} className="glass-card-hover p-6 group">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-white mb-4 transition-transform duration-300 group-hover:scale-110`}
                style={{ boxShadow: `0 4px 16px ${f.glow}` }}
              >
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{f.description}</p>
              <ul className="space-y-1.5">
                {f.subItems.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// â”€â”€â”€ How It Works â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const steps = [
  {
    n: "01",
    title: "ConectÃ¡ tus API keys",
    description: "PegÃ¡ tus keys de OpenAI, Anthropic o Google. Se encriptan con AES-256 y se guardan solo en tu cuenta, nunca en el cliente.",
    detail: ["ConfiguraciÃ³n Ãºnica", "Todos los proveedores principales", "EncriptaciÃ³n al guardar"],
  },
  {
    n: "02",
    title: "ChateÃ¡ con todos los modelos",
    description: "EscribÃ­ una vez, recibÃ­ respuestas de GPT, Claude y Gemini en tiempo real. Comparalos y elegÃ­. CambiÃ¡ de modelo sin perder contexto.",
    detail: ["Respuestas en streaming", "Vista lado a lado", "Cambio de modelo sin fricciÃ³n"],
  },
  {
    n: "03",
    title: "La memoria aprende con vos",
    description: "DespuÃ©s de cada chat, OneChat extrae lo relevante: proyectos activos, preferencias, decisiones. La prÃ³xima vez, todos los modelos ya te conocen.",
    detail: ["Captura automÃ¡tica", "Perfil editable por vos", "BÃºsqueda semÃ¡ntica del historial"],
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-28 px-6">

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="section-label">CÃ³mo funciona</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            Funcionando en{" "}
            <span className="gradient-text">60 segundos</span>
          </h2>
          <p className="mt-4 text-gray-500 max-w-lg mx-auto text-lg">
            Sin setup complicado. Sin suscripciones que gestionar. PegÃ¡s tus keys y empezÃ¡s.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-12 left-[calc(33.33%+1rem)] right-[calc(33.33%+1rem)] h-px"
            style={{ background: "linear-gradient(90deg,rgba(0,0,0,0.15),rgba(0,0,0,0.05))" }} />

          {steps.map((step, i) => (
            <div key={step.n} className="relative">
              <div className="flex items-center gap-4 mb-5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 animate-glow-pulse"
                  style={{ background: `#0E0F12`, animationDelay: `${i * 0.5}s` }}
                >
                  {step.n}
                </div>
                <div className="h-px flex-1 md:hidden"
                  style={{ background: "linear-gradient(90deg,rgba(0,0,0,0.1),transparent)" }} />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{step.description}</p>

              <ul className="space-y-2">
                {step.detail.map((d) => (
                  <li key={d} className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="w-4 h-4 rounded-full bg-black/8 flex items-center justify-center text-gray-700">
                      <IconCheck />
                    </span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// â”€â”€â”€ Models Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const models = [
  { name: "GPT-4o",      subtitle: "OpenAI",    logo: <OpenAILogo />,    badge: "Popular",        badgeColor: "text-green-400 bg-green-400/10 border-green-400/20" },
  { name: "Claude 3.5",  subtitle: "Anthropic", logo: <AnthropicLogo />, badge: "Mejor razonamiento", badgeColor: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
  { name: "Gemini Pro",  subtitle: "Google",    logo: <GoogleLogo />,    badge: "Multimodal",     badgeColor: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  { name: "Mistral",     subtitle: "Mistral AI",logo: <MistralLogo />,   badge: "RÃ¡pido",         badgeColor: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  { name: "Llama 3",     subtitle: "Meta",      logo: <MetaLogo />,      badge: "Open source",    badgeColor: "text-violet-400 bg-violet-400/10 border-violet-400/20" },
  { name: "Groq",        subtitle: "Groq",      logo: <GroqLogo />,      badge: "Ultra rÃ¡pido",   badgeColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
];

function ModelsSection() {
  return (
    <section id="models" className="relative py-28 px-6">

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <span className="section-label">Modelos soportados</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            Todos los modelos que usas
          </h2>
          <p className="mt-4 text-gray-500 max-w-md mx-auto text-lg">
            Conectate a cualquier proveedor principal. Se agregan mas modelos regularmente.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {models.map((m, i) => (
            <div
              key={m.name}
              className="glass-card-hover p-5 flex flex-col items-center text-center gap-3"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-black/8 flex items-center justify-center">
                {m.logo}
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">{m.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{m.subtitle}</div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs border ${m.badgeColor}`}>
                {m.badge}
              </span>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-400 text-sm mt-8">
          + xAI Grok, DeepSeek, Cohere, Perplexity y cualquier endpoint compatible con OpenAI
        </p>
      </div>
    </section>
  );
}

// â”€â”€â”€ Pricing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "para siempre",
    description: "Para empezar sin fricciÃ³n. Sin tarjeta de crÃ©dito.",
    features: [
      "BYOK (tus propias API keys)",
      "100 mensajes con memoria al mes",
      "1 proyecto",
      "Historial de conversaciones",
      "Soporte por comunidad",
    ],
    cta: "Empezar gratis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$7",
    period: "/ mes",
    description: "Para profesionales que viven en la IA todos los dÃ­as.",
    features: [
      "API keys ilimitadas",
      "Memoria ilimitada",
      "BÃºsqueda semÃ¡ntica del historial",
      "Proyectos ilimitados",
      "Sync entre dispositivos",
      "Dashboard de gasto completo",
      "Soporte prioritario",
    ],
    cta: "Probar Pro",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$19",
    period: "/ usuario / mes",
    description: "Para equipos que quieren IA con contexto compartido.",
    features: [
      "Todo lo de Pro",
      "Hasta 10 integrantes",
      "Biblioteca de prompts compartida",
      "Memoria de equipo",
      "SSO / SAML",
      "Soporte dedicado por Slack",
    ],
    cta: "Contactarnos",
    highlighted: false,
  },
];

function PricingSection() {
  return (
    <section id="pricing" className="relative py-28 px-6">

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="section-label">Precios</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            Precios simples y transparentes
          </h2>
          <p className="mt-4 text-gray-500 max-w-md mx-auto text-lg">
            Ya pagÃ¡s tus API keys. OneChat tiene que ser accesible tambiÃ©n.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 flex flex-col gap-5 transition-all duration-300 ${
                plan.highlighted
                  ? "border border-black/20"
                  : "glass-card"
              }`}
              style={
                plan.highlighted
                  ? {
                      background: "#0E0F12",
                      boxShadow: "0 8px 48px rgba(0,0,0,0.2)",
                    }
                  : {}
              }
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full text-xs font-bold text-white"
                    style={{ background: "#0E0F12" }}>
                    MÃ¡s popular
                  </span>
                </div>
              )}

              <div>
                <div className={`text-sm font-semibold uppercase tracking-widest ${plan.highlighted ? "text-white/50" : "text-gray-400"}`}>{plan.name}</div>
                <div className="mt-2 flex items-end gap-1">
                  <span className={`text-4xl font-bold ${plan.highlighted ? "text-white" : "text-gray-900"}`}>{plan.price}</span>
                  <span className={`mb-1 text-sm ${plan.highlighted ? "text-white/60" : "text-gray-500"}`}>{plan.period}</span>
                </div>
                <p className={`mt-2 text-sm ${plan.highlighted ? "text-white/60" : "text-gray-500"}`}>{plan.description}</p>
              </div>

              <ul className="space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className={`flex items-start gap-2.5 text-sm ${plan.highlighted ? "text-white/80" : "text-gray-600"}`}>
                    <span className={`w-4 h-4 mt-0.5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.highlighted ? "bg-white/15 text-white" : "bg-black/8 text-gray-700"}`}>
                      <IconCheck />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
                  plan.highlighted
                    ? "btn-primary justify-center"
                    : "btn-ghost justify-center"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-400 text-sm mt-8">
          Pagos en pesos argentinos, soles, pesos mexicanos y reales Â· Mercado Pago Â· Tarjeta local Â· Stripe
        </p>
      </div>
    </section>
  );
}

// â”€â”€â”€ CTA Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function CTASection() {
  return (
    <section className="relative py-28 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div
          className="relative rounded-3xl p-12 md:p-20 overflow-hidden gradient-border"
          style={{
            background: "#F7F7F5",
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        >

          <div className="relative z-10">
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => <IconStar key={i} />)}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
              Â¿Listo para unificar tu{" "}
              <span className="gradient-text">flujo de trabajo con IA?</span>
            </h2>
            <p className="mt-5 text-lg text-gray-500 max-w-xl mx-auto">
              Ãšnete a miles de profesionales y freelancers en LATAM que usan OneChat para aprovechar al mÃ¡ximo cada modelo de IA, con una memoria que los conecta a todos.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/chat" className="btn-primary text-base px-8 py-3.5">
                Empezar gratis <IconArrowRight />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost text-base px-8 py-3.5"
              >
                <IconGithub /> Ver en GitHub
              </a>
            </div>
            <p className="mt-5 text-sm text-gray-400">
              Sin tarjeta de crÃ©dito Â· CÃ³digo abierto Â· Self-hosteable
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// â”€â”€â”€ Footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Footer() {
  const links = {
    Producto:     ["Funcionalidades", "CÃ³mo funciona", "Precios", "Novedades"],
    Developers:   ["DocumentaciÃ³n", "Referencia API", "Self-hosting", "GitHub"],
    Empresa:      ["Acerca de", "Blog", "PolÃ­tica de privacidad", "TÃ©rminos de uso"],
    Comunidad:    ["Discord", "Twitter / X", "Reddit", "Newsletter"],
  };

  return (
    <footer className="border-t border-black/8 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <OneChatLogoFull className="h-7 w-auto" />
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              Una memoria. Todas las IAs. TraÃ© tus keys, controlÃ¡ tus datos.
            </p>
            <div className="mt-4 flex gap-3">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-black/[0.04] border border-black/10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-black/[0.08] transition-all cursor-pointer">
                <IconGithub />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-black/[0.04] border border-black/10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-black/[0.08] transition-all cursor-pointer">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">{section}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-black/6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            Â© {new Date().getFullYear()} OneChat. CÃ³digo abierto bajo licencia MIT.
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Todos los sistemas operativos
            </span>
            <span className="text-gray-300">Â·</span>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">Privacidad</a>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">TÃ©rminos</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// â”€â”€â”€ Hero Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-16 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.04) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

      <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col items-center">
        {/* Headline */}
        <h1 className="animate-fade-up delay-100 text-center text-5xl md:text-7xl font-bold tracking-tight text-gray-900 leading-[1.1] max-w-4xl">
          Una memoria.{" "}
          <span className="gradient-text">Todas las IAs.</span>
        </h1>

        {/* Subtext */}
        <p className="animate-fade-up delay-200 mt-6 text-center text-lg md:text-xl text-gray-500 max-w-2xl leading-relaxed">
          La única app de chat con IA que no te olvida cuando cambiás de modelo. GPT, Claude y Gemini en un solo lugar, con una memoria que viaja con vos.
        </p>

        {/* CTAs */}
        <div className="animate-fade-up delay-300 mt-8 flex flex-col sm:flex-row gap-3">
          <a href="/chat" className="btn-primary text-base px-8 py-3.5">
            Empezar con OneChat gratis <IconArrowRight />
          </a>
          <button className="btn-ghost text-base px-8 py-3.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Ver demo
          </button>
        </div>

        {/* Social proof */}
        <div className="animate-fade-up delay-400 mt-6 flex items-center gap-3 text-sm text-gray-500">
          <div className="flex -space-x-2">
            {["#1A1A1A", "#3D3D3D", "#5C5C5C", "#7A7A7A", "#999999"].map(
              (c, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: c }}
                >
                  {["A", "B", "C", "D", "E"][i]}
                </div>
              )
            )}
          </div>
          <span>
            Confiado por{" "}
            <span className="text-gray-900 font-medium">2.400+</span>{" "}
            profesionales en LATAM
          </span>
          <span className="text-gray-300">·</span>
          <span className="flex items-center gap-1">
            <IconStar />
            <span className="text-gray-900 font-medium">4.9</span>
          </span>
        </div>

        {/* Video */}
        <div className="animate-fade-up delay-500 w-full mt-16 flex justify-center px-4">
          <div
            className="relative w-full rounded-2xl overflow-hidden"
            style={{
              maxWidth: "900px",
              background: "#0E0F12",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "inset 0 2px 0 rgba(255,255,255,0.06), 0 16px 64px rgba(0,0,0,0.28), 0 4px 16px rgba(0,0,0,0.18)",
            }}
          >
            <iframe
              id="demo-video"
              className="w-full block"
              style={{ height: "600px" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function Home() {
  useEffect(() => {
    const iframe = document.getElementById("demo-video") as HTMLIFrameElement;
    if (!iframe) return;

    let hasPlayed = false;

    const handleScroll = () => {
      if (hasPlayed) return;
      const scrollY = window.scrollY;
      const videoSection = iframe.closest("section");
      if (videoSection) {
        const rect = videoSection.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.7) {
          hasPlayed = true;
          iframe.src = "/video-demo.html?autoplay=false";
          iframe.contentWindow?.postMessage("play-video", "*");
          window.removeEventListener("scroll", handleScroll);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ModelsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  );
}
