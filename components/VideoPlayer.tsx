
import React, { useEffect, useRef, useState } from 'react';
import { VideoCameraIcon } from './icons';
import { SkipSegment } from '../types';

// Fix: Add minimal type declarations for the YouTube Iframe Player API to resolve YT namespace errors.
declare namespace YT {
    enum PlayerState {
        PLAYING = 1,
    }
    interface Player {
        destroy(): void;
        getPlayerState(): PlayerState;
        getCurrentTime(): number;
        seekTo(seconds: number, allowSeekAhead: boolean): void;
        playVideo(): void;
    }
    interface PlayerEvent {
        target: Player;
    }
}

interface VideoPlayerProps {
  videoId: string | null;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId }) => {
    const playerRef = useRef<YT.Player | null>(null);
    const timeCheckIntervalRef = useRef<number | null>(null);
    const [segments, setSegments] = useState<SkipSegment[]>([]);
    // Fix: Use a ref to hold the latest segments to avoid stale closure in setInterval
    const segmentsRef = useRef<SkipSegment[]>([]);
    segmentsRef.current = segments;

    const cleanup = () => {
        if (timeCheckIntervalRef.current) {
            clearInterval(timeCheckIntervalRef.current);
            timeCheckIntervalRef.current = null;
        }
        if (playerRef.current) {
            // Catch potential errors if the player is already gone
            try {
                 playerRef.current.destroy();
            } catch (error) {
                console.warn("Error destroying YouTube player:", error);
            }
            playerRef.current = null;
        }
         // Ensure the target div is empty for the next player instance
        const playerElement = document.getElementById('youtube-player');
        if (playerElement) {
            playerElement.innerHTML = '';
        }
    };

    useEffect(() => {
        cleanup();

        if (!videoId) {
            setSegments([]);
            return;
        }

        const fetchSegments = async () => {
            try {
                // Fetch all skippable categories from SponsorBlock
                const categories = ["sponsor", "selfpromo", "interaction", "intro", "outro", "preview", "music_offtopic"];
                const response = await fetch(`https://sponsor.ajay.app/api/skipSegments?videoID=${videoId}&categories=${JSON.stringify(categories)}`);
                if (response.ok) {
                    const data: SkipSegment[] = await response.json();
                    if(data.length > 0) {
                      setSegments(data);
                      console.log(`SponsorBlock: Loaded ${data.length} segments for video ${videoId}`);
                    } else {
                      setSegments([]);
                    }
                } else {
                     setSegments([]);
                }
            } catch (error) {
                console.error("SponsorBlock: Failed to fetch segments", error);
                setSegments([]);
            }
        };

        fetchSegments();

        const onPlayerReady = (event: YT.PlayerEvent) => {
            event.target.playVideo();

            if (timeCheckIntervalRef.current) clearInterval(timeCheckIntervalRef.current);

            timeCheckIntervalRef.current = window.setInterval(() => {
                if (playerRef.current && playerRef.current.getPlayerState() === YT.PlayerState.PLAYING) {
                    const currentTime = playerRef.current.getCurrentTime();
                    // Fix: Use ref to get latest segments and avoid stale closure
                    for (const segment of segmentsRef.current) {
                        if (currentTime > segment.segment[0] && currentTime < segment.segment[1]) {
                            playerRef.current.seekTo(segment.segment[1], true);
                            console.log(`SponsorBlock: Skipped segment '${segment.category}'`);
                            break;
                        }
                    }
                }
            }, 250);
        };
        
        const createPlayer = () => {
             // Ensure the target div is present before creating a player
            if (!document.getElementById('youtube-player')) {
                return;
            }
            playerRef.current = new (window as any).YT.Player('youtube-player', {
                videoId: videoId,
                playerVars: {
                    autoplay: 1,
                    controls: 1,
                    'origin': window.location.origin,
                },
                host: 'https://www.youtube-nocookie.com',
                events: {
                    'onReady': onPlayerReady,
                }
            });
        };

        if (!(window as any).YT || !(window as any).YT.Player) {
            (window as any).onYouTubeIframeAPIReady = createPlayer;
        } else {
            createPlayer();
        }

        return cleanup;

    // Fix: Remove `segments` from dependency array to prevent re-creating the player on fetch
    }, [videoId]);
    
    return (
        <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-gray-700 relative h-full">
             <div id="youtube-player" className="w-full h-full"></div>
            {!videoId && (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black">
                    <div className="text-center text-gray-500 p-4">
                        <VideoCameraIcon className="w-24 h-24 mx-auto mb-4 text-gray-600" />
                        <h3 className="text-xl font-bold text-gray-300">Your Media Player</h3>
                        <p>Select a video from the queue or use the search bar to get started.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;
