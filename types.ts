
export interface Video {
    title: string;
    url: string; // This is the YouTube video ID
}

export interface Message {
    id: number | string;
    author: 'user' | 'ai';
    text: string;
    avatar: string;
}

// From SponsorBlock API
export interface SkipSegment {
    category: string;
    segment: [number, number];
    UUID: string;
}

export interface User {
    username: string;
    email: string;
}
