import React, { useState } from 'react';
import { User } from '../types';
import { UserIcon, AtSymbolIcon } from './icons';

interface LoginScreenProps {
    onLogin: (user: User) => void;
}

type FormMode = 'login' | 'register';

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [mode, setMode] = useState<FormMode>('login');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you'd have validation and an API call here.
        // For this simulation, we just log the user in.
        const userToLogin: User = {
            username: mode === 'register' ? (username.trim() || 'Anonymous') : 'Guest',
            email: email,
        };
        onLogin(userToLogin);
    };
    
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
             <div className="w-full max-w-md">
                <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-2">Welcome to AI Media Room</h1>
                <p className="text-gray-400 text-center mb-8">Watch, chat, and get recommendations with AI.</p>

                <div className="bg-gray-800 rounded-lg shadow-2xl p-8 border border-gray-700">
                    <div className="flex border-b border-gray-700 mb-6">
                        <button 
                            onClick={() => setMode('login')}
                            className={`flex-1 py-2 text-center font-semibold transition-colors ${mode === 'login' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}
                        >
                            Login
                        </button>
                        <button 
                            onClick={() => setMode('register')}
                            className={`flex-1 py-2 text-center font-semibold transition-colors ${mode === 'register' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}
                        >
                            Register
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {mode === 'register' && (
                             <div>
                                <label htmlFor="username" className="text-sm font-medium text-gray-300 sr-only">Username</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <UserIcon className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Choose a username"
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        required
                                    />
                                </div>
                            </div>
                        )}
                        <div>
                            <label htmlFor="email" className="text-sm font-medium text-gray-300 sr-only">Email</label>
                             <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <AtSymbolIcon className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    required
                                />
                            </div>
                        </div>
                         <div>
                            <label htmlFor="password"className="text-sm font-medium text-gray-300 sr-only">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
                        >
                            {mode === 'login' ? 'Log In' : 'Create Account'}
                        </button>
                    </form>
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                           This is a frontend simulation. No data is sent to a server.
                        </p>
                    </div>
                </div>
             </div>
        </div>
    );
};

export default LoginScreen;
