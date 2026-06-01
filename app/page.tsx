"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

// â"€â"€â"€ OneChat Logo Components â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

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
      src="/OneChater-35-blobs/svg/horizontal-light.svg"
      alt="OneChat"
      height={44}
      width={220}
      className={className}
      priority
    />
  );
}

// â"€â"€â"€ SVG Icons â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

// Brand blob icons - inspired by 3-blob OneChat logo
// All use organic Q-curves, filled (no strokes), to match logo language

function IconBrain() {
  // Literal mini-logo: 3 memory blobs in triangle = memoria viva
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M7.4 4Q3.6 5 3.6 8.6Q4.1 12.5 7.6 12.5Q11.1 12 10.7 8.4Q10.3 4.5 7.4 4Z" />
      <path d="M16.4 5Q13.4 5.5 13 8.6Q13.5 12.5 16.6 12.5Q20.4 12 20 8.4Q19.6 5.5 16.4 5Z" />
      <path d="M12 13.5Q8.4 14 8.4 17.5Q8.9 21 12.4 20.5Q15.9 20 15.5 16.5Q15 13.5 12 13.5Z" />
    </svg>
  );
}

function IconKey() {
  // Blob bow + shaft with two teeth
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M8 4Q3.5 5 3.5 9Q4 13.5 8.5 13.5Q13 13 12.5 8.5Q12 4.5 8 4ZM8 7.5Q6.5 7.7 6.5 9.2Q6.8 10.8 8.2 10.7Q9.7 10.5 9.5 9Q9.3 7.5 8 7.5Z" />
      <path d="M12 10.5Q12.3 11.5 13 12L21 20Q21.6 20.6 20 22Q18.4 23.4 17.8 22.8L17 22L18 21L17 20L16 21L15 20L16.5 18.5L13 15Q12 14 11 14Z" />
    </svg>
  );
}

function IconMessages() {
  // 3 chat blobs - one big with tail + two smaller stacked
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M4 4Q2 4.3 2 6.5V11.5Q2 13.5 4 13.8H6L5 16.5L9 13.8H13Q15 13.5 15 11.5V6.5Q15 4.3 13 4Z" />
      <path d="M17 9Q15.5 9.2 15.5 10.8Q15.5 11.2 15.5 11.6Q15.5 15 17 15.2H19L18 17L21 15.2H21.5Q23 15 23 13.5V10.8Q23 9.2 21.5 9Z" />
    </svg>
  );
}

function IconFolder() {
  // Blob folder with rounded organic tab
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M3 6Q2 6 2 7.5V9H22Q22 7.5 21 7.5H12L10.5 5.5Q10 5 9 5H4Q3 5 3 6Z" />
      <path d="M2 10.5V18.5Q2 20.5 4 20.5H20Q22 20.5 22 18.5V10.5Z" />
    </svg>
  );
}

function IconBarChart() {
  // 3 blob bars in triangle composition - varying heights
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <rect x="3" y="13" width="5" height="8" rx="2.2" />
      <rect x="9.5" y="7" width="5" height="14" rx="2.2" />
      <rect x="16" y="3" width="5" height="18" rx="2.2" />
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

function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2c-4 2.5-4 17.5 0 20" />
      <path d="M12 2c4 2.5 4 17.5 0 20" />
    </svg>
  );
}

// â"€â"€â"€ Model Logos â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

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

function XAILogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function DeepSeekLogo() {
  return (
    <svg viewBox="0 0 100 100" className="w-7 h-7" fill="none">
      <circle cx="50" cy="50" r="48" fill="#4462F5"/>
      <circle cx="50" cy="50" r="26" fill="white"/>
      <circle cx="50" cy="50" r="13" fill="#4462F5"/>
    </svg>
  );
}

function CohereLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#39D3C3" strokeWidth="2"/>
      <circle cx="12" cy="12" r="5" fill="#39D3C3" opacity="0.5"/>
      <circle cx="12" cy="12" r="2.5" fill="#39D3C3"/>
    </svg>
  );
}

function PerplexityLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
      <path d="M12 3L21 8.5V15.5L12 21L3 15.5V8.5L12 3Z" stroke="#1CB0F6" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M12 3V21" stroke="#1CB0F6" strokeWidth="1.5"/>
      <path d="M3 8.5L21 15.5M21 8.5L3 15.5" stroke="#1CB0F6" strokeWidth="1" opacity="0.5"/>
    </svg>
  );
}

// â"€â"€â"€ Navbar â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: "Funcionalidades", href: "#features" },
    { label: "Como Funciona", href: "#how-it-works" },
    { label: "Precios", href: "#pricing" },
    { label: "GitHub", href: "https://github.com", external: true, icon: <IconGithub /> },
  ];

  return (
    <nav
      className="nav-enter absolute top-0 left-0 right-0 z-50"
      style={{
        background: "transparent",
      }}
    >
      <div className="w-full max-w-[1600px] mx-auto px-6 md:px-10 lg:px-16 h-[72px] flex items-center justify-between">
        {/* Logo — far left */}
        <a href="#" className="flex items-center cursor-pointer group" aria-label="OneChat inicio">
          <div className="transition-all duration-300 group-hover:opacity-80 group-hover:scale-[1.02]">
            <OneChatLogoFull className="h-9 w-auto" />
          </div>
        </a>

        {/* Right group — links + CTAs */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="px-3.5 py-1.5 text-[13px] font-medium text-gray-600 hover:text-gray-900 rounded-full hover:bg-black/[0.05] transition-all duration-200 cursor-pointer flex items-center gap-1.5"
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
            >
              {item.icon}
              {item.label}
            </a>
          ))}

          <span className="mx-2 h-5 w-px bg-gradient-to-b from-transparent via-black/15 to-transparent" />

          <a href="/login" className="px-3.5 py-1.5 text-[13px] font-medium text-gray-600 hover:text-gray-900 rounded-full hover:bg-black/[0.05] transition-all cursor-pointer">
            Iniciar sesión
          </a>
          <a
            href="/login"
            className="ml-1 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-semibold text-white transition-all duration-200 cursor-pointer hover:-translate-y-px"
            style={{
              background: "linear-gradient(180deg, #1F2025 0%, #0E0F12 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.4), 0 1px 2px rgba(14,15,18,0.2), 0 6px 18px -6px rgba(14,15,18,0.35)",
            }}
          >
            Empezar gratis <IconArrowRight />
          </a>
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden p-2.5 text-gray-700 hover:text-gray-900 rounded-full hover:bg-black/[0.05] cursor-pointer transition-all"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileOpen}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
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
        <div className="md:hidden border-t border-black/8 px-6 py-4 flex flex-col gap-1 bg-white/85 backdrop-blur-xl">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-xl hover:bg-black/[0.05] transition-all cursor-pointer flex items-center gap-2">
              {item.icon}
              {item.label}
            </a>
          ))}
          <a href="/login" className="btn-primary text-sm mt-2 justify-center">
            Empezar gratis <IconArrowRight />
          </a>
        </div>
      )}
    </nav>
  );
}

// â"€â"€â"€ Hero Chat Preview â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

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
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-br from-green-500/20 to-green-600/10 text-green-300 border border-green-500/30 shadow-sm">GPT-5</span>
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
            <span className="text-xs text-gray-500">Next.js · Cliente bancario · Respuestas cortas</span>
          </div>

          {/* User message */}
          <div className="flex justify-end">
            <div className="group max-w-[75%] px-5 py-3.5 rounded-2xl rounded-tr-sm text-sm text-white shadow-xl"
              style={{ background: "#0E0F12" }}>
              <p className="leading-relaxed font-medium">¿Cómo optimizo esta query de Postgres?</p>
              <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center gap-3 text-xs text-white/70">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                  Enviado a 3 modelos
                </span>
                <span className="opacity-50">·</span>
                <span>Hace un momento</span>
              </div>
            </div>
          </div>

          {/* Three model responses */}
          <div className="grid grid-cols-3 gap-3">
            {/* GPT-5 */}
            <div className="group rounded-xl p-4 space-y-3 border border-black/8 bg-white hover:border-black/20 hover:shadow-md transition-all">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gray-100 border border-black/8 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                  <OpenAILogo />
                </div>
                <span className="text-sm font-semibold text-gray-900">GPT-5</span>
                <div className="ml-auto w-2 h-2 rounded-full bg-green-500" />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Agregá un índice compuesto en <code className="text-gray-700 bg-gray-100 px-1 py-0.5 rounded">user_id, created_at</code> y usá EXPLAIN ANALYZE para verificar...
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
                Con pgvector en tu Supabase podés usar índices <code className="text-gray-700 bg-gray-100 px-1 py-0.5 rounded">HNSW</code> para búsquedas más eficientes...
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

