import React, { useState } from 'react';
import { getRecommendations } from '../services/geminiService';
import { Message, Video } from '../types';
import Chat from './Chat';

interface AIGuruProps {
    onNewVideos: (videos: Video[]) => void;
}

// Simple regex to find YouTube links in markdown
const YOUTUBE_REGEX = /\[([^\]]+)\]\((https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)[^\)]*)\)/g;

const AIGuru: React.FC<AIGuruProps> = ({ onNewVideos }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            author: 'ai',
            text: "Welcome to your Media Room! Use the search bar above to find specific videos, or ask me for recommendations like 'upbeat electronic music' or 'videos similar to...' and I'll fill your queue!",
            avatar: '/ai-avatar.png'
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    const parseVideosFromMarkdown = (markdown: string): Video[] => {
        const videos: Video[] = [];
        let match;
        // Create a new regex object for each call to avoid issues with the 'g' flag state
        const regex = new RegExp(YOUTUBE_REGEX);
        while ((match = regex.exec(markdown)) !== null) {
            videos.push({
                title: match[1],
                url: match[3], // The video ID
            });
        }
        return videos;
    };

    const handleNewUserMessage = async (text: string) => {
        const newUserMessage: Message = {
            id: Date.now(),
            author: 'user',
            text: text,
            avatar: '' // User avatar is managed inside Chat component
        };

        setMessages(prev => [...prev, newUserMessage]);
        setIsLoading(true);

        const aiResponseText = await getRecommendations(text);
        
        const newAiMessage: Message = {
            id: Date.now() + 1,
            author: 'ai',
            text: aiResponseText,
            avatar: '/ai-avatar.png'
        };

        setMessages(prev => [...prev, newAiMessage]);
        setIsLoading(false);

        const newVideos = parseVideosFromMarkdown(aiResponseText);
        if (newVideos.length > 0) {
            onNewVideos(newVideos);
        }
    };

    return (
        <Chat 
            messages={messages}
            onNewUserMessage={handleNewUserMessage}
            isLoading={isLoading}
        />
    );
};

export default AIGuru;
