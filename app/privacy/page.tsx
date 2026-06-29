import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-xl font-bold text-white block mb-10">
          Try<span className="text-blue-500">Adunda</span>
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3">Privacy Policy</h1>
          <p className="text-gray-500 text-sm">Last updated: June 3, 2025</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          {[
            {
              title: "1. Information We Collect",
              body: `We collect information you provide directly to us when you create an account, upload sales data, or contact us for support.

Account information: name, email address, and password when you register.

Sales data: CSV files and CRM data you upload or sync to generate insights. This data is used solely to generate AI-powered insights for your account.

Usage data: how you interact with our product, including pages visited, features used, and actions taken.

Payment information: processed securely by Stripe. We never store your full card details.`,
            },
            {
              title: "2. How We Use Your Information",
              body: `We use the information we collect to:

- Provide, operate, and improve Adunda
- Generate AI-powered sales insights from your uploaded data
- Process payments and manage subscriptions
- Send product updates and support communications
- Respond to your comments and questions

We do not sell your personal information or sales data to third parties. Ever.`,
            },
            {
              title: "3. Data Security",
              body: `We take security seriously. All data is encrypted in transit using TLS and at rest using AES-256 encryption. We use Supabase for database infrastructure, which provides enterprise-grade security including row-level security policies that ensure your data is only accessible to you and team members you explicitly authorize.

We regularly review our security practices and update them as needed.`,
            },
            {
              title: "4. Data Sharing",
              body: `We share your information only in the following limited circumstances:

Service providers: We use third-party services including Anthropic (AI analysis), Supabase (database), Stripe (payments), Vercel (hosting), and Resend (email). These providers only have access to data necessary to perform their functions.

Legal requirements: We may disclose information if required by law or in response to valid legal process.

Business transfers: If Adunda is acquired or merged, your information may be transferred as part of that transaction.

We never share your sales data with advertisers or data brokers.`,
            },
            {
              title: "5. Data Retention",
              body: `We retain your account data for as long as your account is active. If you delete your account, we will permanently delete your data within 48 hours, except where we are required by law to retain it.

You can request deletion of your account and all associated data at any time by emailing support@tryrepwise.com.`,
            },
            {
              title: "6. Cookies",
              body: `We use essential cookies to keep you logged in and maintain your session. We do not use third-party advertising cookies or tracking pixels. We use Vercel Analytics for anonymous usage statistics that do not identify individual users.`,
            },
            {
              title: "7. Your Rights",
              body: `You have the right to:

- Access the personal data we hold about you
- Correct inaccurate data
- Request deletion of your data
- Export your data in a portable format
- Opt out of non-essential communications

To exercise any of these rights, contact us at support@tryrepwise.com.`,
            },
            {
              title: "8. Children's Privacy",
              body: `Adunda is not intended for use by anyone under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.`,
            },
            {
              title: "9. Changes to This Policy",
              body: `We may update this privacy policy from time to time. We will notify you of significant changes by email or through the product. Your continued use of Adunda after changes take effect constitutes your acceptance of the updated policy.`,
            },
            {
              title: "10. Contact Us",
              body: `If you have questions about this privacy policy or our privacy practices, contact us at:

Email: support@tryrepwise.com
Website: tryrepwise.com/contact`,
            },
          ].map(section => (
            <div key={section.title}>
              <h2 className="text-white font-bold text-lg mb-3">{section.title}</h2>
              <div className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{section.body}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex items-center justify-between">
          <Link href="/" className="text-gray-600 text-sm hover:text-gray-400 transition">← Back to home</Link>
          <Link href="/terms" className="text-gray-600 text-sm hover:text-gray-400 transition">Terms of Service →</Link>
        </div>
      </div>
    </div>
  );
}