// â"€â"€â"€ Features â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

// ── Feature showcase config ──────────────────────────────────────────

type FeatureAccent = {
  from: string;
  to: string;
  glow: string;
  text: string;
  ring: string;
  bar: string;
};

type FeatureDef = {
  id: string;
  n: string;
  name: string;
  short: string;
  badge?: string;
  long: string;
  icon: React.ReactNode;
  accent: FeatureAccent;
};

const FEATURES: FeatureDef[] = [
  {
    id: "memory",
    n: "01",
    name: "Memoria viva",
    short: "Contexto siempre activo",
    badge: "Diferenciador",
    long: "El único sistema de memoria que funciona entre todos tus modelos. Captura proyectos, stack, decisiones y tono automáticamente.",
    icon: <IconBrain />,
    accent: {
      from: "from-orange-500",
      to: "to-amber-500",
      glow: "rgba(249,115,22,0.45)",
      text: "text-orange-600",
      ring: "rgba(249,115,22,0.25)",
      bar: "from-orange-500 to-amber-400",
    },
  },
  {
    id: "multi",
    n: "02",
    name: "Chat multi-modelo",
    short: "Un mensaje, 3 respuestas",
    long: "Escribí una vez y recibí respuestas en paralelo de GPT, Claude y Gemini. Comparalas lado a lado y quedate con la mejor.",
    icon: <IconMessages />,
    accent: {
      from: "from-blue-500",
      to: "to-cyan-500",
      glow: "rgba(59,130,246,0.45)",
      text: "text-blue-600",
      ring: "rgba(59,130,246,0.25)",
      bar: "from-blue-500 to-cyan-400",
    },
  },
  {
    id: "byok",
    n: "03",
    name: "Tus propias API keys",
    short: "0% fee, pagás directo",
    long: "Pegá tus keys de OpenAI, Anthropic, Google. Encriptadas con AES-256, guardadas en tu cuenta. Sin markup, sin intermediarios.",
    icon: <IconKey />,
    accent: {
      from: "from-violet-500",
      to: "to-purple-600",
      glow: "rgba(139,92,246,0.45)",
      text: "text-violet-600",
      ring: "rgba(139,92,246,0.25)",
      bar: "from-violet-500 to-purple-500",
    },
  },
  {
    id: "projects",
    n: "04",
    name: "Proyectos aislados",
    short: "Cada cliente, su espacio",
    long: "Separá contextos por proyecto. Cada uno con su propia memoria, historial y configuración. Sin contaminación entre clientes.",
    icon: <IconFolder />,
    accent: {
      from: "from-green-500",
      to: "to-emerald-600",
      glow: "rgba(34,197,94,0.45)",
      text: "text-emerald-600",
      ring: "rgba(34,197,94,0.25)",
      bar: "from-emerald-500 to-green-400",
    },
  },
  {
    id: "spend",
    n: "05",
    name: "Dashboard de gasto",
    short: "Sabés cuánto gastás",
    long: "Visualizá el gasto por modelo, por proyecto, por día. Poné límites y dormí tranquilo sabiendo que no te van a cobrar de más.",
    icon: <IconBarChart />,
    accent: {
      from: "from-orange-400",
      to: "to-amber-500",
      glow: "rgba(245,158,11,0.45)",
      text: "text-amber-600",
      ring: "rgba(245,158,11,0.25)",
      bar: "from-orange-400 to-amber-400",
    },
  },
];

const TERMINAL_LINES = [
  { k: "proyecto", v: "Cliente bancario", kc: "text-purple-300", vc: "text-green-300" },
  { k: "stack",    v: "Supabase TypeScript Tailwind", kc: "text-purple-300", vc: "text-green-300" },
  { k: "tono",     v: "tecnico, sin rodeos, rioplatense", kc: "text-purple-300", vc: "text-green-300" },
  { k: "decision", v: "pgvector sobre Pinecone por costo", kc: "text-purple-300", vc: "text-green-300" },
  { k: "modelos",  v: "gpt-5.5 claude-sonnet-4-6 gemini-2.5-flash", kc: "text-blue-300", vc: "text-yellow-200" },
];

const DASH_BARS = [
  { name: "GPT-5", amount: "$2.40", pct: 50, color: "#1f2937", delay: 100 },
  { name: "Claude", amount: "$1.80", pct: 38, color: "#f97316", delay: 200 },
  { name: "Gemini", amount: "$0.60", pct: 12, color: "#3b82f6", delay: 300 },
];

const FOLDERS = [
  { depth: 0, isFolder: true,  name: "Cliente bancario", active: true },
  { depth: 1, isFolder: false, name: "API optimization",  active: false },
  { depth: 1, isFolder: false, name: "DB schema review",  active: false },
  { depth: 0, isFolder: true,  name: "Proyecto personal", active: false },
  { depth: 0, isFolder: true,  name: "Dev trabajo",       active: false },
];

const MEMORY_BULLETS = [
  { icon: <IconZap />, label: "Captura automática", desc: "Stack y decisiones, sin esfuerzo." },
  { icon: <IconPencil />, label: "Perfil editable", desc: "Agregás, editás y borrás qué sabe de vos." },
  { icon: <IconSearch />, label: "Búsqueda semántica", desc: "Respuesta exacta en segundos." },
  { icon: <IconShuffle />, label: "Portable", desc: "Todos los modelos te conocen igual." },
];

const MULTI_BULLETS = [
  { icon: <IconZap />, label: "Streaming paralelo", desc: "Tres respuestas a la vez." },
  { icon: <IconSearch />, label: "Vista comparativa", desc: "Diferencias resaltadas al toque." },
  { icon: <IconShuffle />, label: "Modelos a elección", desc: "Activá o desactivá por chat." },
  { icon: <IconPencil />, label: "Fork de respuesta", desc: "Tomá la mejor y seguí." },
];

const BYOK_BULLETS = [
  { icon: <IconShield />, label: "AES-256 encriptado", desc: "Keys cifradas en tu sesión." },
  { icon: <IconZap />, label: "Setup en 30s", desc: "Pegá y listo, sin OAuth." },
  { icon: <IconKey />, label: "Rotación fácil", desc: "Cambiá o borrá cuando quieras." },
  { icon: <IconShuffle />, label: "Multi-proveedor", desc: "OpenAI, Anthropic, Google y más." },
];

const PROJECT_BULLETS = [
  { icon: <IconFolder />, label: "Memoria aislada", desc: "Sin mezcla entre clientes." },
  { icon: <IconKey />, label: "Keys por proyecto", desc: "Asigná API keys distintas." },
  { icon: <IconSearch />, label: "Búsqueda scoped", desc: "Filtrá por proyecto activo." },
  { icon: <IconPencil />, label: "Config custom", desc: "Modelo y tono por proyecto." },
];

const SPEND_BULLETS = [
  { icon: <IconBarChart />, label: "Tracking en vivo", desc: "Cada request al toque." },
  { icon: <IconShield />, label: "Límites configurables", desc: "Cortá al llegar al techo." },
  { icon: <IconSearch />, label: "Breakdown profundo", desc: "Por modelo, proyecto o día." },
  { icon: <IconZap />, label: "Alertas inteligentes", desc: "Aviso si algo se dispara." },
];

