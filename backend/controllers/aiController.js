// backend/controllers/aiController.js

// ✅ Updated OpenAI SDK import (v4+)
const OpenAI = require('openai');
const express = require('express');
const auth = require('../middleware/auth'); // Import auth middleware
const router = express.Router();

// ✅ Initialize OpenAI API client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// ==========================================
// UTILITY FUNCTIONS (Exported)
// ==========================================

/**
 * Summarizes a single long message for use in the message route.
 * @param {string} content - The message content to summarize.
 * @returns {Promise<string|null>} - The concise summary or null on error.
 */
async function summarizeMessage(content) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // Use a fast chat model for simple summaries
            messages: [
                {
                    role: "system",
                    content: "Summarize this message in one concise sentence, focusing on the main topic or action item."
                },
                {
                    role: "user",
                    content: content
                }
            ],
            max_tokens: 100,
            temperature: 0.3,
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('Message summarization error:', error.message);
        return null; // Return null to indicate failure without crashing the app
    }
}

// ==========================================
// ROUTE HANDLERS (for /api/ai)
// ==========================================

// ------------------------------------
// @route   POST /api/ai/summarize-meeting
// @desc    Generate a detailed summary for a meeting transcript
// @access  Private
// ------------------------------------
router.post('/summarize-meeting', auth, async (req, res) => {
    try {
        const { transcript, participants, duration } = req.body;

        if (!transcript) {
            return res.status(400).json({ error: 'Meeting transcript is required.' });
        }

        const prompt = `
            Please provide a comprehensive summary of the following meeting transcript.
            Participants: ${participants?.join(', ') || 'Unknown'}
            Duration: ${duration || 'Unknown'}

            Transcript:
            ${transcript}

            Please provide the summary in markdown format with clear headings for:
            1. Key Decisions Made
            2. Action Items with Owners (e.g., [Owner]: [Task])
            3. Important Discussion Points
            4. Next Steps
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4", // Use the most capable model for complex summarization
            messages: [
                {
                    role: "system",
                    content: "You are an expert meeting summarizer. Provide clear, concise, and actionable meeting summaries in markdown format."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 1000,
            temperature: 0.3,
        });

        const summary = response.choices[0].message.content;
        res.json({ summary });
    } catch (error) {
        console.error('AI Summarization error:', error.message);
        res.status(500).json({ error: 'Failed to generate meeting summary' });
    }
});

// ------------------------------------
// @route   POST /api/ai/prioritize-notifications
// @desc    Analyze and prioritize a list of messages based on user context
// @access  Private
// ------------------------------------
router.post('/prioritize-notifications', auth, async (req, res) => {
    try {
        const { messages, userContext } = req.body;

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'An array of messages is required for prioritization.' });
        }

        const prompt = `
            Analyze these messages and prioritize them for a ${userContext?.role || 'user'} in the ${userContext?.department || 'general'} department.
            Consider urgency, importance, and relevance to the user's role.

            Messages to prioritize (Input JSON Array):
            ${JSON.stringify(messages, null, 2)}

            Return a strict JSON array of the original message objects, adding a 'priorityScore' (1-10) field, and ordered by the highest 'priorityScore' first.
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a smart notification prioritization system. You must analyze the input JSON array of messages, add a 'priorityScore' (1-10) field to each object, and return the resulting messages in a strict, valid JSON array, ordered by highest priorityScore first."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 2000,
            temperature: 0.2,
        });

        const content = response.choices[0].message.content.trim();
        // Attempt to parse the AI's JSON output
        const prioritizedMessages = JSON.parse(content);

        res.json({ prioritizedMessages });
    } catch (error) {
        console.error('AI Prioritization error:', error.message);
        res.status(500).json({ error: 'Failed to prioritize notifications (Note: AI output might be malformed)' });
    }
});

// ------------------------------------
// @route   POST /api/ai/automate-tasks
// @desc    Suggest task automation based on user workflow and tasks
// @access  Private
// ------------------------------------
router.post('/automate-tasks', auth, async (req, res) => {
    try {
        const { tasks, userWorkflow } = req.body;

        if (!tasks && !userWorkflow) {
             return res.status(400).json({ error: 'Tasks or user workflow data is required for automation suggestions.' });
        }

        const prompt = `
            Analyze these tasks and workflow patterns to suggest automation opportunities:

            Tasks: ${JSON.stringify(tasks, null, 2)}
            User Workflow: ${JSON.stringify(userWorkflow, null, 2)}

            Suggest specific automations that could save time and reduce manual effort. Provide the suggestions as a numbered list with a title, description, and suggested tool (if applicable).
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a workflow automation expert. Identify repetitive tasks and suggest intelligent automations. Respond in a clear, formatted text."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 1500,
            temperature: 0.4,
        });

        const automationSuggestions = response.choices[0].message.content;
        res.json({ automationSuggestions });
    } catch (error) {
        console.error('AI Automation error:', error.message);
        res.status(500).json({ error: 'Failed to generate automation suggestions' });
    }
});

// ==========================================
// EXPORTS
// ==========================================

// Export the router for use in server.js (as /api/ai)
module.exports = router;

// Export the utility function for use in message routes
module.exports.summarizeMessage = summarizeMessage;
