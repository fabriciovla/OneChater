import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How OneChater collects, uses and protects your information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary, #fafaf9)" }}>
      {/* Nav */}
      <header className="border-b border-black/6 px-5 md:px-10 h-14 flex items-center justify-between">
        <Link href="/" className="text-[15px] font-semibold text-gray-900 hover:opacity-70 transition-opacity">
          ← OneChater
        </Link>
        <span className="text-xs text-gray-400">Updated: June 2026</span>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-14">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy policy</h1>
        <p className="text-gray-500 mb-10">Your privacy matters. Here&apos;s what data we collect and how we use it.</p>

        <Section title="1. What data we collect">
          <p><strong>Account data:</strong> name, email address and profile picture (when you sign in with Google, GitHub, or Apple). We also store the authentication sessions needed to keep you signed in.</p>
          <p><strong>Conversations:</strong> your chat history is saved in our database so you can access it from any device.</p>
          <p><strong>Persistent memory:</strong> the memory profile the system builds from your conversations is stored, tied to your account, to personalize future answers.</p>
          <p><strong>API keys:</strong> your third-party API keys (OpenAI, Anthropic, Google, etc.) are stored <em>only in your browser</em> (localStorage). We never send or store them on our servers.</p>
        </Section>

        <Section title="2. How we use your data">
          <ul>
            <li>Provide and improve the Service.</li>
            <li>Keep your conversation history and memory in sync across devices.</li>
            <li>Send you transactional emails (login OTP, important notifications). We use <strong>Resend</strong> to deliver email.</li>
            <li>Detect and prevent abuse.</li>
          </ul>
          <p>We don&apos;t sell your data. We don&apos;t use it for advertising.</p>
        </Section>

        <Section title="3. Third parties with access to your data">
          <ul>
            <li><strong>Neon</strong> (Postgres database) — stores your conversations and account data.</li>
            <li><strong>Vercel</strong> — application hosting and infrastructure.</li>
            <li><strong>Resend</strong> — transactional email delivery.</li>
            <li><strong>NextAuth / Auth.js</strong> — session and OAuth management.</li>
            <li><strong>AI providers</strong> (OpenAI, Anthropic, Google, etc.) — your messages are sent directly to these services using your own API key. They are subject to their own privacy policies.</li>
          </ul>
        </Section>

        <Section title="4. Cookies and local storage">
          <p>We use session cookies required for authentication (HttpOnly, Secure). We don&apos;t use tracking or advertising cookies.</p>
          <p>We use <code>localStorage</code> to save your API keys and app preferences (theme, selected models). This data never leaves your device.</p>
        </Section>

        <Section title="5. Data retention">
          <p>We keep your data while your account is active. You can request deletion of your account and all associated data by writing to our contact email.</p>
        </Section>

        <Section title="6. Your rights">
          <p>You have the right to access, correct, export or delete your personal data. To exercise these rights, write to <a href="mailto:fabriciouala1@gmail.com" className="underline text-gray-700 hover:text-gray-900">fabriciouala1@gmail.com</a>.</p>
        </Section>

        <Section title="7. Security">
          <p>We use HTTPS on all communications, session tokens with rotation, and role-restricted database access. No system is 100% secure; in the event of a security incident, we will inform the affected users.</p>
        </Section>

        <Section title="8. Changes to this policy">
          <p>We may update this policy. If the changes are significant, we&apos;ll notify you by email or via a notice within the Service.</p>
        </Section>

        <Section title="9. Contact">
          <p>For privacy questions: <a href="mailto:fabriciouala1@gmail.com" className="underline text-gray-700 hover:text-gray-900">fabriciouala1@gmail.com</a>.</p>
        </Section>
      </main>

      <footer className="border-t border-black/6 px-5 py-8 text-center text-xs text-gray-400">
        <div className="flex justify-center gap-6">
          <Link href="/privacy" className="hover:text-gray-700 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-gray-700 transition-colors">Terms</Link>
          <Link href="/refunds" className="hover:text-gray-700 transition-colors">Refunds</Link>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-9">
      <h2 className="text-[17px] font-semibold text-gray-800 mb-3">{title}</h2>
      <div className="text-[15px] text-gray-600 leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px]">
        {children}
      </div>
    </section>
  );
}
