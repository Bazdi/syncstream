
import React, { useState } from 'react';
import { QueueItem, User } from '../types';
import { PlayIcon, TrashIcon } from './icons';

interface VideoQueueProps {
    queue: QueueItem[];
    currentVideoId: string | null;
    currentUser: User | null;
    canRemoveFromQueue: boolean;
    canClearQueue: boolean;
    canChangeVideo: boolean;
    onSelectVideo: (videoId: string) => void;
    onRemoveVideo: (videoId: string) => void;
    onClearQueue: () => void;
}

const VideoQueue: React.FC<VideoQueueProps> = ({
    queue,
    currentVideoId,
    currentUser,
    canRemoveFromQueue,
    canClearQueue,
    canChangeVideo,
    onSelectVideo,
    onRemoveVideo,
    onClearQueue
}) => {
    const [permissionError, setPermissionError] = useState<string | null>(null);

    const handleRemoveVideo = (videoId: string) => {
        if (!canRemoveFromQueue) {
            setPermissionError('You do not have permission to remove videos from the queue');
            setTimeout(() => setPermissionError(null), 3000);
            return;
        }
        onRemoveVideo(videoId);
    };

    const handleClearQueue = () => {
        if (!canClearQueue) {
            setPermissionError('You do not have permission to clear the queue');
            setTimeout(() => setPermissionError(null), 3000);
            return;
        }
        onClearQueue();
    };

    const handleSelectVideo = (videoId: string) => {
        if (!canChangeVideo) {
            setPermissionError('You do not have permission to change videos');
            setTimeout(() => setPermissionError(null), 3000);
            return;
        }
        onSelectVideo(videoId);
    };

    return (
        <div className="flex flex-col h-full bg-gray-800 rounded-lg shadow-lg border border-gray-700">
            <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-xl font-bold">Up Next</h2>
                {queue.length > 0 && (
                    <button
                        onClick={handleClearQueue}
                        disabled={!canClearQueue}
                        className="text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={canClearQueue ? 'Clear all videos' : 'You do not have permission to clear the queue'}
                    >
                        Clear All
                    </button>
                )}
            </div>

            {permissionError && (
                <div className="mx-4 mt-3 bg-red-900 bg-opacity-30 border border-red-600 rounded-lg p-2">
                    <p className="text-red-400 text-sm">{permissionError}</p>
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                {queue.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center text-gray-500 p-4">
                        <p>Your queue is empty. <br /> Use search or ask the AI for recommendations!</p>
                    </div>
                ) : (
                    <ul>
                        {queue.map((item) => (
                            <li
                                key={item.id}
                                className={`flex items-center gap-3 p-3 transition-colors ${currentVideoId === item.videoId ? 'bg-cyan-900/50' : 'hover:bg-gray-700/50'}`}
                            >
                                <div
                                    className={`relative flex-shrink-0 ${canChangeVideo ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}
                                    onClick={() => handleSelectVideo(item.videoId)}
                                    title={canChangeVideo ? 'Play this video' : 'You do not have permission to change videos'}
                                >
                                    <img
                                        src={`https://img.youtube.com/vi/${item.videoId}/default.jpg`}
                                        alt={item.videoTitle}
                                        className="w-24 h-16 object-cover rounded"
                                    />
                                    {currentVideoId !== item.videoId && canChangeVideo && (
                                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                            <PlayIcon className="w-8 h-8 text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-semibold truncate ${currentVideoId === item.videoId ? 'text-cyan-400' : 'text-white'}`}>
                                        {item.videoTitle}
                                    </p>
                                    {item.addedByUser && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            Added by {item.addedByUser.username}
                                            {currentUser && item.addedBy === currentUser.id && ' (You)'}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleRemoveVideo(item.videoId)}
                                    disabled={!canRemoveFromQueue}
                                    className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label={`Remove ${item.videoTitle} from queue`}
                                    title={canRemoveFromQueue ? 'Remove from queue' : 'You do not have permission to remove videos'}
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default VideoQueue;
