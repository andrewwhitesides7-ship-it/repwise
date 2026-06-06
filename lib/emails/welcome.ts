import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    await resend.emails.send({
      from: "Andrew at RepWise <andrew@tryrepwise.com>",
      to: email,
      subject: "You just made my day — welcome to RepWise",
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">

    <div style="margin-bottom:24px;">
      <span style="font-size:20px;font-weight:700;color:#ffffff;">Try<span style="color:#3b82f6;">RepWise</span></span>
    </div>

    <div style="background:#111111;border:1px solid #222222;border-radius:16px;padding:32px;margin-bottom:20px;">
      <p style="color:#9ca3af;font-size:15px;line-height:1.7;margin:0 0 16px 0;">
        Hey ${name || "there"},
      </p>
      <p style="color:#9ca3af;font-size:15px;line-height:1.7;margin:0 0 16px 0;">
        Seriously — thank you for signing up. I built RepWise by myself after years in field sales with no way to actually see what was working in my own data. Knowing that someone is trying it means a lot.
      </p>
      <p style="color:#9ca3af;font-size:15px;line-height:1.7;margin:0 0 16px 0;">
        Here is what to do right now — go to the Upload page and drop in a CSV of your sales activity. Any format works. Messy data is fine. In about 2 minutes you will have your first batch of insights on your dashboard.
      </p>
      <p style="color:#9ca3af;font-size:15px;line-height:1.7;margin:0 0 24px 0;">
        If anything feels confusing or broken — reply to this email. I read every single one and I will fix it personally.
      </p>

      <a href="https://tryrepwise.com/upload" style="display:block;background:#3b82f6;color:#ffffff;text-align:center;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;margin-bottom:20px;">
        Upload your first CSV →
      </a>

      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">
        Thank you again. Really.<br><br>
        — Andrew<br>
        <span style="color:#4b5563;">Founder, RepWise</span><br>
        <a href="mailto:andrew@tryrepwise.com" style="color:#3b82f6;text-decoration:none;">andrew@tryrepwise.com</a>
      </p>
    </div>

    <div style="text-align:center;">
      <p style="color:#374151;font-size:12px;margin:0;">
        <a href="https://tryrepwise.com" style="color:#4b5563;text-decoration:none;">tryrepwise.com</a>
        &nbsp;·&nbsp;
        <a href="https://tryrepwise.com/privacy" style="color:#4b5563;text-decoration:none;">Privacy</a>
        &nbsp;·&nbsp;
        <a href="https://tryrepwise.com/terms" style="color:#4b5563;text-decoration:none;">Terms</a>
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
