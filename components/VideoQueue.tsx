
import React from 'react';
import { Video } from '../types';
import { PlayIcon, TrashIcon } from './icons';

interface VideoQueueProps {
    queue: Video[];
    currentVideoId: string | null;
    onSelectVideo: (videoId: string) => void;
    onRemoveVideo: (videoId: string) => void;
    onClearQueue: () => void;
}

const VideoQueue: React.FC<VideoQueueProps> = ({ queue, currentVideoId, onSelectVideo, onRemoveVideo, onClearQueue }) => {
    return (
        <div className="flex flex-col h-full bg-gray-800 rounded-lg shadow-lg border border-gray-700">
            <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-xl font-bold">Up Next</h2>
                {queue.length > 0 && (
                    <button onClick={onClearQueue} className="text-sm text-gray-400 hover:text-white transition-colors">
                        Clear All
                    </button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto">
                {queue.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center text-gray-500 p-4">
                        <p>Your queue is empty. <br /> Use search or ask the AI for recommendations!</p>
                    </div>
                ) : (
                    <ul>
                        {queue.map((video) => (
                            <li
                                key={video.url}
                                className={`flex items-center gap-3 p-3 transition-colors ${currentVideoId === video.url ? 'bg-cyan-900/50' : 'hover:bg-gray-700/50'}`}
                            >
                                <div className="relative flex-shrink-0 cursor-pointer" onClick={() => onSelectVideo(video.url)}>
                                    <img src={`https://img.youtube.com/vi/${video.url}/default.jpg`} alt={video.title} className="w-24 h-16 object-cover rounded" />
                                    {currentVideoId !== video.url && (
                                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                            <PlayIcon className="w-8 h-8 text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-semibold truncate ${currentVideoId === video.url ? 'text-cyan-400' : 'text-white'}`}>{video.title}</p>
                                </div>
                                <button
                                    onClick={() => onRemoveVideo(video.url)}
                                    className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                                    aria-label={`Remove ${video.title} from queue`}
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
