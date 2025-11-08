import React, { useState } from 'react';
import { RoomTier, User } from '../types';
import { apiService } from '../services/api';

interface RoomCreationProps {
  currentUser: User;
  onClose: () => void;
  onCreate: (roomId: string) => void;
}

export const RoomCreation: React.FC<RoomCreationProps> = ({
  currentUser,
  onClose,
  onCreate,
}) => {
  const [roomName, setRoomName] = useState('');
  const [tier, setTier] = useState<RoomTier>('free');
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPremiumUser = currentUser.subscriptionStatus === 'premium';
  const canCreatePremium = isPremiumUser;

  const handleCreate = async () => {
    if (!roomName.trim()) {
      setError('Please enter a room name');
      return;
    }

    if (tier === 'premium' && !canCreatePremium) {
      setError('Premium subscription required for premium rooms');
      return;
    }

    setCreating(true);
    setError(null);

    const response = await apiService.createRoom(roomName.trim(), tier, isPublic);

    if (response.data?.room) {
      onCreate(response.data.room.id);
    } else {
      setError(response.error || 'Failed to create room');
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Create New Room</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Room Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Room Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name..."
              maxLength={50}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Room Tier */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Room Tier
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTier('free')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  tier === 'free'
                    ? 'border-purple-500 bg-purple-900 bg-opacity-30'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="text-white font-semibold mb-1">Free</div>
                <div className="text-xs text-gray-400">
                  Basic features, open collaboration
                </div>
              </button>

              <button
                onClick={() => canCreatePremium && setTier('premium')}
                disabled={!canCreatePremium}
                className={`p-4 rounded-lg border-2 transition-all ${
                  tier === 'premium'
                    ? 'border-yellow-500 bg-yellow-900 bg-opacity-30'
                    : canCreatePremium
                    ? 'border-gray-600 bg-gray-700 hover:border-gray-500'
                    : 'border-gray-700 bg-gray-800 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-1 justify-center mb-1">
                  <span className="text-yellow-400">⭐</span>
                  <span className="text-white font-semibold">Premium</span>
                </div>
                <div className="text-xs text-gray-400">
                  Advanced controls & permissions
                </div>
                {!canCreatePremium && (
                  <div className="text-xs text-red-400 mt-2">
                    Requires premium subscription
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Privacy Setting */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Privacy
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className="mr-2"
                />
                <span className="text-white">Public</span>
                <span className="text-xs text-gray-400 ml-2">
                  Anyone can join
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className="mr-2"
                />
                <span className="text-white">Private</span>
                <span className="text-xs text-gray-400 ml-2">
                  Invite only
                </span>
              </label>
            </div>
          </div>

          {/* Premium Features Preview */}
          {tier === 'premium' && (
            <div className="bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded-lg p-4">
              <h4 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
                <span>⭐</span>
                Premium Features
              </h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Granular permission controls</li>
                <li>• Advanced role management</li>
                <li>• Member-only playback controls</li>
                <li>• Better moderation tools</li>
                <li>• Private room support</li>
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            disabled={creating}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !roomName.trim()}
            className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              tier === 'premium'
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {creating ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      </div>
    </div>
  );
};
