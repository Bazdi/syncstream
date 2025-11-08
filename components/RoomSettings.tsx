import React, { useState, useEffect } from 'react';
import { Room, RoomPermissions, PermissionLevel, User } from '../types';
import { apiService } from '../services/api';

interface RoomSettingsProps {
  room: Room;
  currentUser: User;
  onClose: () => void;
  onUpdate: () => void;
}

const PERMISSION_OPTIONS: { value: PermissionLevel; label: string }[] = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'members', label: 'Members' },
  { value: 'moderators', label: 'Moderators' },
  { value: 'owner', label: 'Owner Only' },
];

export const RoomSettings: React.FC<RoomSettingsProps> = ({
  room,
  currentUser,
  onClose,
  onUpdate,
}) => {
  const [permissions, setPermissions] = useState<RoomPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isOwner = room.ownerId === currentUser.id;

  useEffect(() => {
    loadPermissions();
  }, [room.id]);

  const loadPermissions = async () => {
    setLoading(true);
    const response = await apiService.getRoomPermissions(room.id);
    if (response.data?.permissions) {
      setPermissions(response.data.permissions);
    } else {
      setError(response.error || 'Failed to load permissions');
    }
    setLoading(false);
  };

  const handlePermissionChange = (
    key: keyof RoomPermissions,
    value: PermissionLevel
  ) => {
    if (permissions) {
      setPermissions({ ...permissions, [key]: value });
    }
  };

  const handleSave = async () => {
    if (!permissions) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    const response = await apiService.updateRoomPermissions(room.id, {
      canPlay: permissions.canPlay,
      canPause: permissions.canPause,
      canSeek: permissions.canSeek,
      canChangeVideo: permissions.canChangeVideo,
      canAddToQueue: permissions.canAddToQueue,
      canRemoveFromQueue: permissions.canRemoveFromQueue,
      canReorderQueue: permissions.canReorderQueue,
      canClearQueue: permissions.canClearQueue,
      canInviteUsers: permissions.canInviteUsers,
      canKickUsers: permissions.canKickUsers,
      canChangeSettings: permissions.canChangeSettings,
    });

    if (response.data) {
      setSuccess(true);
      setTimeout(() => {
        onUpdate();
        onClose();
      }, 1000);
    } else {
      setError(response.error || 'Failed to save permissions');
    }
    setSaving(false);
  };

  const renderPermissionRow = (
    label: string,
    key: keyof RoomPermissions,
    description: string
  ) => {
    if (!permissions || key === 'id' || key === 'roomId') return null;

    return (
      <div className="mb-4 pb-4 border-b border-gray-700">
        <div className="flex justify-between items-start mb-2">
          <div>
            <label className="block text-sm font-medium text-white">
              {label}
            </label>
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          </div>
          <select
            value={permissions[key] as PermissionLevel}
            onChange={(e) =>
              handlePermissionChange(key, e.target.value as PermissionLevel)
            }
            disabled={!isOwner}
            className="bg-gray-700 text-white px-3 py-1 rounded-lg text-sm border border-gray-600 focus:border-purple-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {PERMISSION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="text-center text-white">Loading permissions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 my-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Room Settings</h2>
            <p className="text-sm text-gray-400 mt-1">
              {room.name} •{' '}
              <span
                className={
                  room.tier === 'premium'
                    ? 'text-yellow-400 font-semibold'
                    : 'text-gray-400'
                }
              >
                {room.tier === 'premium' ? '⭐ Premium' : 'Free'}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {!isOwner && (
          <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-3 mb-4">
            <p className="text-yellow-400 text-sm">
              Only the room owner can modify permissions.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-900 bg-opacity-30 border border-green-600 rounded-lg p-3 mb-4">
            <p className="text-green-400 text-sm">
              Permissions saved successfully!
            </p>
          </div>
        )}

        <div className="max-h-96 overflow-y-auto mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Playback Controls
          </h3>
          {renderPermissionRow(
            'Play Video',
            'canPlay',
            'Who can start playing videos'
          )}
          {renderPermissionRow(
            'Pause Video',
            'canPause',
            'Who can pause videos'
          )}
          {renderPermissionRow(
            'Seek Video',
            'canSeek',
            'Who can skip to different timestamps'
          )}
          {renderPermissionRow(
            'Change Video',
            'canChangeVideo',
            'Who can switch to a different video'
          )}

          <h3 className="text-lg font-semibold text-white mb-4 mt-6">
            Queue Management
          </h3>
          {renderPermissionRow(
            'Add to Queue',
            'canAddToQueue',
            'Who can add videos to the queue'
          )}
          {renderPermissionRow(
            'Remove from Queue',
            'canRemoveFromQueue',
            'Who can remove videos from the queue'
          )}
          {renderPermissionRow(
            'Reorder Queue',
            'canReorderQueue',
            'Who can change the order of videos'
          )}
          {renderPermissionRow(
            'Clear Queue',
            'canClearQueue',
            'Who can clear the entire queue'
          )}

          <h3 className="text-lg font-semibold text-white mb-4 mt-6">
            Room Management
          </h3>
          {renderPermissionRow(
            'Invite Users',
            'canInviteUsers',
            'Who can invite new members to the room'
          )}
          {renderPermissionRow(
            'Kick Users',
            'canKickUsers',
            'Who can remove members from the room'
          )}
          {renderPermissionRow(
            'Change Settings',
            'canChangeSettings',
            'Who can modify room settings and permissions'
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          {isOwner && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
