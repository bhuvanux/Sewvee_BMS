import { GoogleGenerativeAI } from "@google/generative-ai";
import * as FileSystem from 'expo-file-system/legacy';

// NOTE: in production, this key should be in an environment variable or fetched securely
const API_KEY = "AIzaSyDOGQxfBPXB1Khlhyci206FFnmema2ZLgw";

const genAI = new GoogleGenerativeAI(API_KEY);

export const transcribeAudio = async (uri: string): Promise<string> => {
    try {
        // 1. Handle URI correctly for reading
        const cleanUri = uri.startsWith('file://') ? uri : `file://${uri}`;

        // 2. Read the audio file as base64
        const base64Audio = await FileSystem.readAsStringAsync(cleanUri, {
            encoding: 'base64',
        });

        if (!base64Audio) {
            throw new Error("Audio data is empty or corrupted");
        }

        // 3. Determine MIME type
        const extension = uri.split('.').pop()?.toLowerCase();
        let mimeType = "audio/mp4"; // Default for Expo recordings on many devices

        switch (extension) {
            case 'mp3': mimeType = "audio/mpeg"; break;
            case 'wav': mimeType = "audio/wav"; break;
            case 'aac': mimeType = "audio/aac"; break;
            case 'm4a': mimeType = "audio/mp4"; break;
            case 'ogg': mimeType = "audio/ogg"; break;
            case 'flac': mimeType = "audio/flac"; break;
            default: mimeType = "audio/mp4";
        }

        console.log(`Transcribing ${cleanUri} as ${mimeType}... (Size: ${Math.round(base64Audio.length / 1024)} KB)`);

        // 4. Initialize the model (using stable v1 for reliability)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: "v1" });

        // 5. Generate content
        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Audio
                }
            },
            { text: "Transcribe this audio strictly. Return ONLY the transcribed text. If there is no speech, return an empty string. The audio might be in English or local Indian languages." },
        ]);

        const response = await result.response;
        const text = response.text();
        return text.trim();

    } catch (error: any) {
        console.error("Gemini Transcription Error:", error);

        // Provide user-friendly errors
        if (error.message?.includes('403')) {
            throw new Error("Access forbidden. Please check API key/permissions.");
        } else if (error.message?.includes('429')) {
            throw new Error("Too many requests. Please wait a moment.");
        } else if (error.message?.includes('Network request failed')) {
            throw new Error("Network error. Please check your internet.");
        }

        throw new Error(error.message || "Failed to process audio");
    }
};
