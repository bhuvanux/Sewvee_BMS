import OpenAI from "openai";
import * as FileSystem from 'expo-file-system/legacy';

// NOTE: The API key will be provided by the user. 
// For now, using a placeholder.
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || "";

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

export const transcribeAudioWithWhisper = async (uri: string): Promise<string> => {
    try {
        // 1. Handle URI correctly for reading
        const cleanUri = uri.startsWith('file://') ? uri : `file://${uri}`;

        // Whisper API requires a Move/Copy to a file with a supported extension if not already
        const extension = uri.split('.').pop()?.toLowerCase();
        let finalUri = cleanUri;

        // Whisper supports: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm
        const supportedExtensions = ['flac', 'mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'ogg', 'wav', 'webm'];

        if (!extension || !supportedExtensions.includes(extension)) {
            // Create a temporary m4a file for Whisper
            const tempUri = `${FileSystem.cacheDirectory}whisper_temp_${Date.now()}.m4a`;
            await FileSystem.copyAsync({
                from: cleanUri,
                to: tempUri
            });
            finalUri = tempUri;
        }



        const formattedFile = {
            uri: finalUri,
            name: `audio.${extension || 'm4a'}`,
            type: extension === 'mp3' ? 'audio/mpeg' : 'audio/mp4' // Basic map
        };

        const formData = new FormData();
        // @ts-ignore
        formData.append('file', formattedFile);
        formData.append('model', 'whisper-1');
        formData.append('temperature', '0.2');
        // "Golden Prompt": Simulates a perfect previous segment to guide the model's style and terminology
        // Explicitly includes Tamil, Hindi, Malayalam tailoring terms to prime the model for code-switching
        formData.append('prompt', "Start: Customer measurements. Blouse Length 14.5, Waist 32, Chest 36. Instructions: Deep round neck, lining required. Hindi: Thoda loose rakhna arms pe. Tamil: Kai irakkam 6, Neck akalam 3. Malayalam: Kayyi 5 inch, Thayal venda. Terminology: Piping, Pleats, Dart, Hem, Stitch. Next: ");

        // NOTE: Do NOT manually set 'Content-Type': 'multipart/form-data'. 
        // React Native fetch will generate the boundary automatically.
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: formData
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("OpenAI Error Response:", errText);
            throw new Error(`OpenAI API Failed: ${response.status} - ${errText}`);
        }

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error.message || "OpenAI API Error");
        }

        return result.text || "";

    } catch (error: any) {
        console.error("OpenAI Whisper Error:", error);

        if (error.message && error.message.includes("401")) {
            throw new Error("Invalid OpenAI API Key.");
        }

        throw new Error(error.message || "Failed to transcribe with Whisper.");
    }
};
