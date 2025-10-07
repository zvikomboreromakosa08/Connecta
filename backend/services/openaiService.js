const { OpenAI } = require('openai');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.isConfigured = !!process.env.OPENAI_API_KEY;
  }

  async generateMeetingSummary(transcript, participants, duration, meetingTitle = '') {
    if (!this.isConfigured) {
      throw new Error('OpenAI service not configured');
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo-16k",
        messages: [
          {
            role: "system",
            content: `You are an expert meeting assistant for Connecta organizational platform. 
            Generate comprehensive, actionable meeting summaries with clear decisions and assigned action items.
            Format your response with clear sections and bullet points.`
          },
          {
            role: "user",
            content: `Meeting Title: ${meetingTitle}
            Participants: ${participants.join(', ')}
            Duration: ${duration} minutes
            
            Meeting Transcript:
            ${transcript}
            
            Please provide a structured summary with:
            ## Executive Summary
            [2-3 sentence overview]
            
            ## Key Decisions
            [Bulleted list of important decisions]
            
            ## Action Items
            [Task - Owner - Deadline format]
            
            ## Discussion Highlights
            [Main points discussed]
            
            ## Next Steps
            [Clear timeline and responsibilities]`
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`AI service unavailable: ${error.message}`);
    }
  }

  async analyzeMessagePriority(messages, userContext) {
    if (!this.isConfigured) {
      return this.fallbackPriorityAnalysis(messages);
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a smart notification system for Connecta. 
            Analyze messages and assign priority levels (urgent/high/medium/low) based on:
            - Urgency keywords and context
            - Relevance to user's role and department
            - Sender importance
            - Time sensitivity
            Return valid JSON only.`
          },
          {
            role: "user",
            content: `User Role: ${userContext.role}
            User Department: ${userContext.department}
            
            Messages to analyze:
            ${JSON.stringify(messages, null, 2)}
            
            Return JSON array with: messageId, priority, reason, suggestedAction`
          }
        ],
        max_tokens: 1000,
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0].message.content);
      return result.prioritizedMessages || [];
    } catch (error) {
      console.error('OpenAI priority analysis failed:', error);
      return this.fallbackPriorityAnalysis(messages);
    }
  }

  fallbackPriorityAnalysis(messages) {
    // Real fallback algorithm - not a mock
    const urgencyKeywords = ['urgent', 'emergency', 'asap', 'immediately', 'critical'];
    const highPrioritySenders = ['manager', 'director', 'ceo', 'admin', 'system'];
    
    return messages.map(msg => {
      const content = msg.content.toLowerCase();
      const sender = msg.sender?.toLowerCase() || '';
      
      let priority = 'medium';
      let reason = 'Standard priority';
      
      if (urgencyKeywords.some(keyword => content.includes(keyword))) {
        priority = 'urgent';
        reason = 'Contains urgent keywords';
      } else if (highPrioritySenders.some(highSender => sender.includes(highSender))) {
        priority = 'high';
        reason = 'From important sender';
      } else if (content.includes('deadline') || content.includes('due today')) {
        priority = 'high';
        reason = 'Time-sensitive content';
      }
      
      return {
        messageId: msg.id,
        priority,
        reason,
        suggestedAction: priority === 'urgent' ? 'review_immediately' : 'review_when_available'
      };
    });
  }

  async generateSmartReplies(messageContext, conversationHistory = []) {
    if (!this.isConfigured) {
      return ['Thanks for your message.', 'I will get back to you soon.', 'Could you provide more details?'];
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a professional communication assistant. 
            Generate 3 appropriate, professional reply options for workplace communication.
            Keep replies concise and varied in tone.`
          },
          {
            role: "user",
            content: `Last message received: "${messageContext}"
            Conversation history: ${JSON.stringify(conversationHistory.slice(-5))}
            
            Provide 3 reply options as a JSON array of strings.`
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0].message.content);
      return result.replies || [];
    } catch (error) {
      console.error('OpenAI smart replies failed:', error);
      return ['Thank you for your message.', 'I appreciate the update.', 'Let me review this and get back to you.'];
    }
  }
}

module.exports = new OpenAIService();