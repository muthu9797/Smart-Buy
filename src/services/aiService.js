import { GoogleGenerativeAI } from '@google/generative-ai';
const FileSystem = require("expo-file-system/legacy");
import { AI_CONFIG } from '../config/aiConfig';

let genAI = null;
let model = null;

const initializeAI = async () => {
    if (AI_CONFIG.apiKey === 'YOUR_API_KEY_HERE') {
        console.warn('Gemini API Key is missing. Please update src/config/aiConfig.js');
        return false;
    }

    try {
        if (!genAI) {
            genAI = new GoogleGenerativeAI(AI_CONFIG.apiKey);
            // Use Gemini 2.5 Flash (Newest Stable)
            model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        }
        return true;
    } catch (error) {
        console.error('Failed to initialize Gemini AI:', error);
        return false;
    }
};

export const getGrocerySuggestions = async (query) => {
    if (!query || query.length < 2) return [];

    if (!initializeAI()) {
        return [];
    }

    try {
        const prompt = `You are a grocery shopping assistant. The user is typing "${query}". 
        Suggest 5 common grocery items that start with or are related to "${query}". 
        Return ONLY a JSON array of strings. Do not include markdown formatting or "json" prefix.
        Example output: ["Milk", "Milk Chocolate", "Almond Milk"]`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up response if it contains markdown code blocks
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const suggestions = JSON.parse(cleanedText);

        // Map to expected format with emoji (we can optionally ask AI for emojis too, but let's keep it simple for now or use local matching)
        // Let's ask AI for emojis to be cooler
        return suggestions;
    } catch (error) {
        console.error('Gemini suggestion error:', error);
        return [];
    }
};

export const getSmartSuggestions = async (query) => {
    if (!query || query.length < 2) return [];

    if (!initializeAI()) {
        return [];
    }

    try {
        const prompt = `Suggest 5 grocery items for query "${query}". 
        Return JSON array of objects with "name" and "emoji".
        Example: [{"name": "Milk", "emoji": "🥛"}, {"name": "Chocolate", "emoji": "🍫"}]
        Strict JSON only.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanedText);
    } catch (error) {
        console.error('Gemini smart suggestion error:', error);
        return [];
    }
};

export const processVoiceCommand = async (audioUri) => {
    if (!audioUri) return [];

    if (!initializeAI()) return [];

    try {
        // Read file as Base64
        const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
            encoding: 'base64',
        });

        console.log('Audio Base64 length:', audioBase64.length);

        // Use Gemini 2.5 Flash - stable with 20 requests/day free
        const voiceModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `Listen to this audio recording carefully. 

STEP 1: First, transcribe exactly what you hear the person saying in the audio.
STEP 2: Then, extract any grocery items mentioned.

Return a JSON object with this exact format:
{
  "transcription": "what you heard the person say",
  "items": [{"name": "Item Name", "quantity": "1 pcs", "emoji": "🛒"}]
}

If the audio is silent, unclear, or has no speech, return:
{"transcription": "silent or unclear", "items": []}`;

        const result = await voiceModel.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: 'audio/mp4',
                    data: audioBase64
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();
        console.log('Gemini raw response:', text);
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const parsed = JSON.parse(cleanedText);
        console.log('Transcription:', parsed.transcription);

        return parsed.items || [];

    } catch (error) {
        console.error('Voice processing error:', error);
        return [];
    }
};
