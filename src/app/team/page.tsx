'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Plus, Mail, Crown, Shield, User, Trash2, Zap } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { getSupabaseClient } from '@/lib/supabase';
import type { DbTeam, DbTeamMember } from '@/lib/supabase';

interface TeamMemberWithEmail extends DbTeamMember {
  email?: string;
}

export default function TeamPage() {
  const { user, isConfigured } = useAuth();
  const [teams, setTeams] = useState<DbTeam[]>([]);
  const [currentTeam, setCurrentTeam] = useState<DbTeam | null>(null);
  const [members, setMembers] = useState<TeamMemberWithEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    if (user && isConfigured) {
      loadTeams();
    } else {
      setLoading(false);
    }
  }, [user, isConfigured]);

  const loadTeams = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: teamsData } = await supabase
      .from('teams')
      .select('*')
      .order('created_at');

    if (teamsData && teamsData.length > 0) {
      setTeams(teamsData);
      setCurrentTeam(teamsData[0]);
      loadMembers(teamsData[0].id);
    }
    setLoading(false);
  };

  const loadMembers = async (teamId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId);

    setMembers(data || []);
  };

  const createTeam = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const name = prompt('Team name:');
    if (!name) return;

    const { data, error } = await supabase.rpc('create_team_with_owner', {
      team_name: name,
    });

    if (!error && data) {
      loadTeams();
    }
  };

  const inviteMember = async () => {
    if (!inviteEmail || !currentTeam) return;
    // Note: In production, you'd send an email invitation
    // For now, this is a placeholder
    alert(`Invitation would be sent to ${inviteEmail}`);
    setInviteEmail('');
    setShowInvite(false);
  };

  const removeMember = async (memberId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase || !currentTeam) return;

    if (!confirm('Remove this team member?')) return;

    await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);

    loadMembers(currentTeam.id);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-3.5 h-3.5 text-amber-400" />;
      case 'admin': return <Shield className="w-3.5 h-3.5 text-blue-400" />;
      default: return <User className="w-3.5 h-3.5 text-[#666]" />;
    }
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
            <Users className="w-7 h-7 text-blue-400" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Team features require Supabase</h1>
          <p className="text-[#888] text-sm mb-6">
            Set up Supabase to enable team collaboration, shared dashboards, and centralized billing.
          </p>
          <Link href="/" className="btn btn-secondary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <h1 className="text-xl font-semibold mb-2">Sign in required</h1>
          <p className="text-[#888] text-sm mb-6">
            Sign in to manage your team.
          </p>
          <Link href="/login" className="btn btn-primary">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-bg">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="p-1.5 -ml-1.5 text-[#666] hover:text-white rounded-lg hover:bg-white/[0.05]">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-[15px]">Team</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {loading ? (
          <div className="text-center py-12 text-[#666]">Loading...</div>
        ) : teams.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-[#171717] border border-white/[0.06] flex items-center justify-center mx-auto mb-5">
              <Users className="w-6 h-6 text-[#666]" />
            </div>
            <h2 className="text-lg font-medium mb-2">Create your team</h2>
            <p className="text-[#666] text-sm mb-6 max-w-sm mx-auto">
              Teams let you share API usage data and budgets with your organization.
            </p>
            <button onClick={createTeam} className="btn btn-primary">
              <Plus className="w-4 h-4" />
              Create Team
            </button>
          </div>
        ) : (
          <>
            {/* Team Selector */}
            {teams.length > 1 && (
              <section>
                <h2 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-4">
                  Your Teams
                </h2>
                <div className="flex gap-2 flex-wrap">
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => {
                        setCurrentTeam(team);
                        loadMembers(team.id);
                      }}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        currentTeam?.id === team.id
                          ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                          : 'border-white/[0.08] text-[#888] hover:border-white/[0.12]'
                      }`}
                    >
                      {team.name}
                    </button>
                  ))}
                  <button
                    onClick={createTeam}
                    className="px-3 py-1.5 text-sm rounded-lg border border-dashed border-white/[0.08] text-[#555] hover:border-white/[0.12] hover:text-[#888]"
                  >
                    <Plus className="w-3.5 h-3.5 inline mr-1" />
                    New
                  </button>
                </div>
              </section>
            )}

            {/* Team Members */}
            {currentTeam && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-medium text-[#666] uppercase tracking-wider">
                    Team Members
                  </h2>
                  <button
                    onClick={() => setShowInvite(true)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Invite
                  </button>
                </div>

                {showInvite && (
                  <div className="card p-4 mb-4">
                    <label className="text-xs text-[#666] block mb-2">Invite by email</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        className="flex-1 px-3 py-2 text-sm bg-[#0a0a0a] border border-white/[0.08] rounded-lg text-white placeholder-[#444]"
                      />
                      <button
                        onClick={inviteMember}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium rounded-lg"
                      >
                        Send
                      </button>
                      <button
                        onClick={() => setShowInvite(false)}
                        className="px-3 py-2 text-[#666] hover:text-white text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="card divide-y divide-white/[0.04]">
                  {members.map((member) => (
                    <div key={member.id} className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center">
                        {getRoleIcon(member.role)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          {member.email || member.user_id.slice(0, 8)}
                          {member.user_id === user?.id && (
                            <span className="text-[#555] ml-2">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-[#555] capitalize">{member.role}</p>
                      </div>
                      {member.role !== 'owner' && member.user_id !== user?.id && (
                        <button
                          onClick={() => removeMember(member.id)}
                          className="p-2 text-[#444] hover:text-red-400 rounded-lg hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
