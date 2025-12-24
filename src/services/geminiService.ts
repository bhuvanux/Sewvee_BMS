import { GoogleGenerativeAI } from "@google/generative-ai";
import * as FileSystem from 'expo-file-system';

// NOTE: in production, this key should be in an environment variable or fetched securely
const API_KEY = "AIzaSyDOGQxfBPXB1Khlhyci206FFnmema2ZLgw";

const genAI = new GoogleGenerativeAI(API_KEY);

export const transcribeAudio = async (uri: string): Promise<string> => {
    try {
        // 1. Read the audio file as base64
        const base64Audio = await FileSystem.readAsStringAsync(uri, {
            encoding: 'base64',
        });

        // Determine MIME type
        const extension = uri.split('.').pop()?.toLowerCase();
        let mimeType = "audio/mp4"; // Default
        if (extension === "mp3") mimeType = "audio/mp3";
        else if (extension === "wav") mimeType = "audio/wav";
        else if (extension === "aac") mimeType = "audio/aac";
        else if (extension === "m4a") mimeType = "audio/m4a";
        // Gemini supports: wav, mp3, aiff, aac, ogg, flac. mp4/m4a are usually supported as audio/mp4 or audio/m4a.

        console.log(`Transcribing ${uri} (${mimeType})...`);

        // 2. Initialize the model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 3. Generate content
        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Audio
                }
            },
            { text: "Transcribe this audio strictly. Return ONLY the text." },
        ]);

        const response = await result.response;
        const text = response.text();
        return text.trim();

    } catch (error: any) {
        console.error("Transcription Error Full:", error);
        throw new Error(error.message || "API Error");
    }
};
