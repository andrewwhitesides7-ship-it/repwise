import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/emails/welcome";

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();
    await sendWelcomeEmail(email, name);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Welcome email error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
