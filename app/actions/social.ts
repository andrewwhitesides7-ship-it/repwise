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
    { name: "r/SolarEnergy", members: "200k", focus: "solar industry" },
  ],
  facebook: [
    { name: "Door to Door Sales Professionals", members: "45k", focus: "D2D sales community" },
    { name: "Solar Sales Professionals", members: "28k", focus: "solar sales reps" },
    { name: "Field Sales Network", members: "15k", focus: "field sales professionals" },
    { name: "Sales Hacker Community", members: "80k", focus: "modern sales techniques" },
  ],
  slack: [
    { name: "RevGenius", members: "35k", focus: "revenue and sales professionals" },
    { name: "Sales Hacker", members: "20k", focus: "B2B sales community" },
    { name: "Pavilion", members: "10k", focus: "go-to-market executives" },
  ],
};

export async function generateSocialPosts() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 3000,
    system: `You are a growth marketer for RepWise, an AI sales intelligence tool for field sales and door-to-door teams. Generate authentic, helpful social media posts for different communities. Posts should provide genuine value and naturally mention RepWise where appropriate. Never be spammy. Write like a real sales professional sharing a tool they actually use. Return ONLY a JSON array. Each post: { platform: "reddit"|"facebook"|"slack", community: string, title: string (for reddit only, null otherwise), body: string (the actual post content, 2-4 paragraphs max), angle: string (the value angle of this post) }`,
    messages: [{
      role: "user",
      content: `Generate 6 social media posts for RepWise across these communities:

REDDIT: ${communities.reddit.map(c => `${c.name} (${c.focus})`).join(", ")}
FACEBOOK: ${communities.facebook.map(c => `${c.name} (${c.focus})`).join(", ")}
SLACK: ${communities.slack.map(c => `${c.name} (${c.focus})`).join(", ")}

RepWise value props:
- Upload sales CSV and get 8-10 AI insights in 2 minutes
- Find out which time of day closes best, which reps are burning doors, which ZIPs convert best
- Used by field sales and door-to-door teams
- Free to try at tryrepwise.com

Generate 2 Reddit posts, 2 Facebook posts, 2 Slack posts. Make them authentic and valuable.`,
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
      title: post.title,
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
