import { GoogleGenAI } from "@google/genai";
import { Idea, Card } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.error("Gemini API key not found in environment variables. The app may not function correctly.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const getBrainstormSuggestions = async (idea: Idea): Promise<string> => {
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
        const response = await ai.models.generateContent({
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
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for card brainstorm:", error);
        return "Sorry, I couldn't generate suggestions for this card right now. Please check the console for more details.";
    }
};
