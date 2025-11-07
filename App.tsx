
import React, { useState, useEffect } from 'react';
import { User, Video } from './types';
import { searchYouTube } from './services/geminiService';
import VideoPlayer from './components/VideoPlayer';
import SearchBar from './components/SearchBar';
import RoomManager from './components/RoomManager';
import Toast from './components/Toast';

interface AppProps {
    user: User;
    onLogout: () => void;
}

const App: React.FC<AppProps> = ({ user, onLogout }) => {
    // State Management
    const [queue, setQueue] = useState<Video[]>(() => {
        const savedQueue = localStorage.getItem('videoQueue');
        return savedQueue ? JSON.parse(savedQueue) : [];
    });
    const [currentVideoId, setCurrentVideoId] = useState<string | null>(() => {
        return localStorage.getItem('currentVideoId') || (queue.length > 0 ? queue[0].url : null);
    });
    const [searchResults, setSearchResults] = useState<Video[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Persist queue and current video to localStorage
    useEffect(() => {
        localStorage.setItem('videoQueue', JSON.stringify(queue));
    }, [queue]);

    useEffect(() => {
        if (currentVideoId) {
            localStorage.setItem('currentVideoId', currentVideoId);
        } else {
            localStorage.removeItem('currentVideoId');
        }
    }, [currentVideoId]);
    
    // Simple regex to find YouTube links in markdown
    const YOUTUBE_REGEX = /\[([^\]]+)\]\((https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)[^\)]*)\)/g;

    const parseVideosFromMarkdown = (markdown: string): Video[] => {
        const videos: Video[] = [];
        let match;
        const regex = new RegExp(YOUTUBE_REGEX); // Reset regex state
        while ((match = regex.exec(markdown)) !== null) {
            videos.push({
                title: match[1].trim(),
                url: match[3],
            });
        }
        return videos;
    };

    // Handlers
    const handleSearch = async (query: string) => {
        if (!query.trim()) return;
        setIsSearching(true);
        setShowSearchResults(true);
        setSearchResults([]);
        
        const response = await searchYouTube(query);
        const videos = parseVideosFromMarkdown(response);
        
        setSearchResults(videos);
        setIsSearching(false);
    };

    const handleAddVideo = (video: Video) => {
        if (!queue.find(v => v.url === video.url)) {
            const newQueue = [...queue, video];
            setQueue(newQueue);
            setToastMessage(`Added "${video.title}" to queue.`);
            if (!currentVideoId) {
                setCurrentVideoId(video.url);
            }
        } else {
             setToastMessage(`"${video.title}" is already in the queue.`);
        }
        setShowSearchResults(false);
    };

    const handleNewVideosFromAI = (videos: Video[]) => {
        const videosToAdd = videos.filter(newVideo => !queue.some(qVideo => qVideo.url === newVideo.url));
        if (videosToAdd.length > 0) {
            const newQueue = [...queue, ...videosToAdd];
            setQueue(newQueue);
            setToastMessage(`Added ${videosToAdd.length} new items to your queue.`);
            if (!currentVideoId && newQueue.length > 0) {
                setCurrentVideoId(newQueue[0].url);
            }
        }
    };

    const handleSelectVideo = (videoId: string) => {
        setCurrentVideoId(videoId);
    };

    const handleRemoveVideo = (videoId: string) => {
        const newQueue = queue.filter(v => v.url !== videoId);
        setQueue(newQueue);
        if (currentVideoId === videoId) {
            setCurrentVideoId(newQueue.length > 0 ? newQueue[0].url : null);
        }
    };

    const handleClearQueue = () => {
        setQueue([]);
        setCurrentVideoId(null);
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen flex flex-col font-sans">
            <header className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 gap-4">
                <div className="text-xl font-bold whitespace-nowrap">
                    <span className="text-cyan-400">AI</span> Media Room
                </div>
                <SearchBar
                    onSearch={handleSearch}
                    isLoading={isSearching}
                    results={searchResults}
                    showResults={showSearchResults}
                    onCloseResults={() => setShowSearchResults(false)}
                    onAddVideo={handleAddVideo}
                />
                <div className="flex items-center gap-4">
                    <span className="hidden md:inline whitespace-nowrap">Welcome, {user.username}</span>
                    <button
                        onClick={onLogout}
                        className="bg-gray-700 hover:bg-red-600 transition-colors px-4 py-2 rounded-md text-sm font-semibold"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 p-6 overflow-hidden">
                <div className="md:col-span-2 min-h-0">
                    <VideoPlayer videoId={currentVideoId} />
                </div>
                <div className="md:col-span-1 min-h-0">
                    <RoomManager
                        queue={queue}
                        currentVideoId={currentVideoId}
                        onSelectVideo={handleSelectVideo}
                        onRemoveVideo={handleRemoveVideo}
                        onClearQueue={handleClearQueue}
                        onNewVideos={handleNewVideosFromAI}
                    />
                </div>
            </main>
            
            {toastMessage && (
                <Toast message={toastMessage} onClose={() => setToastMessage('')} />
            )}
        </div>
    );
};

export default App;
