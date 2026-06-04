"use client";

import { useState } from "react";
import Link from "next/link";
import { generateSocialPosts, approvePost, rejectPost, markPosted, deletePost } from "@/app/actions/social";

interface SocialPost {
  id: string;
  platform: "reddit" | "facebook" | "slack" | "twitter";
  community: string;
  title: string | null;
  body: string;
  status: "draft" | "approved" | "posted" | "rejected";
  url: string | null;
  upvotes: number;
  comments: number;
  clicks: number;
  posted_at: string | null;
  created_at: string;
}

const platformConfig = {
  reddit: {
    icon: "🟠",
    color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    label: "Reddit",
    getPostUrl: (community: string) => `https://www.reddit.com/${community}/submit`,
  },
  facebook: {
    icon: "🔵",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    label: "Facebook",
    getPostUrl: (community: string) => `https://www.facebook.com/search/groups/?q=${encodeURIComponent(community)}`,
  },
  slack: {
    icon: "🟣",
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    label: "Slack",
    getPostUrl: (_community: string) => `https://slack.com`,
  },
  twitter: {
    icon: "⚫",
    color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    label: "Twitter",
    getPostUrl: (_community: string) => `https://twitter.com/compose/tweet`,
  },
};

const statusConfig = {
  draft: { label: "Draft", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  approved: { label: "Ready to post", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  posted: { label: "Posted", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function SocialClient({ posts }: { posts: SocialPost[] }) {
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<"all" | "draft" | "approved" | "posted" | "rejected">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [postingId, setPostingId] = useState<string | null>(null);
  const [postUrl, setPostUrl] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    try {
      await generateSocialPosts();
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  }

  async function handleMarkPosted(postId: string) {
    if (!postUrl.trim()) return;
    await markPosted(postId, postUrl);
    setPostingId(null);
    setPostUrl("");
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function getFullPostText(post: SocialPost) {
    if (post.title) return `${post.title}\n\n${post.body}`;
    return post.body;
  }

  const filtered = posts.filter(p => filter === "all" || p.status === filter);
  const counts = {
    all: posts.length,
    draft: posts.filter(p => p.status === "draft").length,
    approved: posts.filter(p => p.status === "approved").length,
    posted: posts.filter(p => p.status === "posted").length,
    rejected: posts.filter(p => p.status === "rejected").length,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link href="/admin" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-3 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Back to Admin
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1">Social Posting</h1>
          <p className="text-gray-400 text-sm">AI-generated founder posts. Copy and paste into communities in 30 seconds each.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition shadow-lg shadow-blue-500/20"
        >
          {generating ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Generating...
            </>
          ) : "🤖 Generate new posts"}
        </button>
      </div>

      <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 mb-6">
        <h3 className="text-white font-semibold text-sm mb-3">How to post in 30 seconds</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { step: "1", title: "Approve the post", desc: "Review the AI content and approve what looks good" },
            { step: "2", title: "Copy and open", desc: "Hit copy then click the community link to open it" },
            { step: "3", title: "Paste and track", desc: "Paste the content, submit, then mark it as posted" },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{s.step}</div>
              <div>
                <p className="text-white text-xs font-semibold">{s.title}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total posts", value: counts.all, icon: "📝" },
          { label: "Pending review", value: counts.draft, icon: "⏳" },
          { label: "Ready to post", value: counts.approved, icon: "👍" },
          { label: "Posted", value: counts.posted, icon: "✅" },
        ].map(stat => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{stat.label}</span>
              <span>{stat.icon}</span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 w-fit">
        {(["all", "draft", "approved", "posted", "rejected"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize ${filter === f ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"}`}
          >
            {f} <span className="text-gray-600">{counts[f]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 border-dashed rounded-2xl p-16 text-center">
          <div className="text-5xl mb-4">🤖</div>
          <h3 className="text-white font-semibold text-lg mb-2">No posts yet</h3>
          <p className="text-gray-400 text-sm mb-6">Generate AI-drafted founder posts for Reddit, Facebook, and Slack.</p>
          <button onClick={handleGenerate} disabled={generating} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl text-sm transition">
            {generating ? "Generating..." : "Generate posts"}
          </button>
        </div>
      )}

      <div className="space-y-4">
        {filtered.map(post => {
          const platform = platformConfig[post.platform] || platformConfig.reddit;
          const status = statusConfig[post.status];
          const isExpanded = expanded === post.id;
          const isCopied = copied === post.id;

          return (
            <div key={post.id} className={`bg-gray-900 border rounded-2xl overflow-hidden transition-all ${isExpanded ? "border-blue-500/30" : "border-gray-800 hover:border-gray-700"}`}>
              <div className="p-5 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : post.id)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${platform.color}`}>
                        {platform.icon} {platform.label}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-800 px-2.5 py-1 rounded-full">{post.community}</span>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${status.color}`}>{status.label}</span>
                      {post.posted_at && (
                        <span className="text-xs text-gray-600">{new Date(post.posted_at).toLocaleDateString()}</span>
                      )}
                    </div>
                    {post.title && <h3 className="text-white font-semibold text-sm mb-1">{post.title}</h3>}
                    <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{post.body}</p>
                  </div>
                  <svg className={`w-4 h-4 text-gray-600 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-800 p-5 space-y-4">
                  {post.title && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Title</p>
                      <div className="flex items-center gap-2">
                        <p className="text-white text-sm font-medium bg-gray-800 rounded-xl px-4 py-3 flex-1">{post.title}</p>
                        <button
                          onClick={() => copyToClipboard(post.title!, `title-${post.id}`)}
                          className={`flex-shrink-0 text-xs px-3 py-2 rounded-xl border transition ${copied === `title-${post.id}` ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"}`}
                        >
                          {copied === `title-${post.id}` ? "Copied" : "Copy title"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Post content</p>
                    <div className="text-gray-300 text-sm leading-relaxed bg-gray-800 rounded-xl px-4 py-3 whitespace-pre-line">{post.body}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => copyToClipboard(getFullPostText(post), post.id)}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border transition ${isCopied ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-gray-800 text-white border-gray-700 hover:bg-gray-700"}`}
                    >
                      {isCopied ? (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          Copied
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          Copy post
                        </>
                      )}
                    </button>

                    
                      href={platform.getPostUrl(post.community)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      Open {platform.label}
                    </a>
                  </div>

                  {post.url && (
                    <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3">
                      <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="text-emerald-400 text-xs">Posted at: </span>
                      <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs hover:text-blue-300 transition truncate">{post.url}</a>
                    </div>
                  )}

                  {postingId === post.id && (
                    <div className="flex items-center gap-3">
                      <input
                        type="url"
                        value={postUrl}
                        onChange={e => setPostUrl(e.target.value)}
                        placeholder="Paste the URL of your post..."
                        className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        autoFocus
                      />
                      <button onClick={() => handleMarkPosted(post.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition whitespace-nowrap">
                        Confirm
                      </button>
                      <button onClick={() => setPostingId(null)} className="text-gray-500 hover:text-gray-300 text-sm transition">Cancel</button>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                    {post.status === "draft" && (
                      <>
                        <button onClick={() => approvePost(post.id)} className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 px-3 py-2 rounded-xl transition">
                          Approve
                        </button>
                        <button onClick={() => rejectPost(post.id)} className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 px-3 py-2 rounded-xl transition">
                          Reject
                        </button>
                      </>
                    )}
                    {post.status === "approved" && postingId !== post.id && (
                      <button onClick={() => setPostingId(post.id)} className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 px-3 py-2 rounded-xl transition">
                        Mark as posted
                      </button>
                    )}
                    <button onClick={() => deletePost(post.id)} className="text-xs text-gray-600 hover:text-gray-400 px-3 py-2 rounded-xl hover:bg-gray-800 transition ml-auto">
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
