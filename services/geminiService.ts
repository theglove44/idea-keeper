import { GoogleGenAI } from "@google/genai";
import { Idea, Card } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

if (GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
} else {
    console.warn("VITE_GEMINI_API_KEY is missing; AI suggestions will be disabled.");
}

const ensureAiAvailable = (): GoogleGenAI | null => {
    if (!ai) {
        console.warn("Attempted to call Gemini services without an API key.");
    }
    return ai;
};

export const getBrainstormSuggestions = async (idea: Idea): Promise<string> => {
    const aiClient = ensureAiAvailable();
    if (!aiClient) {
        return "Gemini API key missing; enable `VITE_GEMINI_API_KEY` to receive AI suggestions.";
    }
    const model = 'gemini-2.5-flash';

    const allCards = idea.columns.flatMap(column => 
        column.cards.map(card => `[${column.title}] ${card.text}`)
    );

    const prompt = `
        You are an expert project manager and startup advisor. Your tone is encouraging and pragmatic.
        Based on the following project idea, generate a list of actionable next steps, potential challenges to consider, and suggest a simple, achievable first milestone to get started.
        The goal is to help the user break down their idea and overcome the feeling of being overwhelmed.
        Format the output as clean markdown. Use headings (e.g., ### Next Steps), bold text, and bullet points.

        ---

        **Project Title:** ${idea.title}

        **Summary:** ${idea.summary}

        **Existing Cards/Tasks:**
        ${allCards.length > 0 ? allCards.map(cardText => `- ${cardText}`).join('\n') : "(No cards yet)"}
    `;

    try {
        const response = await aiClient.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "Sorry, I couldn't generate suggestions at this time. Please check your API key and network connection. More details in the console.";
    }
};

export const getCardBrainstormSuggestions = async (idea: Idea, card: Card): Promise<string> => {
    const aiClient = ensureAiAvailable();
    if (!aiClient) {
        return "Gemini API key missing; enable `VITE_GEMINI_API_KEY` to receive AI suggestions.";
    }
    const model = 'gemini-2.5-flash';
    
    const prompt = `
        You are a creative and pragmatic assistant helping to flesh out a specific task for a larger project.
        Your goal is to provide actionable and inspiring suggestions to help the user move forward.

        **Main Project:** "${idea.title}"

        **Task to Brainstorm:** "${card.text}"

        Based on this single task, please provide the following in clean markdown format:
        
        ### Sub-tasks
        - A few concrete, smaller steps to accomplish this task.

        ### Potential Challenges
        - Questions or potential blockers the user should consider.

        ### Creative Spark
        - One creative idea or alternative approach to make this task even better.
    `;

    try {
        const response = await aiClient.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for card brainstorm:", error);
        return "Sorry, I couldn't generate suggestions for this card right now. Please check the console for more details.";
    }
};
