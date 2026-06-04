import Link from "next/link";

const faqs = [
  {
    category: "Getting Started",
    items: [
      { q: "What is RepWise?", a: "RepWise is an AI-powered sales intelligence platform built for field sales and door-to-door teams. Upload your sales activity data and our AI analyzes it to surface 8-10 specific insights about where you are losing deals — in under 2 minutes." },
      { q: "How do I get started?", a: "Sign up for a free account, go to the Upload page, and drag in a CSV of your sales activity. Within 2 minutes you will have your first batch of AI insights on your dashboard." },
      { q: "What data do I need?", a: "Any CSV with your sales activity works. Ideal columns include rep name, date, time of day, ZIP code, knocked, contacted, pitched, closed, and deal value. We handle any format and work with incomplete data." },
      { q: "Do I need a CRM?", a: "No. Export a CSV from any spreadsheet or CRM and upload directly. We also support direct HubSpot integration with one-click OAuth." },
    ],
  },
  {
    category: "AI Insights",
    items: [
      { q: "How does the AI analysis work?", a: "We parse your CSV, build a statistical summary of your sales activity, then send it to Claude — Anthropic's AI — which generates 8-10 specific, data-backed insights about where you are losing deals." },
      { q: "What kind of insights does RepWise generate?", a: "Insights fall into three categories: Critical (fix now), Opportunity (untapped potential), and Pattern (trends worth knowing). Examples include time-of-day performance, rep benchmarking, territory gaps, and missed follow-ups." },
      { q: "How often are insights refreshed?", a: "Every time you upload new data or sync your CRM. Old insights are automatically archived so your dashboard always shows the latest analysis." },
      { q: "Can I dismiss insights?", a: "Yes. Click the X on any insight card to dismiss it. Dismissed insights move to your History page." },
    ],
  },
  {
    category: "Plans and Billing",
    items: [
      { q: "What is the free plan?", a: "Free gives you 3 insights and 1 CSV upload per month so you can try RepWise before committing. No credit card required." },
      { q: "Can I cancel anytime?", a: "Yes. Cancel from your Billing page at any time. No contracts, no cancellation fees. Your account stays active until the end of your billing period." },
      { q: "What is the difference between Essential and Professional?", a: "Essential ($99/month) is for solo reps with unlimited uploads and insights. Professional ($199/month) adds team collaboration for up to 5 people, AI coaching, and 90-day history." },
      { q: "How does Team plan billing work?", a: "Team ($499/month) gives you unlimited seats. One flat price no matter how many reps you add." },
    ],
  },
  {
    category: "Data and Security",
    items: [
      { q: "Is my sales data secure?", a: "Yes. All data is encrypted in transit and at rest. Row-level security means your data is only ever accessible to you and team members you explicitly invite. We never sell or share your data." },
      { q: "Who can see my data?", a: "Only you and team members you invite. Managers can see their team insights. We never access your data for any purpose other than generating your insights." },
      { q: "How do I delete my data?", a: "Contact us at support@tryrepwise.com and we will permanently delete your account and all associated data within 48 hours." },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="text-xl font-bold text-white block mb-10">
            Try<span className="text-blue-500">RepWise</span>
          </Link>
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium px-3 py-1.5 rounded-full mb-4">Help Center</div>
          <h1 className="text-4xl font-bold mb-4">How can we help?</h1>
          <p className="text-gray-400 text-lg">Everything you need to know about RepWise.</p>
        </div>

        {/* Quick links */}
        <div className="grid md:grid-cols-3 gap-4 mb-14">
          {[
            { icon: "🚀", title: "Getting started", desc: "Set up your account and upload your first CSV", href: "#getting-started" },
            { icon: "🧠", title: "AI insights", desc: "Understand how the analysis works", href: "#ai-insights" },
            { icon: "💳", title: "Billing", desc: "Plans, pricing, and cancellations", href: "#plans-and-billing" },
          ].map(card => (
            <a key={card.title} href={card.href} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="text-2xl mb-3">{card.icon}</div>
              <h3 className="text-white font-semibold text-sm mb-1">{card.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{card.desc}</p>
            </a>
          ))}
        </div>

        {/* FAQ sections */}
        <div className="space-y-12">
          {faqs.map(section => (
            <div key={section.category} id={section.category.toLowerCase().replace(/\s+/g, "-")}>
              <h2 className="text-white font-bold text-xl mb-5">{section.category}</h2>
              <div className="space-y-3">
                {section.items.map(item => (
                  <div key={item.q} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition">
                    <h3 className="text-white font-semibold text-sm mb-2">{item.q}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-14 bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/20 rounded-3xl p-8 text-center">
          <div className="text-3xl mb-3">💬</div>
          <h3 className="text-white font-bold text-xl mb-2">Still have questions?</h3>
          <p className="text-gray-400 text-sm mb-5">We typically respond within a few hours.</p>
          <Link href="/contact" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl text-sm transition">
            Contact us
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 flex items-center justify-between">
          <Link href="/" className="text-gray-600 text-sm hover:text-gray-400 transition">← Back to home</Link>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-gray-600 text-sm hover:text-gray-400 transition">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-600 text-sm hover:text-gray-400 transition">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
