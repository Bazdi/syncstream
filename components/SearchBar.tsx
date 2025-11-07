import React, { useState, useRef, useEffect } from 'react';
import { Video } from '../types';
import { SearchIcon, XIcon } from './icons';

interface SearchBarProps {
    onSearch: (query: string) => void;
    isLoading: boolean;
    results: Video[];
    showResults: boolean;
    onCloseResults: () => void;
    onAddVideo: (video: Video) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading, results, showResults, onCloseResults, onAddVideo }) => {
    const [query, setQuery] = useState('');
    const searchRef = useRef<HTMLDivElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query);
    };
    
    // Close results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                onCloseResults();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onCloseResults]);

    return (
        <div className="relative w-full max-w-lg mx-auto" ref={searchRef}>
            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search YouTube with AI..."
                    className="w-full bg-gray-700 border border-gray-600 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="w-5 h-5 text-gray-400" />
                </div>
            </form>
            {showResults && (
                <div className="absolute top-full mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-gray-400">Searching...</div>
                    ) : (
                        <div>
                             <div className="flex justify-between items-center p-2 border-b border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-300 px-2">Search Results</h3>
                                <button onClick={onCloseResults} className="p-1 rounded-full hover:bg-gray-700">
                                    <XIcon className="w-4 h-4"/>
                                </button>
                            </div>
                            {results.length > 0 ? (
                                <ul>
                                    {results.map(video => (
                                        <li key={video.url} className="p-3 hover:bg-gray-700/50 flex items-center gap-3 cursor-pointer" onClick={() => onAddVideo(video)}>
                                            <img src={`https://img.youtube.com/vi/${video.url}/default.jpg`} alt={video.title} className="w-16 h-12 object-cover rounded" />
                                            <span className="flex-1 truncate">{video.title}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-4 text-center text-gray-400">No results found.</div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
