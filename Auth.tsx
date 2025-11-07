import React, { useState, useEffect } from 'react';
import App from './App';
import LoginScreen from './components/LoginScreen';
import { User } from './types';

const Auth: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Check for a user session in localStorage when the component mounts
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogin = (loggedInUser: User) => {
        setUser(loggedInUser);
        localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
    };

    const handleLogout = () => {
        setUser(null);
        // Clear all session-related data
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userAvatar');
        // Optionally clear the queue on logout as well
        // localStorage.removeItem('videoQueue');
        // localStorage.removeItem('currentVideoId');
    };

    if (user) {
        return <App user={user} onLogout={handleLogout} />;
    } else {
        return <LoginScreen onLogin={handleLogin} />;
    }
};

export default Auth;
