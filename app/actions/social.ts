"use server";

import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const communities = {
  reddit: [
    { name: "r/sales", members: "180k", focus: "general sales tips and tools" },
    { name: "r/Entrepreneur", members: "2.5M", focus: "building businesses and startups" },
    { name: "r/smallbusiness", members: "800k", focus: "small business owners" },
    { name: "r/d2d", members: "12k", focus: "door-to-door sales specifically" },
    { name: "r/SaaS", members: "150k", focus: "SaaS products and tools" },
  ],
  facebook: [
    { name: "Door to Door Sales Professionals", members: "45k", focus: "D2D sales community" },
    { name: "Solar Sales Professionals", members: "28k", focus: "solar sales reps" },
    { name: "Field Sales Network", members: "15k", focus: "field sales professionals" },
  ],
  slack: [
    { name: "RevGenius", members: "35k", focus: "revenue and sales professionals" },
    { name: "Sales Hacker", members: "20k", focus: "B2B sales community" },
  ],
};

export async function generateSocialPosts() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4000,
    system: `You are Andrew, a 20-something founder who just built Adunda after watching his dad's field sales team struggle with no data insights. You are posting in online communities to get your first users. Write like a real person — casual, excited, a little vulnerable, founder energy. Not a marketer. Not corporate. Real.

Your voice:
- Casual language, contractions, occasional imperfection
- Share the real story of why you built it
- Transparent about being early/small
- Genuinely excited about what the product does
- Soft CTAs like "try it free at tryrepwise.com" or "would love feedback"
- Sometimes ask questions to spark conversation
- Sound like you posted this at midnight because you are hyped

Adunda in one line: you upload your sales CSV and AI tells you exactly where you are losing deals — which hours close best, which reps are burning doors, which ZIPs convert. Free to try at tryrepwise.com.

Return ONLY a JSON array. No preamble, no markdown, just raw JSON. Each post object: { platform: "reddit"|"facebook"|"slack", community: string, title: string or null (reddit only), body: string, angle: string }`,

    messages: [{
      role: "user",
      content: `Generate 6 social posts as Andrew the founder across these communities:

REDDIT (2 posts): ${communities.reddit.map(c => c.name).join(", ")}
FACEBOOK (2 posts): ${communities.facebook.map(c => c.name).join(", ")}
SLACK (2 posts): ${communities.slack.map(c => c.name).join(", ")}

Mix these angles across the posts:
1. Founder origin story — why you built Adunda (watching field sales reps have tons of data but zero insights)
2. Soft launch energy — "just launched this, would love feedback from anyone in field sales"
3. Sharing a specific insight the AI surfaced (e.g. "found out 3pm closes 3x better than morning")
4. Asking the community a genuine question that leads to Adunda naturally
5. Transparent startup founder sharing what they learned building for this market
6. "Try it free" post with a specific value prop for that community

Make every post feel human. No buzzwords. No corporate language. Real founder voice.`,
    }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "[]";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const posts = JSON.parse(cleaned);

  for (const post of posts) {
    await supabase.from("social_posts").insert({
      user_id: user.id,
      platform: post.platform,
      community: post.community,
      title: post.title || null,
      body: post.body,
      status: "draft",
    });
  }

  revalidatePath("/admin/social");
}

export async function approvePost(postId: string) {
  const supabase = createClient();
  await supabase.from("social_posts").update({ status: "approved" }).eq("id", postId);
  revalidatePath("/admin/social");
}

export async function rejectPost(postId: string) {
  const supabase = createClient();
  await supabase.from("social_posts").update({ status: "rejected" }).eq("id", postId);
  revalidatePath("/admin/social");
}

export async function markPosted(postId: string, url: string) {
  const supabase = createClient();
  await supabase.from("social_posts").update({
    status: "posted",
    url,
    posted_at: new Date().toISOString(),
  }).eq("id", postId);
  revalidatePath("/admin/social");
}

export async function deletePost(postId: string) {
  const supabase = createClient();
  await supabase.from("social_posts").delete().eq("id", postId);
  revalidatePath("/admin/social");
}
export async function generateOutreachMessages(influencerName: string, platform: string, followerCount: string, niche: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2000,
    system: `You are Andrew, founder of Adunda. Write authentic cold outreach DMs to D2D and field sales influencers proposing an affiliate partnership. Sound like a real founder — excited, direct, not corporate. Offer 40% commission. Return ONLY a JSON array of 3 message variants. Each: { platform: string, subject: string or null, body: string, tone: string }`,
    messages: [{
      role: "user",
      content: `Write 3 outreach message variants to ${influencerName}, a ${niche} influencer with ${followerCount} followers on ${platform}.

Adunda: AI tool that analyzes field sales CSV data and gives 8-10 insights in 2 minutes. Tells reps which hours close best, which ZIPs convert, which reps are burning doors. Free at tryrepwise.com.

Affiliate offer: 40% recurring commission. So if they send us someone on the $99 plan they earn $39.60/month forever as long as that person stays subscribed.

Write 3 variants:
1. Short and punchy - 3 sentences max
2. Value-first - lead with what Adunda does for their audience  
3. Numbers-focused - lead with the commission opportunity

Make them sound like a real founder DM not a template.`,
    }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "[]";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}
