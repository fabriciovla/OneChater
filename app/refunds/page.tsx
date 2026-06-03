import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund policy",
  description: "OneChater's refund policy.",
};

export default function RefundsPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Refund policy</h1>
        <p className="text-gray-500 mb-10">Full transparency on how we handle payments and refunds.</p>

        <Section title="1. Free plan">
          <p>OneChater currently offers a free plan at no cost. No credit card is required to sign up or to use the Service&apos;s basic features.</p>
        </Section>

        <Section title="2. BYOK model (Bring Your Own Key)">
          <p>OneChater runs on the BYOK model: you provide your own API keys from the AI providers (OpenAI, Anthropic, Google, etc.). <strong>OneChater does not charge for access to the AI models.</strong> API usage costs are billed directly to you by each provider, according to their own terms and pricing.</p>
          <p>For questions about charges from the AI providers, you must contact each provider directly.</p>
        </Section>

        <Section title="3. Paid plans (coming soon)">
          <p>In the future, OneChater may offer paid subscription plans with additional features. When that happens, this policy will be updated with the relevant details.</p>
          <p>For any future paid plan, the refund policy will be:</p>
          <ul>
            <li><strong>Trial period:</strong> full refund within the first 7 days, no questions asked.</li>
            <li><strong>Cancellation:</strong> you can cancel at any time. Access continues until the end of the billed period. We don&apos;t offer prorated refunds for partial periods, except where required by applicable law.</li>
            <li><strong>Service failure:</strong> if OneChater suffers a significant outage (more than 24 hours), we may offer a credit or a prorated refund at the team&apos;s discretion.</li>
          </ul>
        </Section>

        <Section title="4. How to request a refund">
          <p>To request a refund (where applicable), write to <a href="mailto:fabriciouala1@gmail.com" className="underline text-gray-700 hover:text-gray-900">fabriciouala1@gmail.com</a> with the subject <strong>&quot;Refund request&quot;</strong> and include:</p>
          <ul>
            <li>The account email registered with OneChater.</li>
            <li>The reason for the request.</li>
            <li>The date and amount of the charge (if applicable).</li>
          </ul>
          <p>We&apos;ll respond within 5 business days.</p>
        </Section>

        <Section title="5. Exceptions">
          <p>Refunds will not be processed in cases of:</p>
          <ul>
            <li>Violation of the Terms of use that resulted in account suspension.</li>
            <li>Fraudulent use or abuse of the Service.</li>
            <li>Charges from third-party AI providers (those are handled by each provider).</li>
          </ul>
        </Section>

        <Section title="6. Contact">
          <p>Have a question? Write to <a href="mailto:fabriciouala1@gmail.com" className="underline text-gray-700 hover:text-gray-900">fabriciouala1@gmail.com</a>.</p>
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
      <div className="text-[15px] text-gray-600 leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}
