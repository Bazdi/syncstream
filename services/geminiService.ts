import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.warn("Gemini API key not found in environment variables. The app may not function correctly.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const callGemini = async (systemInstruction: string, userQuery: string): Promise<string> => {
    if (!API_KEY) {
        return "API Key not configured. Please set up your environment variables.";
    }
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: userQuery,
            config: {
                systemInstruction: systemInstruction,
                thinkingConfig: {
                    thinkingBudget: 32768,
                },
            },
        });

        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            return `Error: Failed to get a response from the AI. ${error.message}`;
        }
        throw new Error("Failed to get a response from the AI.");
    }
};

export const getRecommendations = async (userQuery: string): Promise<string> => {
    const systemInstruction = `You are a recommendation expert for music and videos. A user will ask for recommendations based on an artist, genre, or title. Your task is to provide a curated list of similar content. For each recommendation, provide a brief reason why it's a good match. Respond in clear, well-formatted markdown. Include YouTube links for video recommendations where possible, in the format [Video Title](https://www.youtube.com/watch?v=VIDEO_ID).`;
    return callGemini(systemInstruction, userQuery);
};

export const searchYouTube = async (userQuery: string): Promise<string> => {
    const systemInstruction = `You are a YouTube search engine. A user will provide a search query. Your task is to return a list of 5 relevant YouTube videos. Respond ONLY with a markdown list of links in the format: [Video Title](https://www.youtube.com/watch?v=VIDEO_ID). Do not include any other text, headers, or explanations.`;
    return callGemini(systemInstruction, `Find YouTube videos for the query: "${userQuery}"`);
};
