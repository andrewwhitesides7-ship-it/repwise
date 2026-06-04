import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-xl font-bold text-white block mb-10">
          Try<span className="text-blue-500">RepWise</span>
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3">Terms of Service</h1>
          <p className="text-gray-500 text-sm">Last updated: June 3, 2025</p>
        </div>

        <div className="space-y-8">
          {[
            {
              title: "1. Acceptance of Terms",
              body: `By accessing or using RepWise at tryrepwise.com, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use our service.

These terms apply to all users of RepWise including individual sales reps, managers, and team members.`,
            },
            {
              title: "2. Description of Service",
              body: `RepWise is an AI-powered sales intelligence platform that analyzes sales activity data to generate insights for field sales teams. Features include CSV upload and analysis, CRM integration, AI-generated insights, goal tracking, and team management.

We reserve the right to modify, suspend, or discontinue any part of the service at any time with reasonable notice.`,
            },
            {
              title: "3. Account Registration",
              body: `You must create an account to use RepWise. You are responsible for:

- Providing accurate and complete registration information
- Maintaining the security of your account credentials
- All activity that occurs under your account
- Notifying us immediately of any unauthorized access

You must be at least 18 years old to create an account.`,
            },
            {
              title: "4. Acceptable Use",
              body: `You agree not to:

- Upload data you do not have the right to share
- Attempt to reverse engineer or extract our AI models
- Use RepWise to generate insights for purposes that violate applicable law
- Share your account credentials with unauthorized users
- Use automated scripts to access the service in ways that abuse our infrastructure
- Attempt to circumvent any usage limits or security measures`,
            },
            {
              title: "5. Your Data",
              body: `You retain full ownership of all data you upload to RepWise. By uploading data, you grant us a limited license to process it solely for the purpose of generating your insights.

We will not access, use, or share your sales data for any purpose other than providing the RepWise service to you. See our Privacy Policy for full details.`,
            },
            {
              title: "6. Subscriptions and Billing",
              body: `RepWise offers free and paid subscription plans. Paid plans are billed monthly or annually in advance.

Free plan: Limited to 3 insights and 1 CSV upload per month.

Paid plans: Billed automatically at the start of each billing period. You authorize us to charge your payment method on a recurring basis.

Cancellations: You may cancel at any time. Cancellation takes effect at the end of your current billing period. No refunds are provided for partial periods.

Price changes: We will provide at least 30 days notice before changing subscription prices.`,
            },
            {
              title: "7. AI-Generated Insights",
              body: `RepWise uses artificial intelligence to generate sales insights based on your data. These insights are provided for informational purposes only.

We do not guarantee the accuracy, completeness, or fitness for any particular purpose of AI-generated insights. Business decisions based on these insights are made at your own discretion and risk.

RepWise is not responsible for any business outcomes resulting from actions taken based on our insights.`,
            },
            {
              title: "8. Intellectual Property",
              body: `RepWise and its original content, features, and functionality are owned by RepWise and protected by applicable intellectual property laws.

You may not copy, modify, distribute, sell, or lease any part of our service or software without our explicit written permission.`,
            },
            {
              title: "9. Limitation of Liability",
              body: `To the maximum extent permitted by law, RepWise shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of the service.

Our total liability to you for any claims arising from use of RepWise shall not exceed the amount you paid us in the 12 months preceding the claim.`,
            },
            {
              title: "10. Disclaimer of Warranties",
              body: `RepWise is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. We do not warrant that the service will be uninterrupted, error-free, or completely secure.`,
            },
            {
              title: "11. Termination",
              body: `We may terminate or suspend your account immediately, without prior notice, if you violate these terms. Upon termination, your right to use RepWise ceases immediately.

You may terminate your account at any time by contacting support@tryrepwise.com or through your account settings.`,
            },
            {
              title: "12. Changes to Terms",
              body: `We reserve the right to modify these terms at any time. We will notify you of material changes by email or through the product with at least 14 days notice. Continued use of RepWise after changes take effect constitutes acceptance.`,
            },
            {
              title: "13. Contact",
              body: `For questions about these terms, contact us at:

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
          <Link href="/privacy" className="text-gray-600 text-sm hover:text-gray-400 transition">Privacy Policy →</Link>
        </div>
      </div>
    </div>
  );
}
