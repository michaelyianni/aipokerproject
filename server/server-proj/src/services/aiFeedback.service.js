// ./src/services/aiFeedback.service.js (ESM)

import { encode } from '@toon-format/toon'
import 'dotenv/config';
import Groq from 'groq-sdk';

export default class AIFeedbackService {
    constructor() {
        this.apiKey = process.env.GROQ_API_KEY; // ✅ Will read from .env

        if (!this.apiKey) {
            console.warn('[AI Feedback] Warning: GROQ_API_KEY not set');
        }

        this.groq = new Groq({ apiKey: this.apiKey });
    }

    /**
     * Generate AI feedback for poker hands
     * @param {Object} roundHistory - Object with 'hands' array
     * @returns {Promise<string>} - AI-generated feedback
     */
    async getFeedback(roundHistory) {
        const hands = roundHistory.hands || [];

        if (hands.length === 0) {
            return "No hands to analyze. Play some poker first!";
        }

        console.log(`[AI Feedback] Analyzing ${hands.length} hand(s)...`);


        // Convert JSON to TOON for LLM input
        const toonInput = encode({ hands });
        // console.log(`[AI Feedback] TOON input:\n${toonInput}`);
        console.log(`[AI Feedback] Compressed to TOON. Input length: ${toonInput.length} characters`);


        // For now, return mock feedback
        // Replace this with actual LLM API call
        // return this._generateMockFeedback(hands);

        // Uncomment when ready to use real LLM:
        return await this._callGroq(hands);

    }

    /**
     * Mock feedback generator (for testing without LLM API)
     */
    _generateMockFeedback(hands) {
        const handCount = hands.length;
        const lastHand = hands[hands.length - 1];

        const heroInfo = lastHand.playerInfo?.hero;
        const holeCards = heroInfo?.holeCards?.join(', ') || 'Unknown';

        return `
🤖 AI Poker Coach Analysis
===========================

Hands Analyzed: ${handCount}

Last Hand Summary:
- Your Hole Cards: ${holeCards}
- Position: ${heroInfo?.seatPosition || 'Unknown'}
- Starting Stack: ${heroInfo?.startingStack || 0}

Key Observations:
1. ✅ Good aggression on the button
2. ⚠️ Consider sizing up your river bets
3. 💡 You're playing too many hands from early position

Overall Rating: 7/10

Keep up the solid play! Focus on tightening your UTG range.

[This is mock feedback. Replace with real LLM integration.]
        `.trim();
    }

    /**
     * Call Groq API to get real AI feedback based on hand history
     */
    async _callGroq(hands) {

        const prompt = this._buildPrompt(hands);

        const response = await this.groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [{
                role: "system",
                content: "You are an expert poker coach. Analyze hands and provide constructive feedback."
            }, {
                role: "user",
                content: "This is a test prompt. Reply with whatever you would like."
            }],
            max_tokens: 1000,
        });

        console.log(`[AI Feedback] Raw response from Groq:\n${JSON.stringify(response, null, 2)}`);

        return response.choices[0].message.content;

    }


    /**
     * Build prompt for LLM
     */
    _buildPrompt(hands) {
        return `
You are an expert poker coach. Analyze the following poker hand history and provide:

1. Key decisions made by the hero
2. Mistakes or missed opportunities
3. Alternative lines they could have taken
4. Overall rating (1-10)

Hand History:
${JSON.stringify({ hands }, null, 2)}

Provide clear, actionable feedback.
        `.trim();
    }
}