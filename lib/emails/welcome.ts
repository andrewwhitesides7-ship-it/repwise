import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    await resend.emails.send({
      from: "Andrew at RepWise <andrew@tryrepwise.com>",
      to: email,
      subject: "Welcome to RepWise — here is how to get your first insight",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    
    <div style="margin-bottom:32px;">
      <span style="font-size:20px;font-weight:700;color:#ffffff;">Try<span style="color:#3b82f6;">RepWise</span></span>
    </div>

    <div style="background:#111111;border:1px solid #222222;border-radius:16px;padding:32px;margin-bottom:24px;">
      <div style="font-size:32px;margin-bottom:16px;">👋</div>
      <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 8px 0;">
        Hey ${name || "there"}, welcome to RepWise!
      </h1>
      <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 24px 0;">
        You are one CSV upload away from knowing exactly where your team is losing deals. Most reps find their first insight within 2 minutes.
      </p>
      
      <div style="background:#1a1a2e;border:1px solid #1e3a5f;border-radius:12px;padding:16px;margin-bottom:24px;">
        <p style="color:#60a5fa;font-size:13px;font-weight:600;margin:0 0 4px 0;">🧠 What RepWise does</p>
        <p style="color:#93c5fd;font-size:13px;line-height:1.5;margin:0;">
          Upload your sales CSV and AI analyzes it to surface 8-10 specific insights — which hours close best, which reps are burning doors, which ZIPs convert best.
        </p>
      </div>

      <div style="margin-bottom:24px;">
        <p style="color:#ffffff;font-size:14px;font-weight:600;margin:0 0 12px 0;">Get started in 3 steps:</p>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <div style="background:#3b82f6;color:#ffffff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;padding:0;">1</div>
            <div>
              <p style="color:#ffffff;font-size:13px;font-weight:600;margin:0;">Export your sales data as a CSV</p>
              <p style="color:#6b7280;font-size:12px;margin:0;">From HubSpot, Salesforce, or any spreadsheet</p>
            </div>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <div style="background:#3b82f6;color:#ffffff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;padding:0;">2</div>
            <div>
              <p style="color:#ffffff;font-size:13px;font-weight:600;margin:0;">Upload it to RepWise</p>
              <p style="color:#6b7280;font-size:12px;margin:0;">Drag and drop on the Upload page</p>
            </div>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <div style="background:#3b82f6;color:#ffffff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;padding:0;">3</div>
            <div>
              <p style="color:#ffffff;font-size:13px;font-weight:600;margin:0;">Get your AI insights in 2 minutes</p>
              <p style="color:#6b7280;font-size:12px;margin:0;">8-10 specific insights on your dashboard</p>
            </div>
          </div>
        </div>
      </div>

      <a href="https://tryrepwise.com/upload" style="display:block;background:#3b82f6;color:#ffffff;text-align:center;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;">
        Upload your first CSV →
      </a>
    </div>

    <div style="background:#111111;border:1px solid #222222;border-radius:16px;padding:24px;margin-bottom:24px;">
      <p style="color:#ffffff;font-size:14px;font-weight:600;margin:0 0 8px 0;">Need help?</p>
      <p style="color:#9ca3af;font-size:13px;line-height:1.5;margin:0 0 12px 0;">
        Reply to this email anytime. I built RepWise and I personally respond to every message.
      </p>
      <p style="color:#6b7280;font-size:12px;margin:0;">— Andrew, founder of RepWise</p>
    </div>

    <div style="text-align:center;">
      <p style="color:#4b5563;font-size:12px;margin:0 0 8px 0;">
        <a href="https://tryrepwise.com" style="color:#4b5563;text-decoration:none;">tryrepwise.com</a>
        &nbsp;·&nbsp;
        <a href="https://tryrepwise.com/privacy" style="color:#4b5563;text-decoration:none;">Privacy</a>
        &nbsp;·&nbsp;
        <a href="https://tryrepwise.com/terms" style="color:#4b5563;text-decoration:none;">Terms</a>
      </p>
      <p style="color:#374151;font-size:11px;margin:0;">
        You received this because you signed up for RepWise.
      </p>
    </div>

  </div>
</body>
</html>
      `,
    });
  } catch (err) {
    console.error("Welcome email error:", err);
  }
}
