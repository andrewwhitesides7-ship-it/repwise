// Meridian agent stack — the agents' "hands". Sends real email via Resend.
// Wrapped so a missing key or send failure never throws into agent runs.

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");
// Must be a verified sender on your Resend domain (tryrepwise.com).
const FROM = process.env.AGENT_FROM_EMAIL || "Meridian <andrew@tryrepwise.com>";

export async function sendEmail(opts: { to: string; subject: string; body: string }): Promise<{ sent: boolean; id?: string; reason?: string }> {
  if (!process.env.RESEND_API_KEY) return { sent: false, reason: "RESEND_API_KEY not set" };
  if (!opts.to || !opts.subject || !opts.body) return { sent: false, reason: "missing to/subject/body" };
  try {
    const html = opts.body
      .split("\n")
      .map((line) => (line.trim() === "" ? "<br/>" : `<p style="margin:0 0 12px">${escapeHtml(line)}</p>`))
      .join("");
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html,
      text: opts.body,
    });
    if (error) return { sent: false, reason: String(error) };
    return { sent: true, id: data?.id };
  } catch (e) {
    return { sent: false, reason: String(e) };
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
