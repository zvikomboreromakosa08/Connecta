const { Configuration, OpenAIApi } = require('openai');

class SmartNotifications {
  constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(configuration);
    this.userPreferences = new Map();
  }

  async prioritizeNotifications(notifications, userContext) {
    try {
      const prompt = this.buildPrioritizationPrompt(notifications, userContext);
      
      const response = await this.openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a smart notification system. Analyze messages and rank them by importance and relevance to the user."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.2,
      });

      const prioritized = JSON.parse(response.data.choices[0].message.content);
      return this.applyUserPreferences(prioritized, userContext);
    } catch (error) {
      console.error('Notification prioritization error:', error);
      return this.fallbackPrioritization(notifications);
    }
  }

  buildPrioritizationPrompt(notifications, userContext) {
    return `
      USER CONTEXT:
      - Role: ${userContext.role}
      - Department: ${userContext.department}
      - Current Projects: ${userContext.projects?.join(', ') || 'None specified'}
      - Working Hours: ${userContext.workingHours || '9 AM - 5 PM'}
      
      NOTIFICATIONS TO PRIORITIZE:
      ${JSON.stringify(notifications, null, 2)}
      
      Analyze each notification and return a JSON array sorted by priority (highest first) with this structure:
      [
        {
          "id": "notification_id",
          "priority": "urgent|high|medium|low",
          "reason": "brief explanation",
          "suggestedAction": "immediate|schedule|delegate|ignore",
          "estimatedTime": "minutes required to address"
        }
      ]
      
      Consider:
      - Urgency and importance
      - Relevance to user's role and projects
      - Time sensitivity
      - Relationship with sender
      - Meeting and deadline proximity
    `;
  }

  applyUserPreferences(prioritizedNotifications, userContext) {
    const preferences = this.userPreferences.get(userContext.userId) || {};
    
    return prioritizedNotifications.map(notification => {
      // Apply user-specific rules
      if (preferences.muteKeywords) {
        const hasMutedKeyword = preferences.muteKeywords.some(keyword => 
          notification.content.toLowerCase().includes(keyword.toLowerCase())
        );
        if (hasMutedKeyword) {
          notification.priority = 'low';
          notification.suggestedAction = 'ignore';
        }
      }

      // Respect working hours
      if (preferences.workingHours && !this.isWithinWorkingHours(preferences.workingHours)) {
        if (notification.priority === 'medium') {
          notification.priority = 'low';
        }
      }

      return notification;
    });
  }

  async generateSmartReply(message, userContext) {
    try {
      const prompt = `
        Generate 3 appropriate reply options for this message:
        
        Message: "${message.content}"
        Sender: ${message.senderName}
        Context: ${userContext.relationship || 'colleague'}
        User's typical style: ${userContext.communicationStyle || 'professional'}
        
        Provide replies that are:
        - Contextually appropriate
        - Match the user's communication style
        - Vary in length and formality
      `;

      const response = await this.openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful communication assistant that suggests appropriate message replies."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return this.parseReplyOptions(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Smart reply generation error:', error);
      return [];
    }
  }

  parseReplyOptions(replyText) {
    const options = [];
    const lines = replyText.split('\n');
    
    for (const line of lines) {
      if (line.trim().match(/^[0-9]\./)) {
        options.push(line.replace(/^[0-9]\.\s*/, '').trim());
      }
    }
    
    return options.slice(0, 3);
  }

  isWithinWorkingHours(workingHours) {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [start, end] = workingHours.split('-').map(time => {
      const [hours, minutes] = time.trim().split(':');
      return parseInt(hours) * 60 + (parseInt(minutes) || 0);
    });
    
    return currentTime >= start && currentTime <= end;
  }

  fallbackPrioritization(notifications) {
    // Fallback algorithm based on simple rules
    return notifications.map(notification => {
      let priority = 'medium';
      let reason = 'Standard priority';
      
      // Simple rule-based prioritization
      if (notification.type === 'direct_mention') {
        priority = 'high';
        reason = 'You were directly mentioned';
      } else if (notification.sender === 'manager') {
        priority = 'high';
        reason = 'From your manager';
      } else if (notification.channel === 'urgent') {
        priority = 'urgent';
        reason = 'Urgent channel message';
      } else if (notification.containsDeadline) {
        priority = 'high';
        reason = 'Contains deadline';
      }
      
      return {
        ...notification,
        priority,
        reason,
        suggestedAction: priority === 'urgent' ? 'immediate' : 'schedule'
      };
    }).sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  updateUserPreferences(userId, preferences) {
    this.userPreferences.set(userId, {
      ...this.userPreferences.get(userId),
      ...preferences
    });
  }
}

module.exports = SmartNotifications;