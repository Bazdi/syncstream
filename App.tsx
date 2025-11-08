
import React, { useState, useEffect } from 'react';
import { User, Video, Room, QueueItem, RoomPermissions, Role, PermissionLevel, RoomMember } from './types';
import { apiService } from './services/api';
import { socketService } from './services/socket';
import VideoPlayer from './components/VideoPlayer';
import SearchBar from './components/SearchBar';
import RoomManager from './components/RoomManager';
import Toast from './components/Toast';
import { RoomCreation } from './components/RoomCreation';
import { RoomSettings } from './components/RoomSettings';
import { MemberList } from './components/MemberList';

interface AppProps {
    user: User;
    onLogout: () => void;
}

const App: React.FC<AppProps> = ({ user, onLogout }) => {
    // Room State
    const [rooms, setRooms] = useState<Room[]>([]);
    const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
    const [roomPermissions, setRoomPermissions] = useState<RoomPermissions | null>(null);
    const [userRole, setUserRole] = useState<Role | null>(null);
    const [showRoomCreation, setShowRoomCreation] = useState(false);
    const [showRoomSettings, setShowRoomSettings] = useState(false);
    const [showMemberList, setShowMemberList] = useState(false);

    // Video State
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<Video[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Initialize socket connection
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            socketService.connect(token);
        }

        return () => {
            socketService.disconnect();
        };
    }, []);

    // Load user's rooms on mount
    useEffect(() => {
        loadRooms();
    }, []);

    // Join room and setup socket listeners
    useEffect(() => {
        if (!currentRoom) return;

        socketService.joinRoom(currentRoom.id);
        loadRoomData();

        // Socket event listeners
        socketService.onRoomState((state) => {
            setCurrentVideoId(state.currentVideoId);
            // Queue is updated separately via queue_updated event
        });

        socketService.onQueueUpdated((data) => {
            loadQueue();
        });

        socketService.onError((data) => {
            setToastMessage(data.message || 'Permission denied');
        });

        return () => {
            if (currentRoom) {
                socketService.leaveRoom(currentRoom.id);
            }
            socketService.off('room_state');
            socketService.off('queue_updated');
            socketService.off('error');
        };
    }, [currentRoom?.id]);

    const loadRooms = async () => {
        const response = await apiService.getUserRooms();
        if (response.data?.rooms) {
            setRooms(response.data.rooms);
            if (response.data.rooms.length > 0 && !currentRoom) {
                selectRoom(response.data.rooms[0].id);
            }
        }
    };

    const selectRoom = async (roomId: string) => {
        const response = await apiService.getRoom(roomId);
        if (response.data?.room) {
            setCurrentRoom(response.data.room);
        }
    };

    const loadRoomData = async () => {
        if (!currentRoom) return;

        // Load permissions
        const permResponse = await apiService.getRoomPermissions(currentRoom.id);
        if (permResponse.data?.permissions) {
            setRoomPermissions(permResponse.data.permissions);
        }

        // Load members to determine user role
        const memberResponse = await apiService.getRoomMembers(currentRoom.id);
        if (memberResponse.data?.members) {
            const currentMember = memberResponse.data.members.find(
                (m: RoomMember) => m.userId === user.id
            );
            if (currentMember) {
                setUserRole(currentMember.role);
            } else if (currentRoom.ownerId === user.id) {
                setUserRole('owner');
            }
        }

        // Load queue
        loadQueue();
    };

    const loadQueue = async () => {
        if (!currentRoom) return;
        const response = await apiService.getRoom(currentRoom.id);
        if (response.data?.room?.queue) {
            setQueue(response.data.room.queue);
        }
    };

    const canPerformAction = (permission: PermissionLevel): boolean => {
        if (!userRole || !roomPermissions) return false;

        const roleLevel: Record<Role, number> = {
            viewer: 0,
            member: 1,
            moderator: 2,
            owner: 3,
        };

        const permissionLevel: Record<PermissionLevel, number> = {
            everyone: 0,
            members: 1,
            moderators: 2,
            owner: 3,
        };

        return roleLevel[userRole] >= permissionLevel[permission];
    };

    // Simple regex to find YouTube links in markdown
    const YOUTUBE_REGEX = /\[([^\]]+)\]\((https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)[^\)]*)\)/g;

    const parseVideosFromMarkdown = (markdown: string): Video[] => {
        const videos: Video[] = [];
        let match;
        const regex = new RegExp(YOUTUBE_REGEX);
        while ((match = regex.exec(markdown)) !== null) {
            videos.push({
                title: match[1].trim(),
                url: match[3],
            });
        }
        return videos;
    };

    // Handlers
    const handleSearch = async (query: string, useAI: boolean) => {
        if (!query.trim()) return;
        setIsSearching(true);
        setShowSearchResults(true);
        setSearchResults([]);

        const response = await apiService.searchYouTube(query, 10, useAI);
        if (response.data?.videos) {
            const videos = response.data.videos.map((v: any) => ({
                title: v.title,
                url: v.videoId,
            }));
            setSearchResults(videos);
        }

        setIsSearching(false);
    };

    const handleAddVideo = (video: Video) => {
        if (!currentRoom) {
            setToastMessage('Please select a room first');
            return;
        }

        socketService.addToQueue(currentRoom.id, {
            videoId: video.url,
            videoTitle: video.title,
        });

        setToastMessage(`Added "${video.title}" to queue.`);
        setShowSearchResults(false);
    };

    const handleNewVideosFromAI = (videos: Video[]) => {
        if (!currentRoom) {
            setToastMessage('Please select a room first');
            return;
        }

        videos.forEach((video) => {
            socketService.addToQueue(currentRoom.id, {
                videoId: video.url,
                videoTitle: video.title,
            });
        });

        setToastMessage(`Added ${videos.length} new items to your queue.`);
    };

    const handleSelectVideo = (videoId: string) => {
        if (!currentRoom) return;
        socketService.changeVideo(currentRoom.id, videoId);
    };

    const handleRemoveVideo = (videoId: string) => {
        if (!currentRoom) return;
        socketService.removeFromQueue(currentRoom.id, videoId);
    };

    const handleClearQueue = () => {
        if (!currentRoom) return;
        socketService.updateQueue(currentRoom.id, []);
    };

    const handleCreateRoom = async (roomId: string) => {
        setShowRoomCreation(false);
        await loadRooms();
        selectRoom(roomId);
        setToastMessage('Room created successfully!');
    };

    // No room selected - show room selection UI
    if (!currentRoom) {
        return (
            <div className="bg-gray-900 text-white min-h-screen flex flex-col font-sans">
                <header className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div className="text-xl font-bold">
                        <span className="text-cyan-400">Sync</span>Stream
                    </div>
                    <div className="flex items-center gap-4">
                        <span>Welcome, {user.username}</span>
                        {user.subscriptionStatus === 'premium' && (
                            <span className="text-yellow-400">⭐ Premium</span>
                        )}
                        <button
                            onClick={onLogout}
                            className="bg-gray-700 hover:bg-red-600 transition-colors px-4 py-2 rounded-md text-sm font-semibold"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                <main className="flex-1 flex items-center justify-center p-6">
                    <div className="max-w-2xl w-full">
                        <h2 className="text-3xl font-bold mb-6 text-center">Your Rooms</h2>

                        <div className="grid gap-4 mb-6">
                            {rooms.map((room) => (
                                <div
                                    key={room.id}
                                    onClick={() => selectRoom(room.id)}
                                    className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 cursor-pointer transition-colors border border-gray-700"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-semibold text-white">{room.name}</h3>
                                            <p className="text-sm text-gray-400 mt-1">
                                                {room.isPublic ? '🌍 Public' : '🔒 Private'} •{' '}
                                                {room.tier === 'premium' ? (
                                                    <span className="text-yellow-400">⭐ Premium</span>
                                                ) : (
                                                    <span>Free</span>
                                                )}
                                            </p>
                                        </div>
                                        <span className="text-sm text-gray-400">
                                            {room.ownerId === user.id ? '👑 Owner' : 'Member'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowRoomCreation(true)}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
                        >
                            + Create New Room
                        </button>
                    </div>
                </main>

                {showRoomCreation && (
                    <RoomCreation
                        currentUser={user}
                        onClose={() => setShowRoomCreation(false)}
                        onCreate={handleCreateRoom}
                    />
                )}

                {toastMessage && (
                    <Toast message={toastMessage} onClose={() => setToastMessage('')} />
                )}
            </div>
        );
    }

    // Room selected - show main app
    return (
        <div className="bg-gray-900 text-white min-h-screen flex flex-col font-sans">
            <header className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 gap-4">
                <div className="flex items-center gap-3">
                    <div className="text-xl font-bold whitespace-nowrap">
                        <span className="text-cyan-400">Sync</span>Stream
                    </div>
                    <div className="text-sm">
                        <div className="text-gray-300 font-semibold">{currentRoom.name}</div>
                        <div className="text-xs text-gray-400">
                            {currentRoom.tier === 'premium' && <span className="text-yellow-400">⭐ </span>}
                            {currentRoom.isPublic ? '🌍 Public' : '🔒 Private'}
                        </div>
                    </div>
                </div>

                <SearchBar
                    onSearch={handleSearch}
                    isLoading={isSearching}
                    results={searchResults}
                    showResults={showSearchResults}
                    onCloseResults={() => setShowSearchResults(false)}
                    onAddVideo={handleAddVideo}
                    canAddToQueue={roomPermissions ? canPerformAction(roomPermissions.canAddToQueue) : false}
                />

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowMemberList(true)}
                        className="bg-gray-700 hover:bg-gray-600 transition-colors px-3 py-2 rounded-md text-sm"
                        title="View members"
                    >
                        👥
                    </button>
                    <button
                        onClick={() => setShowRoomSettings(true)}
                        className="bg-gray-700 hover:bg-gray-600 transition-colors px-3 py-2 rounded-md text-sm"
                        title="Room settings"
                    >
                        ⚙️
                    </button>
                    <button
                        onClick={() => {
                            setCurrentRoom(null);
                            setQueue([]);
                            setCurrentVideoId(null);
                        }}
                        className="bg-gray-700 hover:bg-gray-600 transition-colors px-3 py-2 rounded-md text-sm"
                    >
                        Rooms
                    </button>
                    <button
                        onClick={onLogout}
                        className="bg-gray-700 hover:bg-red-600 transition-colors px-3 py-2 rounded-md text-sm font-semibold"
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
                        currentUser={user}
                        canRemoveFromQueue={roomPermissions ? canPerformAction(roomPermissions.canRemoveFromQueue) : false}
                        canClearQueue={roomPermissions ? canPerformAction(roomPermissions.canClearQueue) : false}
                        canChangeVideo={roomPermissions ? canPerformAction(roomPermissions.canChangeVideo) : false}
                        onSelectVideo={handleSelectVideo}
                        onRemoveVideo={handleRemoveVideo}
                        onClearQueue={handleClearQueue}
                        onNewVideos={handleNewVideosFromAI}
                    />
                </div>
            </main>

            {showRoomSettings && currentRoom && (
                <RoomSettings
                    room={currentRoom}
                    currentUser={user}
                    onClose={() => setShowRoomSettings(false)}
                    onUpdate={loadRoomData}
                />
            )}

            {showMemberList && currentRoom && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-white">Room Members</h2>
                            <button
                                onClick={() => setShowMemberList(false)}
                                className="text-gray-400 hover:text-white text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>
                        <MemberList
                            room={currentRoom}
                            currentUser={user}
                            onUpdate={loadRoomData}
                        />
                    </div>
                </div>
            )}

            {toastMessage && (
                <Toast message={toastMessage} onClose={() => setToastMessage('')} />
            )}
        </div>
    );
};

export default App;
