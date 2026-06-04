"use client";

import { useState } from "react";
import Link from "next/link";
import { sendTeamMessage, deleteMessage } from "@/app/actions/messages";

interface Message {
  id: string;
  message: string;
  message_type: string;
  read_by: string[];
  created_at: string;
  users: { full_name: string; email: string } | null;
}

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
}

const messageTypeConfig = {
  announcement: { label: "Announcement", icon: "📢", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  coaching: { label: "Coaching tip", icon: "💡", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  alert: { label: "Alert", icon: "🚨", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  celebration: { label: "Celebration", icon: "🎉", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

export default function MessagesClient({
  messages,
  isManager,
  currentUserId,
  teamMembers,
}: {
  messages: Message[];
  isManager: boolean;
  currentUserId: string;
  teamMembers: TeamMember[];
}) {
  const [showCompose, setShowCompose] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"announcement" | "coaching" | "alert" | "celebration">("announcement");
  const [sending, setSending] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await sendTeamMessage(message, messageType);
      setMessage("");
      setShowCompose(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link href="/team" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-3 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Team
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1">Team Messages</h1>
          <p className="text-gray-400 text-sm">
            {isManager ? "Send announcements, coaching tips, and alerts to your team." : "Messages from your manager."}
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => setShowCompose(!showCompose)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition shadow-lg shadow-blue-500/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New message
          </button>
        )}
      </div>

      {/* Compose */}
      {showCompose && isManager && (
        <div className="bg-gray-900 border border-blue-500/30 rounded-2xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-4">New message to team</h3>
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Message type</label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(messageTypeConfig) as Array<keyof typeof messageTypeConfig>).map(type => {
                  const cfg = messageTypeConfig[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setMessageType(type)}
                      className={"flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition " + (messageType === type ? cfg.color : "bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600")}
                    >
                      {cfg.icon} {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Message</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={
                  messageType === "announcement" ? "Share an important update with your team..." :
                  messageType === "coaching" ? "Share a tip or technique to help your team improve..." :
                  messageType === "alert" ? "Alert your team about something urgent..." :
                  "Celebrate a win or milestone with your team..."
                }
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition"
              >
                {sending ? "Sending..." : "Send to all reps"}
              </button>
              <button type="button" onClick={() => setShowCompose(false)} className="text-gray-500 hover:text-gray-300 text-sm transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Team members count */}
      {isManager && teamMembers.length > 0 && (
        <div className="flex items-center gap-2 mb-5 text-gray-500 text-xs">
          <div className="flex -space-x-1.5">
            {teamMembers.slice(0, 4).map((m, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-blue-500/20 border-2 border-gray-950 flex items-center justify-center text-blue-400 text-xs font-bold">
                {(m.full_name || m.email)[0]?.toUpperCase()}
              </div>
            ))}
          </div>
          Messages visible to {teamMembers.length} team member{teamMembers.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Messages */}
      {messages.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 border-dashed rounded-2xl p-16 text-center">
          <div className="text-5xl mb-4">💬</div>
          <h3 className="text-white font-semibold text-lg mb-2">No messages yet</h3>
          <p className="text-gray-400 text-sm">
            {isManager ? "Send your first message to your team." : "Your manager has not sent any messages yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map(msg => {
            const cfg = messageTypeConfig[msg.message_type as keyof typeof messageTypeConfig] || messageTypeConfig.announcement;
            const isUnread = !msg.read_by?.includes(currentUserId);
            const readCount = msg.read_by?.length || 0;

            return (
              <div key={msg.id} className={"bg-gray-900 border rounded-2xl p-5 transition " + (isUnread ? "border-blue-500/30" : "border-gray-800")}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className={"inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border " + cfg.color}>
                        {cfg.icon} {cfg.label}
                      </span>
                      {isUnread && (
                        <span className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">New</span>
                      )}
                      <span className="text-gray-600 text-xs ml-auto">
                        {new Date(msg.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-white text-sm leading-relaxed mb-3">{msg.message}</p>
                    <div className="flex items-center gap-3">
                      <p className="text-gray-600 text-xs">
                        From {msg.users?.full_name || "Manager"}
                      </p>
                      {isManager && (
                        <p className="text-gray-700 text-xs">{readCount} read</p>
                      )}
                    </div>
                  </div>
                  {isManager && (
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="text-gray-700 hover:text-gray-500 transition p-1 flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
