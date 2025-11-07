import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { SendIcon } from './icons';
import AvatarSelector from './AvatarSelector';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


interface ChatProps {
    onNewUserMessage: (message: string) => void;
    messages: Message[];
    isLoading: boolean;
}

const Chat: React.FC<ChatProps> = ({ onNewUserMessage, messages, isLoading }) => {
    const [input, setInput] = useState('');
    const [showAvatarSelector, setShowAvatarSelector] = useState(false);
    const [userAvatar, setUserAvatar] = useState(() => {
        return localStorage.getItem('userAvatar') || 'https://i.pravatar.cc/150?u=me';
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    useEffect(() => {
        localStorage.setItem('userAvatar', userAvatar);
    }, [userAvatar]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onNewUserMessage(input);
            setInput('');
        }
    };
    
    const handleSelectAvatar = (avatarUrl: string) => {
        setUserAvatar(avatarUrl);
        setShowAvatarSelector(false);
    };

    return (
        <div className="flex flex-col h-full bg-gray-800 rounded-lg shadow-lg border border-gray-700">
            {showAvatarSelector && (
                <AvatarSelector onSelectAvatar={handleSelectAvatar} onClose={() => setShowAvatarSelector(false)} />
            )}
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex items-start gap-3 ${msg.author === 'user' ? 'justify-end' : ''}`}>
                            {msg.author === 'ai' && <img src={msg.avatar} alt="AI Avatar" className="w-10 h-10 rounded-full" />}
                            <div className={`p-3 rounded-xl max-w-lg ${msg.author === 'user' ? 'bg-cyan-600 text-white' : 'bg-gray-700'}`}>
                                <div className="prose prose-sm prose-invert max-w-none">
                                    <Markdown remarkPlugins={[remarkGfm]}>{msg.text}</Markdown>
                                </div>
                            </div>
                            {msg.author === 'user' && (
                                <img src={userAvatar} alt="User Avatar" className="w-10 h-10 rounded-full" />
                            )}
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-start gap-3">
                             <img src="/ai-avatar.png" alt="AI Avatar" className="w-10 h-10 rounded-full" />
                             <div className="p-3 rounded-xl bg-gray-700">
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse [animation-delay:0.2s]"></div>
                                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse [animation-delay:0.4s]"></div>
                                </div>
                             </div>
                         </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 flex items-center gap-3">
                <button 
                    type="button" 
                    onClick={() => setShowAvatarSelector(true)}
                    className="flex-shrink-0 rounded-full w-10 h-10 overflow-hidden border-2 border-gray-600 hover:border-cyan-500 transition-colors focus:outline-none"
                    aria-label="Change user avatar"
                >
                    <img src={userAvatar} alt="Your current avatar" className="w-full h-full object-cover" />
                </button>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask for music or video recommendations..."
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="bg-cyan-600 text-white rounded-full p-2.5 disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-cyan-500 transition-colors"
                    disabled={isLoading || !input.trim()}
                    aria-label="Send message"
                >
                    <SendIcon className="w-6 h-6" />
                </button>
            </form>
        </div>
    );
};

export default Chat;
