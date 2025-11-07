import React from 'react';
import { XIcon } from './icons';

interface AvatarSelectorProps {
    onSelectAvatar: (avatarUrl: string) => void;
    onClose: () => void;
}

const AVATAR_SEEDS = [
    'me', 'alex', 'maria', 'sam', 'casey', 'jordan', 'taylor', 'morgan', 'drew',
    'riley', 'cameron', 'avery', 'kai', 'quinn', 'rowan', 'harper'
];

const avatars = AVATAR_SEEDS.map(seed => `https://i.pravatar.cc/150?u=${seed}`);

const AvatarSelector: React.FC<AvatarSelectorProps> = ({ onSelectAvatar, onClose }) => {
    return (
        <div 
            className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="avatar-selector-title"
        >
            <div 
                className="bg-gray-800 rounded-lg shadow-2xl p-6 border border-gray-700 w-full max-w-md relative"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 id="avatar-selector-title" className="text-xl font-bold">Choose Your Avatar</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close avatar selector">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {avatars.map((avatarUrl) => (
                        <button 
                            key={avatarUrl}
                            onClick={() => onSelectAvatar(avatarUrl)}
                            className="aspect-square rounded-full overflow-hidden border-2 border-transparent hover:border-cyan-400 focus:outline-none focus:border-cyan-400 transition-all duration-150 transform hover:scale-105"
                            aria-label={`Select avatar ${avatarUrl.split('u=')[1]}`}
                        >
                            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AvatarSelector;