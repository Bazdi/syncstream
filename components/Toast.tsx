import React, { useEffect, useState } from 'react';

interface ToastProps {
    message: string;
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 3000 }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                // Allow time for fade-out animation before calling onClose
                setTimeout(onClose, 300); 
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [message, duration, onClose]);

    return (
        <div 
            className={`fixed bottom-5 right-5 bg-cyan-600 text-white py-2 px-4 rounded-lg shadow-lg transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            role="alert"
        >
            {message}
        </div>
    );
};

export default Toast;
