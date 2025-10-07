// backend/controllers/aiController.js

require('dotenv').config();
const { OpenAI } = require('openai');
const Meeting = require('../models/Meeting');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Summarize a meeting transcript using OpenAI GPT
 */
exports.summarizeMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { transcript, participants, duration } = req.body;

    const prompt = `
      Create a comprehensive meeting summary with the following details:
      
      Participants: ${participants?.join(', ') || 'Not specified'}
      Duration: ${duration || 'Not specified'}
      Transcript: ${transcript}
      
      Please provide:
      1. Key decisions made
      2. Action items with owners
      3. Main discussion points
      4. Next steps and deadlines
      5. Overall sentiment and engagement level
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert meeting summarizer. Provide clear, concise, and actionable summaries."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.3
    });

    const summary = completion.choices[0].message.content;

    // Save summary to database
    await Meeting.findByIdAndUpdate(meetingId, {
      summary,
      summarizedAt: new Date()
    });

    res.json({ success: true, summary });
  } catch (error) {
    console.error('AI summarization error:', error);
    res.status(500).json({ error: 'Failed to generate meeting summary' });
  }
};

/**
 * Prioritize user notifications using AI
 */
exports.prioritizeNotifications = async (req, res) => {
  try {
    const { messages, userContext } = req.body;

    const prompt = `
      Analyze these messages and prioritize them for ${userContext?.role || 'a team member'}
      in ${userContext?.department || 'the organization'}.
      
      Consider:
      - Urgency
      - Relevance to role
      - Importance and deadlines

      Messages: ${JSON.stringify(messages.slice(0, 10))}

      Return valid JSON in this structure:
      [
        { "message": "string", "urgency": "high|medium|low", "reason": "string" }
      ]
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a smart notification prioritization system." },
        { role: "user", content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    let output = completion.choices[0].message.content;
    let prioritized;

    try {
      prioritized = JSON.parse(output);
    } catch {
      // fallback if GPT doesn't return valid JSON
      prioritized = { rawOutput: output };
    }

    res.json({ success: true, prioritized });
  } catch (error) {
    console.error('AI prioritization error:', error);
    res.status(500).json({ error: 'Failed to prioritize notifications' });
  }
};
