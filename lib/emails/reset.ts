import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  try {
    await resend.emails.send({
      from: "Andrew at Adunda <andrew@tryrepwise.com>",
      to: email,
      subject: "Reset your Adunda password",
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
      <p style="color:#9ca3af;font-size:15px;line-height:1.7;margin:0 0 16px 0;">
        Hey,
      </p>
      <p style="color:#9ca3af;font-size:15px;line-height:1.7;margin:0 0 24px 0;">
        No worries — happens to everyone. Click the button below to reset your password. The link expires in 1 hour.
      </p>

      <a href="${resetLink}" style="display:block;background:#3b82f6;color:#ffffff;text-align:center;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;margin-bottom:20px;">
        Reset my password →
      </a>

      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 12px 0;">
        If you did not request this you can safely ignore it. Your password will not change.
      </p>
      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">
        — Andrew<br>
        <span style="color:#4b5563;">Founder, Adunda</span>
      </p>
    </div>

    <div style="text-align:center;">
      <p style="color:#374151;font-size:12px;margin:0;">
        <a href="https://tryrepwise.com" style="color:#4b5563;text-decoration:none;">tryrepwise.com</a>
      </p>
    </div>

  </div>
</body>
</html>
      `,
    });
  } catch (err) {
    console.error("Reset email error:", err);
  }
}
