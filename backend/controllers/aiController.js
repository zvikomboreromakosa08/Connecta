const { OpenAI } = require('openai');
const Meeting = require('../models/Meeting');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
          content: "You are an expert meeting summarizer. Provide clear, concise, and actionable meeting summaries."
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

    res.json({ summary });
  } catch (error) {
    console.error('AI summarization error:', error);
    res.status(500).json({ error: 'Failed to generate meeting summary' });
  }
};

exports.prioritizeNotifications = async (req, res) => {
  try {
    const { messages, userContext } = req.body;

    const prompt = `
      Analyze these messages and prioritize them for ${userContext?.role} in ${userContext?.department}.
      Consider urgency, relevance to role, and importance.
      
      Messages: ${JSON.stringify(messages.slice(0, 10))}
      
      Return JSON with prioritized list and urgency levels.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system", 
          content: "You are a smart notification prioritization system."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000
    });

    const prioritized = JSON.parse(completion.choices[0].message.content);
    res.json(prioritized);
  } catch (error) {
    console.error('AI prioritization error:', error);
    res.status(500).json({ error: 'Failed to prioritize notifications' });
  }
};