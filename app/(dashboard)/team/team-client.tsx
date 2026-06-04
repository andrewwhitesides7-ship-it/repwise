"use client";

import { useState } from "react";
import { createTeam, inviteRep, removeRep } from "@/app/actions/team";

interface Member {
  id: string;
  invited_email: string | null;
  invite_accepted: boolean;
  user_id: string | null;
  users: { full_name: string | null; email: string; role: string } | null;
  latestInsight: { title: string } | null;
}

interface Team {
  id: string;
  name: string;
  seat_count: number;
}

interface Profile {
  role: string;
  team_id: string | null;
  full_name: string | null;
}

export default function TeamClient({
  profile,
  team,
  members,
}: {
  profile: Profile | null;
  team: Team | null;
  members: Member[];
}) {
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [createError, setCreateError] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  const isManager = profile?.role === "manager";

  async function handleCreateTeam(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      await createTeam(new FormData(e.currentTarget));
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed");
      setCreating(false);
    }
  }

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInviting(true);
    setInviteError("");
    setInviteSuccess("");
    try {
      const fd = new FormData(e.currentTarget);
      await inviteRep(fd);
      setInviteSuccess(`Invite sent to ${fd.get("email")}`);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(memberId: string) {
    setRemoving(memberId);
    try { await removeRep(memberId); } catch { setRemoving(null); }
  }

  if (!isManager) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">Team</h1>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-white font-semibold text-lg mb-2">Your manager controls team settings</h3>
          <p className="text-gray-400 text-sm">Team settings and invites are managed by your team manager.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Team</h1>
        <p className="text-gray-400 text-sm">Manage your team, invite reps, and view their performance.</p>
      </div>

      {!team && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-1">Create Your Team</h2>
          <p className="text-gray-500 text-xs mb-4">Set up your team to start inviting reps</p>
          <form onSubmit={handleCreateTeam} className="flex gap-3">
            <input name="name" type="text" required placeholder="e.g. Austin Solar Team" className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            <button type="submit" disabled={creating} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition whitespace-nowrap">
              {creating ? "Creating..." : "Create Team"}
            </button>
          </form>
          {createError && <p className="text-red-400 text-sm mt-3">{createError}</p>}
        </div>
      )}

      {team && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-xl">🏢</div>
            <div>
              <h2 className="text-white font-semibold">{team.name}</h2>
              <p className="text-gray-500 text-xs">{members.length} member{members.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>
      )}

      {team && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-1">Invite a Rep</h2>
          <p className="text-gray-500 text-xs mb-4">Send an email invite with a signup link</p>
          <form onSubmit={handleInvite} className="flex gap-3">
            <input name="email" type="email" required placeholder="rep@example.com" className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            <button type="submit" disabled={inviting} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition whitespace-nowrap">
              {inviting ? "Sending..." : "Send Invite"}
            </button>
          </form>
          {inviteError && <p className="text-red-400 text-sm mt-3">{inviteError}</p>}
          {inviteSuccess && <div className="mt-3 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2.5"><p className="text-green-400 text-sm">{inviteSuccess}</p></div>}
        </div>
      )}

      {team && (
        <div>
          <h2 className="text-white font-semibold mb-4">
            Team Members <span className="ml-2 text-sm text-gray-500 font-normal">{members.length} total</span>
          </h2>
          {members.length === 0 && (
            <div className="bg-gray-900 border border-gray-800 border-dashed rounded-2xl p-12 text-center">
              <div className="text-4xl mb-3">👋</div>
              <h3 className="text-white font-semibold mb-1">No members yet</h3>
              <p className="text-gray-400 text-sm">Invite your first rep using the form above.</p>
            </div>
          )}
          <div className="grid gap-3">
            {members.map((member) => {
              const name = member.users?.full_name || member.invited_email || "Pending";
              const email = member.users?.email || member.invited_email || "";
              const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
              return (
                <div key={member.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-between hover:border-gray-700 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 font-bold text-sm">{initials || "?"}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-sm">{name}</span>
                        {!member.invite_accepted
                          ? <span className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">Pending</span>
                          : <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">Active</span>
                        }
                      </div>
                      <p className="text-gray-500 text-xs">{email}</p>
                      {member.latestInsight && <p className="text-gray-600 text-xs mt-0.5">Latest: {member.latestInsight.title}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.user_id && (
                      <a href={`/team/${member.user_id}`} className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition font-medium">
                        View Insights
                      </a>
                    )}
                    <button onClick={() => handleRemove(member.id)} disabled={removing === member.id} className="text-xs text-gray-500 hover:text-red-400 bg-gray-800 hover:bg-red-500/10 border border-gray-700 hover:border-red-500/20 px-3 py-1.5 rounded-lg transition">
                      {removing === member.id ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

