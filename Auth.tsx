import React, { useState, useEffect } from 'react';
import App from './App';
import LoginScreen from './components/LoginScreen';
import { User } from './types';
import { apiService } from './services/api';

const Auth: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for a user session in localStorage when the component mounts
        const storedUser = localStorage.getItem('currentUser');
        const storedToken = localStorage.getItem('auth_token');

        if (storedUser && storedToken) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                apiService.setToken(storedToken);
            } catch (error) {
                console.error('Failed to parse stored user:', error);
                // Clear invalid data
                localStorage.removeItem('currentUser');
                localStorage.removeItem('auth_token');
            }
        }

        setLoading(false);
    }, []);

    const handleLogin = (loggedInUser: User, token: string) => {
        setUser(loggedInUser);
        localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
        localStorage.setItem('auth_token', token);
        apiService.setToken(token);
    };

    const handleLogout = () => {
        setUser(null);
        // Clear all session-related data
        localStorage.removeItem('currentUser');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('userAvatar');
        apiService.clearToken();
        // Optionally clear the queue on logout as well
        // localStorage.removeItem('videoQueue');
        // localStorage.removeItem('currentVideoId');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    if (user) {
        return <App user={user} onLogout={handleLogout} />;
    } else {
        return <LoginScreen onLogin={handleLogin} />;
    }
};

export default Auth;