const FEATURE_BULLETS: Record<string, Array<{ icon: React.ReactNode; label: string; desc: string }>> = {
  memory: MEMORY_BULLETS,
  multi: MULTI_BULLETS,
  byok: BYOK_BULLETS,
  projects: PROJECT_BULLETS,
  spend: SPEND_BULLETS,
};

function FeatureVisual({ id, inView }: { id: string; inView: boolean }) {
  if (id === "memory") {
    return (
      <div className="rounded-2xl border border-black/8 bg-gradient-to-br from-gray-50 to-white overflow-hidden shadow-xl">
        {/* Top bar */}
        <div className="px-4 py-2.5 bg-white border-b border-black/8 flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-100">
              <span className="w-3 h-3 inline-flex text-orange-600"><IconBrain /></span>
              <span className="text-[10px] font-semibold text-orange-700">Memoria activa</span>
            </div>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">2 semanas después</span>
        </div>

        {/* Chat body */}
        <div className="p-5 space-y-3.5">
          {/* User question */}
          <div
            className={`flex justify-end terminal-line${inView ? " in-view" : ""}`}
            style={inView ? { animationDelay: "150ms" } : {}}
          >
            <div className="max-w-[78%] rounded-2xl rounded-tr-md bg-gray-900 text-white px-3.5 py-2 text-[12.5px] leading-snug shadow-sm">
              ¿Qué habíamos decidido para la base vectorial?
            </div>
          </div>

          {/* AI response with memory pills */}
          <div
            className={`flex items-start gap-2.5 terminal-line${inView ? " in-view" : ""}`}
            style={inView ? { animationDelay: "350ms" } : {}}
          >
            <div
              className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white ring-1 ring-white/40 flex-shrink-0"
              style={{ boxShadow: "0 4px 10px -2px rgba(249,115,22,0.45)" }}
            >
              <span className="w-3.5 h-3.5 inline-flex"><IconBrain /></span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="rounded-2xl rounded-tl-md bg-white border border-black/8 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-gray-800 shadow-sm">
                Elegiste{" "}
                <span className="inline-flex items-center gap-1 px-1.5 py-0 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-[11px]">
                  pgvector
                </span>{" "}
                sobre{" "}
                <span className="inline-flex items-center gap-1 px-1.5 py-0 rounded bg-gray-100 border border-gray-200 text-gray-500 line-through text-[11px]">
                  Pinecone
                </span>{" "}
                por costo, para tu{" "}
                <span className="inline-flex items-center gap-1 px-1.5 py-0 rounded bg-orange-50 border border-orange-200 text-orange-700 font-semibold text-[11px]">
                  cliente bancario
                </span>
                . Stack:{" "}
                <span className="inline-flex items-center gap-1 px-1.5 py-0 rounded bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-[11px]">
                  Supabase
                </span>
                .
              </div>
              {/* Source footer */}
              <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-500">
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-black/8">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-2.5 h-2.5 text-orange-600">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span className="font-mono">recordado hace 14 días</span>
                </div>
                <span className="text-gray-300">·</span>
                <span>4 hechos citados</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (id === "multi") {
    return (
      <div className="rounded-2xl border border-black/10 bg-gradient-to-br from-gray-50 to-white overflow-hidden shadow-xl">
        <div className="px-4 py-3 bg-white border-b border-black/8 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          </div>
          <div className="flex-1 h-7 rounded-lg bg-gray-100 border border-black/8 flex items-center px-3">
            <span className="text-[11px] text-gray-500">¿Cómo optimizo esta query de Postgres?</span>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-black/8 bg-white">
          {[
            { name: "GPT-5", dot: "bg-green-500", logo: <OpenAILogo />, text: "Agregá un índice compuesto en user_id, created_at y usá EXPLAIN ANALYZE para verificar." },
            { name: "Claude", dot: "bg-orange-400", logo: <AnthropicLogo />, text: "Con pgvector en Supabase, usá índices HNSW para búsquedas más eficientes." },
            { name: "Gemini", dot: "bg-blue-400 animate-pulse", logo: <GoogleLogo />, text: null },
          ].map((m) => (
            <div key={m.name} className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gray-100 border border-black/8 flex items-center justify-center">{m.logo}</div>
                <span className="text-[11px] font-bold text-gray-700">{m.name}</span>
                <div className={`ml-auto w-1.5 h-1.5 rounded-full ${m.dot}`} />
              </div>
              {m.text
                ? <p className="text-[11px] text-gray-500 leading-relaxed">{m.text}</p>
                : <div className="flex gap-1 mt-1">{[0, 150, 300].map((d) => <div key={d} className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div>
              }
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === "byok") {
    return (
      <div className="rounded-2xl border border-black/10 bg-gradient-to-br from-gray-50 to-white p-6 shadow-xl">
        <div className="space-y-3">
          {[
            { provider: "OpenAI", logo: <OpenAILogo />, status: "activa" },
            { provider: "Anthropic", logo: <AnthropicLogo />, status: "activa" },
            { provider: "Google", logo: <GoogleLogo />, status: "activa" },
          ].map((row, i) => (
            <div
              key={row.provider}
              className={`flex items-center gap-3 p-3.5 rounded-xl bg-white border border-black/8 shadow-sm terminal-line${inView ? " in-view" : ""}`}
              style={inView ? { animationDelay: `${150 + i * 100}ms` } : {}}
            >
              <div className="w-9 h-9 rounded-lg bg-gray-50 border border-black/8 flex items-center justify-center flex-shrink-0">{row.logo}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-900">{row.provider}</div>
                <div className="text-[11px] font-mono text-gray-400 tracking-wider truncate">sk-•••••••••••••••••••••••••••</div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 border border-green-100 flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] text-green-700 font-semibold">{row.status}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-violet-600 shrink-0">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="text-xs text-violet-700 font-semibold">AES-256 encriptado · Nunca salen del navegador sin cifrar</span>
        </div>
      </div>
    );
  }

  if (id === "projects") {
    return (
      <div className="rounded-2xl border border-black/10 bg-gradient-to-br from-gray-50 to-white p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4 px-2">
          <span className="eyebrow text-gray-500">Tus proyectos</span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold">3 activos</span>
        </div>
        <div className="space-y-1.5">
          {FOLDERS.map((item, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 py-2 px-2.5 rounded-lg text-xs terminal-line${inView ? " in-view" : ""} ${
                item.active
                  ? "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 font-semibold border border-emerald-200 shadow-sm"
                  : "text-gray-500 hover:bg-gray-100 border border-transparent"
              }`}
              style={{ paddingLeft: `${item.depth * 18 + 10}px`, ...(inView ? { animationDelay: `${150 + i * 70}ms` } : {}) }}
            >
              {item.isFolder
                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 shrink-0"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 shrink-0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              }
              <span className="truncate">{item.name}</span>
              {item.active && <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold shrink-0 shadow-sm">activo</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === "spend") {
    return (
      <div className="rounded-2xl border border-black/10 bg-gradient-to-br from-gray-50 to-white p-6 shadow-xl">
        <div className="flex items-end justify-between mb-5">
          <div>
            <span className="eyebrow text-gray-500">Gasto este mes</span>
            <div className="display text-4xl font-semibold text-gray-900 mt-1 leading-none">$4.80 <span className="text-base text-gray-400 font-normal">USD</span></div>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-semibold">↓ 12% vs mes pasado</span>
        </div>
        <div className="space-y-4">
          {DASH_BARS.map((m) => (
            <div key={m.name}>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-medium text-gray-700">{m.name}</span>
                <span className="text-xs font-bold text-gray-900">{m.amount}</span>
              </div>
              <div className="h-2 bg-gray-200/60 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: inView ? `${m.pct}%` : "0%",
                    background: m.color,
                    boxShadow: `0 0 10px ${m.color}66`,
                    transition: inView ? `width 0.9s cubic-bezier(0.22,1,0.36,1) ${m.delay}ms` : "none",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 pt-4 border-t border-black/8 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">Límite mensual configurado en <span className="font-bold text-gray-900">$20 USD</span></span>
          <button className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 transition-colors cursor-pointer">Editar →</button>
        </div>
      </div>
    );
  }

  return null;
}

function FeatureRow({ f, reversed }: { f: FeatureDef; reversed: boolean }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const bullets = FEATURE_BULLETS[f.id];

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.18 }
    );
    if (rowRef.current) obs.observe(rowRef.current);
    return () => obs.disconnect();
  }, []);

  const textOrder = reversed ? "md:order-1" : "md:order-2";
  const visualOrder = reversed ? "md:order-2" : "md:order-1";

  return (
    <div
      ref={rowRef}
      className={`grid md:grid-cols-2 gap-10 md:gap-16 items-center feature-card-hover card-item${inView ? " in-view" : ""}`}
    >
      {/* Text */}
      <div className={`${textOrder} max-w-xl`}>
        <div className="flex items-center gap-3 mb-5">
          <div
            className={`feature-icon w-12 h-12 rounded-2xl bg-gradient-to-br ${f.accent.from} ${f.accent.to} flex items-center justify-center text-white flex-shrink-0 ring-1 ring-white/40`}
            style={{ boxShadow: `0 10px 28px -6px ${f.accent.glow}, inset 0 1px 0 rgba(255,255,255,0.25)` }}
          >
            {f.icon}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-mono font-bold tracking-widest ${f.accent.text}`}>{f.n}</span>
            {f.badge && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
                {f.badge}
              </span>
            )}
          </div>
        </div>

        <h3 className="display text-3xl md:text-[2.25rem] font-semibold text-gray-900 tracking-tight leading-[1.1]">{f.name}</h3>
        <p className="mt-4 text-gray-500 text-[15px] leading-relaxed text-pretty">{f.long}</p>

        {/* Capabilities */}
        <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          {bullets.map((b) => (
            <div key={b.label} className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${f.accent.from} ${f.accent.to} flex items-center justify-center text-white flex-shrink-0 ring-1 ring-white/40`}
                style={{ boxShadow: `0 4px 12px -2px ${f.accent.glow}` }}
              >
                {b.icon}
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-gray-900 leading-snug">{b.label}</div>
                <div className="text-[12px] text-gray-500 leading-relaxed mt-0.5">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual */}
      <div className={`${visualOrder} relative w-full`}>
        {/* ambient accent glow */}
        <div
          className="pointer-events-none absolute -inset-6 rounded-[2.5rem] opacity-60"
          style={{ background: `radial-gradient(circle at ${reversed ? "70%" : "30%"} 38%, ${f.accent.glow}, transparent 64%)`, filter: "blur(38px)" }}
        />
        <div className="relative transition-transform duration-500 hover:-translate-y-1">
          <FeatureVisual id={f.id} inView={inView} />
        </div>
      </div>
    </div>
  );
}

function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="features" className="relative py-28 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className={`text-center mb-16 card-item${inView ? " in-view" : ""}`}>
          <span className="section-label">Funcionalidades</span>
          <h2 className="display mt-6 text-4xl md:text-[3.25rem] font-semibold text-gray-900 leading-[1.05] text-balance">
            Nunca más empezar de cero
          </h2>
          <p className="mt-5 text-gray-500 max-w-xl mx-auto text-lg leading-relaxed">
            Cada vez que cambiás de modelo, perdés contexto. OneChat lo recuerda todo, en todos los modelos, para siempre.
          </p>
        </div>

        {/* Alternating feature rows */}
        <div className="space-y-24 md:space-y-32">
          {FEATURES.map((f, i) => (
            <FeatureRow key={f.id} f={f} reversed={i % 2 === 1} />
          ))}
        </div>

      </div>
    </section>
  );
}

// â"€â"€â"€ How It Works â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const steps = [
  {
    n: "01",
    eyebrow: "Setup",
    title: "Conectá tus API keys",
    description: "Pegá tus keys de OpenAI, Anthropic o Google. Se encriptan con AES-256 y se guardan en tu cuenta. Configuración única, para siempre.",
    tags: ["OpenAI", "Anthropic", "Google", "AES-256"],
    gradient: "from-violet-500 to-purple-600",
    iconBg: "bg-gradient-to-br from-violet-500 to-purple-600",
    shadow: "rgba(139,92,246,0.4)",
    tone: "tone-violet",
    glow: "glow-violet",
    icon: <IconKey />,
  },
  {
    n: "02",
    eyebrow: "Chat",
    title: "Chateá con todos los modelos",
    description: "Escribí una vez, recibí respuestas de GPT, Claude y Gemini en tiempo real lado a lado. Comparalos y elegí el mejor.",
    tags: ["Streaming en tiempo real", "Vista comparativa", "Sin fricción"],
    gradient: "from-blue-500 to-cyan-500",
    iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
    shadow: "rgba(59,130,246,0.4)",
    tone: "tone-blue",
    glow: "glow-blue",
    icon: <IconMessages />,
  },
  {
    n: "03",
    eyebrow: "Memoria",
    title: "La memoria aprende con vos",
    description: "Después de cada chat, OneChat extrae lo relevante: proyectos, preferencias, decisiones. La próxima vez, todos los modelos ya te conocen.",
    tags: ["Captura automática", "Perfil editable", "Portable entre modelos"],
    gradient: "from-orange-500 to-amber-500",
    iconBg: "bg-gradient-to-br from-orange-500 to-amber-500",
    shadow: "rgba(249,115,22,0.4)",
    tone: "tone-orange",
    glow: "glow-orange",
    icon: <IconBrain />,
  },
];

function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="how-it-works" className="relative py-28 px-6 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-[0.04] rounded-full"
          style={{ background: "radial-gradient(ellipse, #6366f1, transparent 70%)" }} />
      </div>

      <div className="max-w-7xl mx-auto relative">
        <div className={`text-center mb-16 card-item${inView ? " in-view" : ""}`}>
          <span className="section-label">Cómo funciona</span>
          <h2 className="display mt-6 text-4xl md:text-[3.25rem] font-semibold text-gray-900 leading-[1.05] text-balance">
            Funcionando en{" "}
            <span className="gradient-text">60 segundos</span>
          </h2>
          <p className="mt-5 text-gray-500 max-w-lg mx-auto text-lg leading-relaxed">
            Sin setup complicado. Sin suscripciones que gestionar. Pegás tus keys y empezás.
          </p>
        </div>

        <div className="relative">
          {/* Horizontal connector line (desktop) */}
          <div className="hidden md:block absolute top-[3.75rem] left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-[2px]">
            <div className="w-full h-full bg-gradient-to-r from-violet-300/40 via-blue-300/40 to-orange-300/40 rounded-full" />
            <div className="absolute inset-0 bg-gradient-to-r from-violet-400/60 via-blue-400/60 to-orange-400/60 rounded-full blur-sm" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div
                key={step.n}
                className={`step-card-premium group rounded-2xl p-8 card-item${inView ? " in-view" : ""}`}
                style={{
                  ...(inView ? { animationDelay: `${i * 180}ms` } : {}),
                }}
              >
                {/* Giant numeral background flourish */}
                <div className="absolute top-4 right-5 pointer-events-none select-none">
                  <span className={`step-numeral ${step.tone} text-[5.5rem] opacity-[0.10] group-hover:opacity-[0.18] transition-opacity duration-700`}>
                    {step.n}
                  </span>
                </div>

                {/* Icon + eyebrow row */}
                <div className="flex items-center gap-4 mb-7">
                  <div
                    className={`step-number w-14 h-14 rounded-2xl ${step.iconBg} flex items-center justify-center text-white flex-shrink-0 ring-1 ring-white/40`}
                    style={{ boxShadow: `0 10px 28px -4px ${step.shadow}, inset 0 1px 0 rgba(255,255,255,0.25)` }}
                  >
                    {step.icon}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="eyebrow text-gray-400">Paso {step.n}</span>
                    <span className={`text-[11px] font-semibold ${step.tone === "tone-violet" ? "text-violet-600" : step.tone === "tone-blue" ? "text-blue-600" : "text-orange-600"}`}>{step.eyebrow}</span>
                  </div>
                </div>

                <h3 className="display text-xl font-semibold text-gray-900 tracking-tight mb-3 group-hover:text-gray-700 transition-colors">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed mb-6 text-[15px]">{step.description}</p>

                <div className="flex flex-wrap gap-2">
                  {step.tags.map((tag) => (
                    <span key={tag} className="text-xs px-3 py-1.5 rounded-lg bg-white text-gray-600 font-medium border border-black/8 shadow-sm group-hover:border-black/16 group-hover:-translate-y-0.5 transition-all">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Bottom gradient accent */}
                <div className={`mt-7 h-1 w-12 rounded-full bg-gradient-to-r ${step.gradient} opacity-50 group-hover:opacity-100 group-hover:w-24 transition-all duration-500`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// â"€â"€â"€ Models Section â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

type ModelCard = {
  name: string;
  provider: string;
  tag?: string;
  logo: React.ReactNode;
  accent: string;
};

const supportedModels: ModelCard[] = [
  { name: "GPT-5.5",           provider: "OpenAI",    tag: "Flagship",   logo: <OpenAILogo />,    accent: "#10b981" },
  { name: "GPT-5.4 mini",      provider: "OpenAI",    tag: "Rápido",     logo: <OpenAILogo />,    accent: "#10b981" },
  { name: "Claude Opus 4.8",   provider: "Anthropic", tag: "Profundo",   logo: <AnthropicLogo />, accent: "#f97316" },
  { name: "Claude Sonnet 4.6", provider: "Anthropic", tag: "Razonamiento", logo: <AnthropicLogo />, accent: "#f97316" },
  { name: "Claude Haiku 4.5",  provider: "Anthropic", tag: "Liviano",    logo: <AnthropicLogo />, accent: "#f97316" },
  { name: "Gemini 3 Pro",      provider: "Google",    tag: "Avanzado",   logo: <GoogleLogo />,    accent: "#3b82f6" },
  { name: "Gemini 2.5 Flash",  provider: "Google",    tag: "Multimodal", logo: <GoogleLogo />,    accent: "#3b82f6" },
  { name: "Grok 4.3",          provider: "xAI",       tag: "Realtime",   logo: <XAILogo />,       accent: "#111111" },
  { name: "Grok 4",            provider: "xAI",       tag: "Potente",    logo: <XAILogo />,       accent: "#111111" },
  { name: "Llama 3.3 70B",     provider: "Groq",      tag: "Ultra rápido", logo: <GroqLogo />,    accent: "#f55036" },
  { name: "Llama 3.1 8B",      provider: "Groq",      tag: "Instant",    logo: <GroqLogo />,      accent: "#f55036" },
  { name: "GPT-OSS 120B",      provider: "Groq",      tag: "Open",       logo: <GroqLogo />,      accent: "#f55036" },
  { name: "Mistral Large 3",   provider: "Mistral",   tag: "Top tier",   logo: <MistralLogo />,   accent: "#ff7000" },
  { name: "Mistral Medium 3.5", provider: "Mistral",  tag: "Equilibrado", logo: <MistralLogo />,  accent: "#ff7000" },
  { name: "Codestral",         provider: "Mistral",   tag: "Código",     logo: <MistralLogo />,   accent: "#ff7000" },
  { name: "DeepSeek V4",       provider: "DeepSeek",  tag: "Open",       logo: <DeepSeekLogo />,  accent: "#4462F5" },
  { name: "DeepSeek V4 Reasoner", provider: "DeepSeek", tag: "Reasoning", logo: <DeepSeekLogo />, accent: "#4462F5" },
  { name: "OpenRouter",        provider: "Gateway",   tag: "300+ modelos", logo: <PerplexityLogo />, accent: "#8b5cf6" },
];

function ModelCardItem({ m }: { m: ModelCard }) {
  return (
    <div
      className="group shrink-0 mx-2 w-[260px] rounded-2xl border border-black/8 bg-white px-4 py-3.5 flex items-center gap-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-black/16 hover:shadow-[0_12px_28px_-12px_rgba(0,0,0,0.18)]"
    >
      <div
        className="w-11 h-11 rounded-xl bg-gray-50 border border-black/8 flex items-center justify-center shrink-0 transition-all"
        style={{ boxShadow: `inset 0 0 0 1px ${m.accent}10` }}
      >
        {m.logo}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-semibold text-gray-900 truncate leading-tight">{m.name}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-gray-400 font-medium">{m.provider}</span>
          {m.tag && (
            <>
              <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: m.accent }}
              >
                {m.tag}
              </span>
            </>
          )}
        </div>
      </div>
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
    </div>
  );
}

function ModelsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const half = Math.ceil(supportedModels.length / 2);
  const rowA = supportedModels.slice(0, half);
  const rowB = supportedModels.slice(half);

  return (
    <section ref={sectionRef} id="models" className="relative py-28 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto relative">
        <div className={`text-center mb-16 card-item${inView ? " in-view" : ""}`}>
          <span className="section-label">Modelos soportados</span>
          <h2 className="display mt-6 text-4xl md:text-[3.25rem] font-semibold text-gray-900 leading-[1.05] text-balance">
            Todos los modelos que usás
          </h2>
          <p className="mt-5 text-gray-500 max-w-md mx-auto text-lg leading-relaxed">
            Conectá tu propia API key de cada proveedor y pagá directo a ellos.
          </p>
        </div>

        <div className={`space-y-6 card-item${inView ? " in-view" : ""}`}>
          <div className="marquee-wrap marquee-mask overflow-hidden">
            <div className="marquee-track py-1">
              {[...rowA, ...rowA].map((m, i) => <ModelCardItem key={`a-${i}`} m={m} />)}
            </div>
          </div>
          <div className="marquee-wrap marquee-mask overflow-hidden">
            <div className="marquee-track reverse slow py-1">
              {[...rowB, ...rowB].map((m, i) => <ModelCardItem key={`b-${i}`} m={m} />)}
            </div>
          </div>
        </div>

        <p className={`text-center text-gray-400 text-sm mt-10 card-item${inView ? " in-view" : ""}`}
          style={inView ? { animationDelay: "300ms" } : {}}>
          + Amazon Bedrock, Azure OpenAI, Replicate y cualquier endpoint compatible con OpenAI
        </p>

      </div>
    </section>
  );
}

// ━━━ Pricing ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type Plan = {
  name: string; tagline: string; price: string; period: string; description: string;
  features: string[]; cta: string; highlighted: boolean;
  gradient: string; accentBar: string; iconBg: string; icon: React.ReactNode;
  annual?: { price: string; period: string; note: string }; comingSoon?: boolean;
};

const plans: Plan[] = [
  {
    name: "Free",
    tagline: "Para arrancar",
    price: "$0",
    period: "para siempre",
    description: "Para empezar sin fricción. Sin tarjeta de crédito.",
    features: [
      "BYOK (tus propias API keys)",
      "Memoria: hasta 50 hechos recordados",
      "1 proyecto",
      "Historial de conversaciones",
      "Soporte por comunidad",
    ],
    cta: "Empezar gratis",
    highlighted: false,
    gradient: "from-gray-500 to-gray-600",
    accentBar: "from-gray-300 to-gray-400",
    iconBg: "bg-gradient-to-br from-gray-700 to-gray-900",
    icon: (
      // Single blob — el comienzo, una sola memoria
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M11 4Q5 5.5 5 11Q5.5 18 12 18Q19 17.5 19 11Q18.5 5 11 4Z" />
      </svg>
    ),
  },
  {
    name: "Pro",
    tagline: "Para profesionales",
    price: "$15",
    period: "/ mes",
    annual: { price: "$12", period: "/ mes", note: "facturado $144/año · 20% off" },
    description: "Para profesionales que viven en la IA todos los días.",
    features: [
      "API keys ilimitadas",
      "Memoria ilimitada",
      "Búsqueda semántica del historial",
      "Proyectos ilimitados",
      "Sync entre dispositivos",
      "Dashboard de gasto completo",
      "Soporte prioritario",
    ],
    cta: "Probar Pro",
    highlighted: true,
    gradient: "from-indigo-500 via-purple-500 to-violet-500",
    accentBar: "from-indigo-500 via-purple-500 to-violet-500",
    iconBg: "bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-500",
    icon: (
      // Logo OneChat literal - 3 blobs = el plan emblema
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M7.4 4Q3.6 5 3.6 8.6Q4.1 12.5 7.6 12.5Q11.1 12 10.7 8.4Q10.3 4.5 7.4 4Z" />
        <path d="M16.4 5Q13.4 5.5 13 8.6Q13.5 12.5 16.6 12.5Q20.4 12 20 8.4Q19.6 5.5 16.4 5Z" />
        <path d="M12 13.5Q8.4 14 8.4 17.5Q8.9 21 12.4 20.5Q15.9 20 15.5 16.5Q15 13.5 12 13.5Z" />
      </svg>
    ),
  },
  {
    name: "Team",
    tagline: "Para equipos",
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
    cta: "Próximamente",
    comingSoon: true,
    highlighted: false,
    gradient: "from-blue-500 to-cyan-500",
    accentBar: "from-blue-500 to-cyan-400",
    iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
    icon: (
      // 5 blobs conectados = equipo
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M6 4Q3 4.5 3 7.5Q3.3 11 6.3 10.8Q9.3 10.5 9 7.5Q8.7 4.5 6 4Z" />
        <path d="M17.7 4Q14.7 4.5 14.7 7.5Q15 11 18 10.8Q21 10.5 20.7 7.5Q20.4 4.5 17.7 4Z" />
        <path d="M12 12Q8.5 12.3 8.5 16Q8.7 20 12.3 19.7Q15.9 19.4 15.5 15.7Q15.1 12.3 12 12Z" />
      </svg>
    ),
  },
];

// ─── Testimonials ─────────────────────────────────────────────────────────

// Count-up number that animates once when scrolled into view.
function CountUp({
  value, decimals = 0, prefix = "", suffix = "", separator = "", durationMs = 1400, start,
}: {
  value: number; decimals?: number; prefix?: string; suffix?: string; separator?: string; durationMs?: number; start: boolean;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / durationMs, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setDisplay(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, value, durationMs]);

  let out = display.toFixed(decimals);
  if (separator) out = out.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return <>{prefix}{out}{suffix}</>;
}

type Stat = { value: number; decimals?: number; prefix?: string; suffix?: string; separator?: string; label: string; star?: boolean };

const STATS: Stat[] = [
  { value: 2400, suffix: "+", separator: ".", label: "Profesionales en LATAM" },
  { value: 18, label: "Modelos soportados" },
  { value: 4.9, decimals: 1, label: "Rating promedio", star: true },
  { value: 0, suffix: "%", label: "Comisión sobre tus keys" },
];

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  city: string;
  initials: string;
  gradient: string;
};

// NOTE: testimonios de ejemplo — reemplazá nombres/roles por reales cuando los tengas.
const TESTIMONIALS: Testimonial[] = [
  {
    quote: "Cambié de GPT a Claude a mitad de proyecto y no perdí nada de contexto. Es la primera vez que una herramienta de IA realmente me recuerda.",
    name: "Martina Rossi",
    role: "Desarrolladora full-stack · freelance",
    city: "Buenos Aires",
    initials: "MR",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    quote: "Pago mis propias API keys sin markup. Para una agencia chica como la nuestra, eso es la diferencia entre cerrar los números o no.",
    name: "Diego Herrera",
    role: "Founder · estudio de diseño",
    city: "Ciudad de México",
    initials: "DH",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    quote: "Tener GPT, Claude y Gemini lado a lado, y que se fusionen en una sola respuesta, me ahorra horas. Dejé de saltar entre pestañas.",
    name: "Camila Reyes",
    role: "Product Manager · fintech",
    city: "Bogotá",
    initials: "CR",
    gradient: "from-blue-500 to-cyan-500",
  },
];

function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="testimonials" className="relative py-28 px-6 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[760px] h-[420px] opacity-[0.04] rounded-full"
          style={{ background: "radial-gradient(ellipse, #6366f1, transparent 70%)" }} />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className={`text-center mb-16 card-item${inView ? " in-view" : ""}`}>
          <span className="section-label">Testimonios</span>
          <h2 className="display mt-6 text-4xl md:text-[3.25rem] font-semibold text-gray-900 leading-[1.05] text-balance">
            Quienes ya no{" "}
            <span className="gradient-text">empiezan de cero</span>
          </h2>
          <p className="mt-5 text-gray-500 max-w-xl mx-auto text-lg leading-relaxed">
            Profesionales y equipos de toda LATAM que dejaron de repetir su contexto en cada modelo.
          </p>
        </div>

        {/* Stats band */}
        <div
          className={`grid grid-cols-2 md:grid-cols-4 rounded-2xl overflow-hidden mb-14 surface-light card-item${inView ? " in-view" : ""}`}
          style={inView ? { animationDelay: "120ms" } : {}}
        >
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col items-center text-center px-5 py-7 ${i !== 0 ? "border-l border-black/8" : ""} ${i >= 2 ? "border-t md:border-t-0 border-black/8" : ""} ${i === 2 ? "border-l-0 md:border-l" : ""}`}
            >
              <div className="display text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-900 leading-none flex items-center gap-1.5 tabular-nums">
                <CountUp
                  value={s.value}
                  decimals={s.decimals}
                  prefix={s.prefix}
                  suffix={s.suffix}
                  separator={s.separator}
                  start={inView}
                />
                {s.star && (
                  <svg viewBox="0 0 24 24" fill="#FBBF24" className="w-5 h-5 md:w-6 md:h-6 mt-0.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                )}
              </div>
              <div className="mt-2 text-[12.5px] text-gray-500 font-medium leading-snug max-w-[140px]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonial cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <figure
              key={t.name}
              className={`premium-card rounded-2xl p-7 flex flex-col card-item${inView ? " in-view" : ""}`}
              style={inView ? { animationDelay: `${200 + i * 120}ms` } : {}}
            >
              {/* Quote mark */}
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-gray-200 mb-3">
                <path d="M7.17 6A5.17 5.17 0 0 0 2 11.17V18h6.83v-6.83H5.5A1.67 1.67 0 0 1 7.17 9.5zM18.5 6A5.17 5.17 0 0 0 13.33 11.17V18h6.84v-6.83h-3.34A1.67 1.67 0 0 1 18.5 9.5z" />
              </svg>

              {/* Stars */}
              <div className="flex gap-0.5 mb-3" role="img" aria-label="Calificación 5 de 5 estrellas">
                {[...Array(5)].map((_, s) => (
                  <svg key={s} viewBox="0 0 24 24" fill="#FBBF24" className="w-3.5 h-3.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>

              <blockquote className="text-[15px] text-gray-700 leading-relaxed flex-1">
                “{t.quote}”
              </blockquote>

              <figcaption className="mt-6 pt-5 border-t border-black/8 flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0 ring-1 ring-white/40`}
                  style={{ boxShadow: "0 6px 16px -4px rgba(14,15,18,0.25), inset 0 1px 0 rgba(255,255,255,0.25)" }}
                >
                  {t.initials}
                </div>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-semibold text-gray-900 leading-tight">{t.name}</div>
                  <div className="text-[11px] text-gray-500 leading-tight mt-0.5 truncate">{t.role}</div>
                  <div className="text-[11px] text-gray-400 leading-tight mt-0.5">{t.city}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="pricing" className="relative py-28 px-6 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] opacity-[0.03] rounded-full"
          style={{ background: "radial-gradient(ellipse, #8b5cf6, transparent 70%)" }} />
      </div>

      <div className="max-w-7xl mx-auto relative">
        <div className={`text-center mb-16 card-item${inView ? " in-view" : ""}`}>
          <span className="section-label">Precios</span>
          <h2 className="display mt-6 text-4xl md:text-[3.25rem] font-semibold text-gray-900 leading-[1.05] text-balance">
            Precios simples y{" "}
            <span className="gradient-text">transparentes</span>
          </h2>
          <p className="mt-5 text-gray-500 max-w-md mx-auto text-lg leading-relaxed">
            Ya pagás tus API keys. OneChat tiene que ser accesible también.
          </p>
        </div>

        {/* Billing toggle */}
        <div className={`flex justify-center mb-10 card-item${inView ? " in-view" : ""}`} style={inView ? { animationDelay: "60ms" } : {}}>
          <div className="inline-flex items-center p-1 rounded-full" style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)" }}>
            <button onClick={() => setBilling("monthly")}
              className="px-5 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer"
              style={billing === "monthly" ? { background: "white", color: "#111827", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" } : { color: "#6b7280" }}>
              Mensual
            </button>
            <button onClick={() => setBilling("annual")}
              className="px-5 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer inline-flex items-center gap-2"
              style={billing === "annual" ? { background: "white", color: "#111827", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" } : { color: "#6b7280" }}>
              Anual
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.14)", color: "#059669" }}>−20%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`plan-card relative rounded-2xl flex flex-col card-item${inView ? " in-view" : ""} ${
                plan.highlighted ? "pro-ring md:-mt-4 md:mb-4" : ""
              }`}
              style={{
                ...(inView ? { animationDelay: `${100 + i * 120}ms` } : {}),
              }}
            >
              {/* Badge for Pro — outside overflow-hidden */}
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30">
                  <span
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold text-white tracking-wide whitespace-nowrap"
                    style={{
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)",
                      boxShadow: "0 10px 24px -6px rgba(139,92,246,0.55), inset 0 1px 0 rgba(255,255,255,0.3)",
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6z" />
                    </svg>
                    Más popular
                  </span>
                </div>
              )}

              {/* Inner content wrapper */}
              <div className={`relative rounded-2xl p-7 flex flex-col gap-5 h-full overflow-hidden ${
                plan.highlighted ? "plan-card-pro" : "plan-card-light"
              }`}>

                {/* Top: icon + name + tagline */}
                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl ${plan.iconBg} flex items-center justify-center text-white flex-shrink-0 ring-1 ${plan.highlighted ? "ring-white/15" : "ring-white/40"}`}
                      style={{
                        boxShadow: plan.highlighted
                          ? "0 10px 24px -4px rgba(139,92,246,0.55), inset 0 1px 0 rgba(255,255,255,0.25)"
                          : "0 6px 18px -4px rgba(14,15,18,0.25), inset 0 1px 0 rgba(255,255,255,0.25)",
                      }}
                    >
                      {plan.icon}
                    </div>
                    <div>
                      <div className={`display text-lg font-semibold tracking-tight ${plan.highlighted ? "text-white" : "text-gray-900"}`}>{plan.name}</div>
                      <div className={`text-[11px] font-medium ${plan.highlighted ? "text-indigo-300/90" : "text-gray-400"}`}>{plan.tagline}</div>
                    </div>
                  </div>
                </div>

                {/* Price block */}
                {(() => {
                  const showAnnual = billing === "annual" && !!plan.annual && !plan.comingSoon;
                  const price = plan.comingSoon ? "Pronto" : showAnnual ? plan.annual!.price : plan.price;
                  const period = plan.comingSoon ? "" : showAnnual ? plan.annual!.period : plan.period;
                  const note = showAnnual ? plan.annual!.note : null;
                  return (
                    <div className="relative">
                      <div className="flex items-end gap-1.5">
                        <span className={`display ${plan.comingSoon ? "text-[2.5rem]" : "text-[3.5rem]"} font-semibold tracking-tight leading-none ${plan.highlighted ? "text-white" : "text-gray-900"}`}>{price}</span>
                        {period && <span className={`mb-2 text-sm ${plan.highlighted ? "text-white/50" : "text-gray-400"}`}>{period}</span>}
                      </div>
                      {note && <p className={`mt-1.5 text-xs font-semibold ${plan.highlighted ? "text-indigo-300" : "text-emerald-600"}`}>{note}</p>}
                      <p className={`mt-3 text-sm leading-relaxed ${plan.highlighted ? "text-white/65" : "text-gray-500"}`}>{plan.description}</p>
                    </div>
                  );
                })()}

                {/* Divider */}
                <div className={`h-px ${plan.highlighted ? "bg-gradient-to-r from-transparent via-white/15 to-transparent" : "bg-gradient-to-r from-transparent via-black/10 to-transparent"}`} />

                <ul className="space-y-3 flex-1 relative">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-start gap-3 text-sm ${plan.highlighted ? "text-white/85" : "text-gray-600"}`}>
                      <span
                        className={`w-5 h-5 mt-0.5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          plan.highlighted
                            ? "bg-gradient-to-br from-indigo-400 to-purple-500 text-white"
                            : "bg-gradient-to-br from-gray-900 to-gray-700 text-white"
                        }`}
                        style={{
                          boxShadow: plan.highlighted
                            ? "0 4px 10px -2px rgba(139,92,246,0.55), inset 0 1px 0 rgba(255,255,255,0.25)"
                            : "0 3px 8px -2px rgba(14,15,18,0.3), inset 0 1px 0 rgba(255,255,255,0.18)",
                        }}
                      >
                        <IconCheck />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  disabled={plan.comingSoon}
                  className={`relative w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                    plan.comingSoon
                      ? "cursor-not-allowed text-gray-400"
                      : plan.highlighted
                        ? "cursor-pointer text-gray-900 hover:-translate-y-0.5"
                        : "cursor-pointer btn-primary"
                  }`}
                  style={
                    plan.comingSoon
                      ? { background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }
                      : plan.highlighted
                        ? {
                            background: "linear-gradient(180deg, #FFFFFF 0%, #F3F4F6 100%)",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,1), 0 1px 2px rgba(0,0,0,0.08), 0 10px 28px -8px rgba(255,255,255,0.4)",
                          }
                        : undefined
                  }
                >
                  {plan.cta}
                  {!plan.comingSoon && <IconArrowRight />}
                </button>

                {/* Bottom accent bar */}
                {!plan.highlighted && (
                  <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${plan.accentBar} opacity-50`} />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className={`mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 card-item${inView ? " in-view" : ""}`}
          style={inView ? { animationDelay: "600ms" } : {}}>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-green-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Pago seguro con encriptación</span>
          </div>
          <span className="hidden sm:block text-gray-300">·</span>
          <span className="text-sm text-gray-400">ARS · MXN · PEN · BRL · Mercado Pago · Tarjeta local · Stripe</span>
        </div>
      </div>
    </section>
  );
}

// â"€â"€â"€ CTA Section â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-28 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <div
          className={`relative rounded-[28px] p-12 md:p-20 overflow-hidden card-item${inView ? " in-view" : ""}`}
          style={{
            background:
              "radial-gradient(1000px 500px at 20% -10%, rgba(99,102,241,0.16), transparent 60%)," +
              "radial-gradient(800px 500px at 100% 110%, rgba(139,92,246,0.14), transparent 60%)," +
              "linear-gradient(180deg, #14161B 0%, #0E0F12 60%, #0A0B0E 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), 0 30px 80px -30px rgba(99,102,241,0.30), 0 12px 40px -12px rgba(0,0,0,0.5)",
          }}
        >
          {/* Top highlight line */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          {/* Dot grid overlay */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

          <div className="relative z-10">
            <div className="flex justify-center gap-1 mb-6" role="img" aria-label="Calificación 5 de 5 estrellas">
              {[...Array(5)].map((_, i) => (
                <svg key={i} viewBox="0 0 24 24" fill="#FBBF24" className="w-4 h-4">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <h2 className="display text-4xl md:text-[3.25rem] font-semibold text-white leading-[1.05] tracking-tight text-balance">
              ¿Listo para unificar tu
              <br className="hidden sm:block" />
              <span
                style={{
                  background: "linear-gradient(120deg, #fff 0%, #C7D2FE 35%, #DDD6FE 60%, #fff 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                flujo de trabajo con IA?
              </span>
            </h2>
            <p className="mt-5 text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
              Únete a miles de profesionales y freelancers en LATAM que usan OneChat para aprovechar al máximo cada modelo de IA, con una memoria que los conecta a todos.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/chat" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-[15px] text-gray-900 transition-all cursor-pointer hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(180deg, #FFFFFF 0%, #F3F4F6 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,1), 0 1px 2px rgba(0,0,0,0.08), 0 10px 30px -10px rgba(255,255,255,0.4)",
                }}
              >
                Empezar gratis <IconArrowRight />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-[15px] text-white/85 transition-all cursor-pointer hover:bg-white/[0.08] hover:text-white"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <IconGithub /> Ver en GitHub
              </a>
            </div>
            <p className="mt-6 text-sm text-white/45">
              Sin tarjeta de crédito · Código abierto · Self-hosteable
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// â"€â"€â"€ Footer â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function Footer() {
  const links = {
    Producto:     ["Funcionalidades", "Cómo funciona", "Precios", "Novedades"],
    Developers:   ["Documentación", "Referencia API", "Self-hosting", "GitHub"],
    Empresa:      ["Acerca de", "Blog", "Política de privacidad", "Términos de uso"],
    Comunidad:    ["Discord", "Twitter / X", "Reddit", "Newsletter"],
  };

  return (
    <footer className="border-t border-black/8 py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <OneChatLogoFull className="h-7 w-auto" />
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              Una memoria. Todas las IAs. Traé tus keys, controlá tus datos.
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
              <h4 className="eyebrow text-gray-500 mb-4">{section}</h4>
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
            © {new Date().getFullYear()} OneChat. Código abierto bajo licencia MIT.
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Todos los sistemas operativos
            </span>
            <span className="text-gray-300">·</span>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">Privacidad</a>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">Términos</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// â"€â"€â"€ Hero Section â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-20 overflow-hidden">
      {/* Subtle dot grid */}
      <div className="absolute inset-0 animate-fade-in opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(14,15,18,0.07) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, #000 40%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, #000 40%, transparent 80%)",
        }} />

      {/* Floating gradient orbs */}
      <div className="hero-orb-1 absolute top-20 -left-32 w-[560px] h-[560px] rounded-full opacity-[0.10] pointer-events-none"
        style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }} />
      <div className="hero-orb-2 absolute top-40 -right-24 w-[460px] h-[460px] rounded-full opacity-[0.08] pointer-events-none"
        style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)" }} />

      <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col items-center">
        {/* Eyebrow badge */}
        <div className="animate-fade-up delay-100 mb-7">
          <a href="#features" className="group inline-flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full text-xs font-medium text-gray-700 transition-all cursor-pointer"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(247,247,245,0.85))",
              border: "1px solid rgba(14,15,18,0.10)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset, 0 1px 2px rgba(14,15,18,0.04), 0 8px 24px -10px rgba(99,102,241,0.20)",
            }}
          >
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-widest uppercase text-white"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              Nuevo
            </span>
            <span className="text-gray-700">Memoria persistente entre modelos</span>
            <span className="transition-transform group-hover:translate-x-0.5 text-gray-500">
              <IconArrowRight />
            </span>
          </a>
        </div>

        {/* SEO H1 — hidden visually, indexed by search engines */}
        <h1 className="sr-only">Chat con IA: GPT, Claude y Gemini en un solo lugar con memoria persistente</h1>

        {/* Visual headline — decorative, aria-hidden */}
        <div aria-hidden="true" className="animate-fade-up delay-200 relative display display-tight text-center text-[clamp(2.75rem,9vw,5.75rem)] leading-[1.02] max-w-5xl">
          {/* soft glow behind headline for depth */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[115%] h-[170%]"
            style={{ background: "radial-gradient(58% 48% at 50% 50%, rgba(99,102,241,0.12), rgba(139,92,246,0.06) 45%, transparent 72%)", filter: "blur(22px)" }} />
          <span className="relative block font-light text-gray-800">
            Una memoria.
          </span>
          <span className="relative block font-semibold mt-1 sm:mt-2 gradient-text-premium">
            Todas las IAs.
          </span>
        </div>

        {/* Subtext */}
        <p className="animate-fade-up delay-300 mt-7 text-center text-lg md:text-xl text-gray-500 max-w-2xl leading-relaxed">
          La única app de chat con IA que no te olvida cuando cambiás de modelo.
          <span className="text-gray-700 font-medium"> GPT, Claude y Gemini</span> en un solo lugar, con una memoria que viaja con vos.
        </p>

        {/* CTAs */}
        <div className="animate-fade-up delay-400 mt-10 flex flex-col sm:flex-row gap-3">
          <a href="/chat" className="btn-primary text-[15px] px-8 py-3.5">
            Empezar gratis <IconArrowRight />
          </a>
          <button className="btn-ghost text-[15px] px-7 py-3.5">
            <span className="w-5 h-5 rounded-full bg-gray-100 border border-black/10 flex items-center justify-center text-gray-700">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 ml-0.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </span>
            Ver demo
          </button>
        </div>

        {/* Social proof + Stats */}
        <div className="animate-fade-up delay-500 mt-10 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2.5">
              {["#4F46E5", "#7C3AED", "#2563EB", "#0891B2", "#059669"].map(
                (c, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-[2.5px] border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                    style={{ background: c }}
                  >
                    {["F", "M", "J", "A", "L"][i]}
                  </div>
                )
              )}
            </div>
            <span className="text-sm text-gray-500">
              <span className="text-gray-900 font-semibold">2.400+</span>{" "}
              profesionales en LATAM
            </span>
          </div>

          <div className="hidden sm:block w-px h-6 bg-gray-200" />

          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} viewBox="0 0 24 24" fill="#FBBF24" className="w-3.5 h-3.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <span className="text-gray-900 font-semibold">4.9</span>
            </span>
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-green-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Open source
            </span>
          </div>
        </div>

        {/* Trust bar — providers */}
        <div className="animate-fade-up delay-600 mt-12 w-full max-w-4xl">
          <div className="flex items-center gap-3 mb-5 justify-center">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-gray-300" />
            <span className="eyebrow text-gray-400">Compatible con</span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-gray-300" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5 opacity-70 grayscale">
            <div className="flex items-center gap-2 text-gray-600"><OpenAILogo /><span className="text-sm font-semibold">OpenAI</span></div>
            <div className="flex items-center gap-2 text-gray-600"><AnthropicLogo /><span className="text-sm font-semibold">Anthropic</span></div>
            <div className="flex items-center gap-2 text-gray-600"><GoogleLogo /><span className="text-sm font-semibold">Google</span></div>
            <div className="flex items-center gap-2 text-gray-600"><MistralLogo /><span className="text-sm font-semibold">Mistral</span></div>
            <div className="flex items-center gap-2 text-gray-600"><MetaLogo /><span className="text-sm font-semibold">Meta</span></div>
            <div className="flex items-center gap-2 text-gray-600"><XAILogo /><span className="text-sm font-semibold">xAI</span></div>
          </div>
        </div>

        {/* Video */}
        <div className="animate-fade-up delay-600 w-full mt-16 flex justify-center px-4">
          <div className="relative flex justify-center" style={{ maxWidth: "980px", width: "100%" }}>
            {/* Glow behind video */}
            <div
              className="hero-orb-1"
              style={{
                position: "absolute",
                inset: "-120px",
                background: "radial-gradient(ellipse at center, rgba(99,102,241,0.25) 0%, rgba(139,92,246,0.15) 30%, rgba(168,85,247,0.08) 55%, transparent 75%)",
                filter: "blur(80px)",
                borderRadius: "50%",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />
            {/* Outer ring */}
            <div
              className="relative w-full rounded-[20px] p-1.5"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(247,247,245,0.7))",
                border: "1px solid rgba(14,15,18,0.08)",
                boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset, 0 30px 80px -20px rgba(14,15,18,0.20), 0 12px 32px -8px rgba(99,102,241,0.08)",
                zIndex: 1,
              }}
            >
              {/* Window chrome */}
              <div
                className="relative w-full rounded-[14px] overflow-hidden"
                style={{
                  background: "#0E0F12",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
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
        </div>
      </div>
    </section>
  );
}

// â"€â"€â"€ Page â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

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
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  );
}