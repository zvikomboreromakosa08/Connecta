const { Configuration, OpenAIApi } = require('openai');

class MeetingSummarizer {
  constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(configuration);
  }

  async generateSummary(transcript, participants, duration, context = {}) {
    try {
      const prompt = this.buildSummaryPrompt(transcript, participants, duration, context);
      
      const response = await this.openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert meeting assistant. Generate concise, actionable meeting summaries with clear next steps and decisions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const summary = response.data.choices[0].message.content;
      return this.parseSummary(summary);
    } catch (error) {
      console.error('Meeting summarization error:', error);
      throw new Error('Failed to generate meeting summary');
    }
  }

  buildSummaryPrompt(transcript, participants, duration, context) {
    return `
      MEETING CONTEXT:
      - Participants: ${participants?.join(', ') || 'Not specified'}
      - Duration: ${duration || 'Not specified'}
      - Department: ${context.department || 'General'}
      - Meeting Type: ${context.meetingType || 'Regular meeting'}
      
      TRANSCRIPT:
      ${transcript}
      
      Please provide a comprehensive meeting summary including:
      
      1. EXECUTIVE SUMMARY (2-3 sentences overall summary)
      
      2. KEY DECISIONS MADE
      [List all important decisions with clear ownership]
      
      3. ACTION ITEMS
      [Specific tasks with owners and deadlines]
      
      4. MAIN DISCUSSION POINTS
      [Key topics discussed and conclusions]
      
      5. NEXT STEPS
      [Clear timeline and responsibilities]
      
      6. SENTIMENT ANALYSIS
      [Overall meeting tone and participant engagement]
      
      Format the response in clear, markdown-style sections.
    `;
  }

  parseSummary(summaryText) {
    // Parse the AI response into structured data
    const sections = {
      executiveSummary: '',
      keyDecisions: [],
      actionItems: [],
      discussionPoints: [],
      nextSteps: [],
      sentiment: ''
    };

    // Simple parsing logic - in practice, you'd want more sophisticated parsing
    const lines = summaryText.split('\n');
    let currentSection = '';

    for (const line of lines) {
      if (line.includes('EXECUTIVE SUMMARY')) {
        currentSection = 'executiveSummary';
      } else if (line.includes('KEY DECISIONS')) {
        currentSection = 'keyDecisions';
      } else if (line.includes('ACTION ITEMS')) {
        currentSection = 'actionItems';
      } else if (line.includes('DISCUSSION POINTS')) {
        currentSection = 'discussionPoints';
      } else if (line.includes('NEXT STEPS')) {
        currentSection = 'nextSteps';
      } else if (line.includes('SENTIMENT')) {
        currentSection = 'sentiment';
      } else if (line.trim() && currentSection) {
        if (currentSection === 'executiveSummary' || currentSection === 'sentiment') {
          sections[currentSection] += line.trim() + ' ';
        } else if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
          sections[currentSection].push(line.trim().substring(1).trim());
        }
      }
    }

    // Clean up
    sections.executiveSummary = sections.executiveSummary.trim();
    sections.sentiment = sections.sentiment.trim();

    return {
      raw: summaryText,
      structured: sections,
      timestamp: new Date(),
      version: '1.0'
    };
  }

  async generateActionItems(decisions, participants) {
    try {
      const prompt = `
        Based on these meeting decisions, generate specific, measurable action items:
        
        Decisions: ${JSON.stringify(decisions, null, 2)}
        Participants: ${participants.join(', ')}
        
        For each action item, specify:
        - Task description
        - Owner (assign to most relevant participant)
        - Deadline (realistic timeframe)
        - Priority (High/Medium/Low)
      `;

      const response = await this.openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a project management expert. Create clear, actionable tasks from meeting decisions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.4,
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Action item generation error:', error);
      throw new Error('Failed to generate action items');
    }
  }
}

module.exports = MeetingSummarizer;