import React, { useState, useEffect } from 'react';
import { Room, RoomMember, Role, User } from '../types';
import { apiService } from '../services/api';

interface MemberListProps {
  room: Room;
  currentUser: User;
  onUpdate: () => void;
}

const ROLE_COLORS: Record<Role, string> = {
  owner: 'bg-yellow-500 text-black',
  moderator: 'bg-purple-500 text-white',
  member: 'bg-blue-500 text-white',
  viewer: 'bg-gray-500 text-white',
};

const ROLE_ICONS: Record<Role, string> = {
  owner: '👑',
  moderator: '🛡️',
  member: '👤',
  viewer: '👁️',
};

export const MemberList: React.FC<MemberListProps> = ({
  room,
  currentUser,
  onUpdate,
}) => {
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  const isOwner = room.ownerId === currentUser.id;
  const currentMember = members.find((m) => m.userId === currentUser.id);
  const isModerator = currentMember?.role === 'moderator' || isOwner;

  useEffect(() => {
    loadMembers();
  }, [room.id]);

  const loadMembers = async () => {
    setLoading(true);
    const response = await apiService.getRoomMembers(room.id);
    if (response.data?.members) {
      // Sort: owner first, then moderators, then members, then viewers
      const sorted = [...response.data.members].sort((a, b) => {
        const order = { owner: 0, moderator: 1, member: 2, viewer: 3 };
        return order[a.role] - order[b.role];
      });
      setMembers(sorted);
    } else {
      setError(response.error || 'Failed to load members');
    }
    setLoading(false);
  };

  const handleRoleChange = async (memberId: string, userId: string, newRole: Role) => {
    if (newRole === 'owner') return; // Can't assign owner role

    setUpdatingMemberId(memberId);
    const response = await apiService.updateMemberRole(room.id, userId, newRole as 'viewer' | 'member' | 'moderator');

    if (response.data) {
      await loadMembers();
      onUpdate();
    } else {
      setError(response.error || 'Failed to update role');
      setTimeout(() => setError(null), 3000);
    }
    setUpdatingMemberId(null);
  };

  const handleKickMember = async (memberId: string, userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    setUpdatingMemberId(memberId);
    const response = await apiService.removeMember(room.id, userId);

    if (response.data) {
      await loadMembers();
      onUpdate();
    } else {
      setError(response.error || 'Failed to remove member');
      setTimeout(() => setError(null), 3000);
    }
    setUpdatingMemberId(null);
  };

  const canModifyMember = (member: RoomMember): boolean => {
    if (member.userId === currentUser.id) return false; // Can't modify self
    if (member.role === 'owner') return false; // Can't modify owner
    if (!isOwner && member.role === 'moderator') return false; // Only owner can modify moderators
    return isModerator;
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="text-center text-gray-400">Loading members...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        Room Members ({members.length})
      </h3>

      {error && (
        <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded-lg p-2 mb-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {members.map((member) => (
          <div
            key={member.id}
            className="bg-gray-700 rounded-lg p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 flex-1">
              {member.user.avatarUrl ? (
                <img
                  src={member.user.avatarUrl}
                  alt={member.user.username}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
                  {member.user.username[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">
                    {member.user.username}
                  </span>
                  {member.userId === currentUser.id && (
                    <span className="text-xs text-gray-400">(You)</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      ROLE_COLORS[member.role]
                    }`}
                  >
                    {ROLE_ICONS[member.role]} {member.role}
                  </span>
                  {member.user.subscriptionStatus === 'premium' && (
                    <span className="text-xs text-yellow-400">⭐ Premium</span>
                  )}
                </div>
              </div>
            </div>

            {canModifyMember(member) && (
              <div className="flex items-center gap-2">
                <select
                  value={member.role}
                  onChange={(e) =>
                    handleRoleChange(member.id, member.userId, e.target.value as Role)
                  }
                  disabled={updatingMemberId === member.id}
                  className="bg-gray-600 text-white text-sm px-2 py-1 rounded border border-gray-500 focus:border-purple-500 focus:outline-none disabled:opacity-50"
                >
                  <option value="viewer">Viewer</option>
                  <option value="member">Member</option>
                  {isOwner && <option value="moderator">Moderator</option>}
                </select>
                <button
                  onClick={() => handleKickMember(member.id, member.userId)}
                  disabled={updatingMemberId === member.id}
                  className="text-red-400 hover:text-red-300 px-2 py-1 text-sm disabled:opacity-50"
                  title="Remove member"
                >
                  Kick
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {members.length === 0 && (
        <div className="text-center text-gray-400 py-8">No members yet</div>
      )}
    </div>
  );
};
