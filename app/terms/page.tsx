import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions governing your use of SupportCraft AI.",
};

const LAST_UPDATED = "27 June 2026";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/app_icon.png" alt="SupportCraft AI" width={32} height={32} className="rounded-lg" />
            <span className="font-semibold text-base">SupportCraft AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login"    className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors sm:block">Sign in</Link>
            <Link href="/register" className="sc-btn-primary rounded-lg px-4 py-2 text-sm font-semibold">Start free trial</Link>
          </div>
        </nav>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none space-y-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-8 [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_ul]:space-y-1.5 [&_ul]:text-muted-foreground [&_li]:leading-relaxed">

          <p>
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of SupportCraft AI,
            operated by Aakasa Digital (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). By creating an account
            or using the Service you agree to be bound by these Terms. If you do not agree, do not use the Service.
          </p>

          <section>
            <h2>1. Description of Service</h2>
            <p>
              SupportCraft AI is a cloud-based customer support platform that provides ticket management,
              AI-assisted reply drafting, a knowledge base, a customer-facing portal, team collaboration tools,
              and analytics. We reserve the right to modify, suspend, or discontinue any feature of the Service
              with reasonable notice.
            </p>
          </section>

          <section>
            <h2>2. Account Registration</h2>
            <p>
              To use the Service you must register for an account and provide accurate, complete information.
              You are responsible for maintaining the confidentiality of your credentials and for all activity
              that occurs under your account. You must notify us immediately at{" "}
              <a href="mailto:support@aakasadigital.com" className="text-primary hover:underline">
                support@aakasadigital.com
              </a>{" "}
              if you suspect unauthorised use.
            </p>
            <p className="mt-3">
              You must be at least 16 years old to create an account. By registering you represent
              that you meet this requirement.
            </p>
          </section>

          <section>
            <h2>3. Subscriptions and Billing</h2>
            <p>
              SupportCraft AI is offered on a subscription basis with plans as described on our pricing page.
              By subscribing you authorise us (via PayPal) to charge the applicable fees on a recurring basis
              until you cancel.
            </p>
            <ul className="list-disc pl-5 mt-2">
              <li><strong className="text-foreground">Free plan</strong> — available at no charge with the limitations stated on the pricing page.</li>
              <li><strong className="text-foreground">Paid plans</strong> — billed monthly or annually in advance. No refunds are issued for partial billing periods.</li>
              <li><strong className="text-foreground">Price changes</strong> — we will notify you at least 30 days before any price increase takes effect. Continued use constitutes acceptance.</li>
              <li><strong className="text-foreground">Cancellation</strong> — you may cancel at any time. Access continues until the end of the current billing period.</li>
            </ul>
          </section>

          <section>
            <h2>4. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-5 mt-2">
              <li>Violate any applicable law or regulation.</li>
              <li>Transmit spam, unsolicited messages, or deceptive content.</li>
              <li>Upload or distribute malware, viruses, or malicious code.</li>
              <li>Attempt to gain unauthorised access to any part of the Service or its infrastructure.</li>
              <li>Scrape, crawl, or extract data from the Service in bulk without prior written consent.</li>
              <li>Use the AI features to generate content that is illegal, harmful, or violates third-party rights.</li>
              <li>Resell or sublicense the Service without a written reseller agreement.</li>
            </ul>
            <p className="mt-3">
              We may suspend or terminate accounts that violate these rules without prior notice.
            </p>
          </section>

          <section>
            <h2>5. Your Content</h2>
            <p>
              You retain ownership of all data, content, and intellectual property you upload or create
              through the Service (&quot;Your Content&quot;). By using the Service you grant us a limited,
              non-exclusive licence to host, store, and process Your Content solely to provide the Service.
            </p>
            <p className="mt-3">
              You represent that You have all rights necessary to grant this licence and that Your Content
              does not infringe the rights of any third party.
            </p>
          </section>

          <section>
            <h2>6. Intellectual Property</h2>
            <p>
              The Service, including its software, design, trademarks, and documentation, is owned by
              Aakasa Digital and protected by copyright, trademark, and other intellectual property laws.
              These Terms do not grant you any right, title, or interest in the Service beyond the limited
              licence to use it as described herein.
            </p>
          </section>

          <section>
            <h2>7. Privacy</h2>
            <p>
              Your use of the Service is also governed by our{" "}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>,
              which is incorporated into these Terms by reference.
            </p>
          </section>

          <section>
            <h2>8. Confidentiality</h2>
            <p>
              Each party may have access to confidential information of the other party. Both parties agree
              to keep such information confidential and not to disclose it to third parties except as required
              by law or with the disclosing party&apos;s written consent.
            </p>
          </section>

          <section>
            <h2>9. Service Availability</h2>
            <p>
              We aim to maintain high availability but do not guarantee uninterrupted access to the Service.
              We will use commercially reasonable efforts to provide at least 99.5% monthly uptime for paid plans,
              excluding scheduled maintenance windows announced at least 24 hours in advance.
            </p>
          </section>

          <section>
            <h2>10. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
              EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
              PARTICULAR PURPOSE, AND NON-INFRINGEMENT. AI-generated content is provided as a draft aid only
              — you are solely responsible for reviewing and approving any AI output before sending it to customers.
            </p>
          </section>

          <section>
            <h2>11. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, AAKASA DIGITAL SHALL NOT BE LIABLE FOR
              ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS,
              REVENUE, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH THESE TERMS OR THE SERVICE.
            </p>
            <p className="mt-3">
              OUR TOTAL CUMULATIVE LIABILITY TO YOU FOR ANY CLAIMS ARISING UNDER THESE TERMS SHALL NOT
              EXCEED THE GREATER OF (A) THE FEES PAID BY YOU IN THE 12 MONTHS PRECEDING THE CLAIM, OR
              (B) USD 100.
            </p>
          </section>

          <section>
            <h2>12. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Aakasa Digital and its officers, directors, employees,
              and agents from any claims, damages, or expenses (including reasonable legal fees) arising from
              your use of the Service, Your Content, or your breach of these Terms.
            </p>
          </section>

          <section>
            <h2>13. Termination</h2>
            <p>
              Either party may terminate these Terms at any time. We may suspend or terminate your access
              immediately if you breach these Terms or if we are required to do so by law. Upon termination,
              your right to access the Service ceases immediately. You may export your data for 30 days
              following termination, after which we will delete it in accordance with our Privacy Policy.
            </p>
          </section>

          <section>
            <h2>14. Governing Law and Disputes</h2>
            <p>
              These Terms are governed by the laws of Sri Lanka. Any disputes shall first be attempted to
              be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be
              submitted to binding arbitration in Colombo, Sri Lanka, conducted in English.
            </p>
          </section>

          <section>
            <h2>15. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of material changes via email
              or a prominent notice in the Service at least 14 days before they take effect. Continued use
              of the Service after the effective date constitutes acceptance.
            </p>
          </section>

          <section>
            <h2>16. Contact Us</h2>
            <p>
              Questions about these Terms should be directed to:
            </p>
            <ul className="list-none pl-0 mt-2 not-prose space-y-1 text-sm text-muted-foreground">
              <li>Email: <a href="mailto:legal@aakasadigital.com" className="text-primary hover:underline">legal@aakasadigital.com</a></li>
              <li>Product: SupportCraft AI by Aakasa Digital</li>
            </ul>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/app_icon.png" alt="SupportCraft AI" width={28} height={28} className="rounded-md" />
            <span className="text-sm font-semibold">SupportCraft AI</span>
            <span className="text-xs text-muted-foreground">by Aakasa Digital</span>
          </Link>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} SupportCraft AI. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <Link href="/portal/login" className="hover:text-foreground transition-colors">Customer portal</Link>
            <Link href="/privacy"      className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms"        className="hover:text-foreground transition-colors font-medium text-foreground">Terms</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
