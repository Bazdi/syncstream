
import React, { useState } from 'react';
import VideoQueue from './VideoQueue';
import AIGuru from './AIGuru';
import { Video, QueueItem, User } from '../types';

interface RoomManagerProps {
    queue: QueueItem[];
    currentVideoId: string | null;
    currentUser: User | null;
    canRemoveFromQueue: boolean;
    canClearQueue: boolean;
    canChangeVideo: boolean;
    onSelectVideo: (videoId: string) => void;
    onRemoveVideo: (videoId: string) => void;
    onClearQueue: () => void;
    onNewVideos: (videos: Video[]) => void;
}

type ActiveTab = 'queue' | 'ai';

const RoomManager: React.FC<RoomManagerProps> = (props) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('ai');

    return (
        <div className="flex flex-col h-full max-h-[90vh] md:max-h-full">
            <div className="flex border-b border-gray-700 flex-shrink-0">
                <button
                    onClick={() => setActiveTab('ai')}
                    className={`flex-1 py-2 text-center font-semibold transition-colors ${activeTab === 'ai' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-gray-800' : 'text-gray-400 hover:text-white bg-gray-900'}`}
                >
                    AI Guru
                </button>
                <button
                    onClick={() => setActiveTab('queue')}
                    className={`flex-1 py-2 text-center font-semibold transition-colors ${activeTab === 'queue' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-gray-800' : 'text-gray-400 hover:text-white bg-gray-900'}`}
                >
                    Queue ({props.queue.length})
                </button>
            </div>
            <div className="flex-1 min-h-0">
                {activeTab === 'ai' && (
                    <AIGuru onNewVideos={props.onNewVideos} />
                )}
                {activeTab === 'queue' && (
                    <VideoQueue
                        queue={props.queue}
                        currentVideoId={props.currentVideoId}
                        currentUser={props.currentUser}
                        canRemoveFromQueue={props.canRemoveFromQueue}
                        canClearQueue={props.canClearQueue}
                        canChangeVideo={props.canChangeVideo}
                        onSelectVideo={props.onSelectVideo}
                        onRemoveVideo={props.onRemoveVideo}
                        onClearQueue={props.onClearQueue}
                    />
                )}
            </div>
        </div>
    );
};

export default RoomManager;
