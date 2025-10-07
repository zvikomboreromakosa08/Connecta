const { DailyClient } = require('@daily-co/daily-js');

class DailyService {
  constructor() {
    this.apiKey = process.env.DAILY_API_KEY;
    this.baseURL = 'https://api.daily.co/v1';
  }

  async createMeeting(meetingConfig) {
    try {
      const response = await fetch(`${this.baseURL}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          name: meetingConfig.roomName,
          privacy: meetingConfig.isPrivate ? 'private' : 'public',
          properties: {
            enable_chat: true,
            enable_screenshare: true,
            enable_recording: meetingConfig.recordMeeting || false,
            enable_prejoin_ui: true,
            exp: Math.round(Date.now() / 1000) + (meetingConfig.duration || 3600),
            e2ee_encryption: true, // Real end-to-end encryption
            max_participants: meetingConfig.maxParticipants || 50,
            start_audio_off: false,
            start_video_off: false
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Daily.co API error: ${errorData.error || response.statusText}`);
      }

      const roomData = await response.json();
      
      return {
        id: roomData.id,
        name: roomData.name,
        url: roomData.url,
        joinUrl: roomData.url,
        hostUrl: `${roomData.url}?t=${await this.generateMeetingToken(roomData.name, true)}`,
        createdAt: roomData.created_at,
        config: roomData.config
      };
    } catch (error) {
      console.error('Daily.co meeting creation failed:', error);
      throw new Error(`Failed to create video meeting: ${error.message}`);
    }
  }

  async generateMeetingToken(roomName, isOwner = false) {
    try {
      const response = await fetch(`${this.baseURL}/meeting-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          properties: {
            room_name: roomName,
            is_owner: isOwner,
            enable_screenshare: true,
            enable_chat: true,
            exp: Math.round(Date.now() / 1000) + 3600 // 1 hour expiry
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate meeting token');
      }

      const tokenData = await response.json();
      return tokenData.token;
    } catch (error) {
      console.error('Token generation failed:', error);
      throw error;
    }
  }

  async deleteMeeting(roomName) {
    try {
      const response = await fetch(`${this.baseURL}/rooms/${roomName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete meeting room');
      }

      return true;
    } catch (error) {
      console.error('Failed to delete meeting:', error);
      throw error;
    }
  }

  async getMeetingParticipants(roomName) {
    try {
      const response = await fetch(`${this.baseURL}/rooms/${roomName}/participants`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch participants');
      }

      const participantsData = await response.json();
      return participantsData.data;
    } catch (error) {
      console.error('Failed to get participants:', error);
      throw error;
    }
  }
}

module.exports = new DailyService();