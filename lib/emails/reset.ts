import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  try {
    await resend.emails.send({
      from: "RepWise <andrew@tryrepwise.com>",
      to: email,
      subject: "Reset your RepWise password",
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
      <div style="font-size:32px;margin-bottom:16px;">🔐</div>
      <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 8px 0;">Reset your password</h1>
      <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 24px 0;">
        Click the button below to reset your RepWise password. This link expires in 1 hour.
      </p>
      <a href="${resetLink}" style="display:block;background:#3b82f6;color:#ffffff;text-align:center;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;margin-bottom:16px;">
        Reset password →
      </a>
      <p style="color:#6b7280;font-size:12px;text-align:center;margin:0;">
        If you did not request this, you can safely ignore this email.
      </p>
    </div>

    <div style="text-align:center;">
      <p style="color:#4b5563;font-size:12px;margin:0;">
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
