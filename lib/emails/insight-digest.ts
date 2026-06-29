import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface Insight {
  priority: string;
  category: string;
  title: string;
  body: string;
  metric: string | null;
}

export async function sendInsightDigest(email: string, name: string, insights: Insight[]) {
  const critical = insights.filter(i => i.priority === "critical").slice(0, 3);
  const topInsights = critical.length > 0 ? critical : insights.slice(0, 3);

  const priorityColor = (p: string) => {
    if (p === "critical") return "#ef4444";
    if (p === "opportunity") return "#10b981";
    return "#3b82f6";
  };

  const priorityLabel = (p: string) => {
    if (p === "critical") return "Critical";
    if (p === "opportunity") return "Opportunity";
    return "Pattern";
  };

  try {
    await resend.emails.send({
      from: "Andrew at Adunda <andrew@tryrepwise.com>",
      to: email,
      subject: "Your top insights for today — Adunda",
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">

    <div style="margin-bottom:24px;">
      <span style="font-size:20px;font-weight:700;color:#ffffff;">Try<span style="color:#3b82f6;">Adunda</span></span>
    </div>

    <div style="background:#111111;border:1px solid #222222;border-radius:16px;padding:32px;margin-bottom:20px;">
      <p style="color:#9ca3af;font-size:15px;line-height:1.7;margin:0 0 6px 0;">
        Good morning ${name || "there"} —
      </p>
      <p style="color:#9ca3af;font-size:15px;line-height:1.7;margin:0 0 24px 0;">
        Here are the most important things your data is telling you today. I pulled your top insights so you can start the day knowing exactly what to work on.
      </p>

      ${topInsights.map(insight => `
        <div style="background:#0f0f0f;border:1px solid #1f2937;border-radius:12px;padding:16px;margin-bottom:12px;">
          <div style="margin-bottom:8px;">
            <span style="background:${priorityColor(insight.priority)}20;color:${priorityColor(insight.priority)};font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;">${priorityLabel(insight.priority)}</span>
            <span style="color:#4b5563;font-size:11px;margin-left:8px;">${insight.category}</span>
            ${insight.metric ? `<span style="color:#60a5fa;font-size:11px;font-weight:600;float:right;">${insight.metric}</span>` : ""}
          </div>
          <p style="color:#ffffff;font-size:14px;font-weight:600;margin:0 0 6px 0;">${insight.title}</p>
          <p style="color:#9ca3af;font-size:13px;line-height:1.5;margin:0;">${insight.body}</p>
        </div>
      `).join("")}

      <a href="https://tryrepwise.com/dashboard" style="display:block;background:#3b82f6;color:#ffffff;text-align:center;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;margin-top:20px;">
        View all insights →
      </a>

      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:24px 0 0 0;">
        If anything looks off or you want a feature added — just reply to this email.<br><br>
        — Andrew<br>
        <span style="color:#4b5563;">Founder, Adunda</span>
      </p>
    </div>

    <div style="text-align:center;">
      <p style="color:#374151;font-size:12px;margin:0;">
        <a href="https://tryrepwise.com" style="color:#4b5563;text-decoration:none;">tryrepwise.com</a>
        &nbsp;·&nbsp;
        <a href="https://tryrepwise.com/privacy" style="color:#4b5563;text-decoration:none;">Privacy</a>
      </p>
    </div>

  </div>
</body>
</html>
      `,
    });
  } catch (err) {
    console.error("Digest email error:", err);
  }
}
