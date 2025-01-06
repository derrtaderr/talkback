const { OpenAI } = require('openai');
const config = require('../config/config');
const Entry = require('../models/entry');

const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

class ChatService {
  // Format entries for context
  formatEntriesForContext(entries) {
    return entries.map(entry => {
      const content = entry.type === 'text' ? entry.content.text : entry.content.transcription;
      const date = entry.createdAt.toLocaleDateString();
      return `On ${date}, you wrote (mood: ${entry.mood}): ${content}`;
    }).join('\n\n');
  }

  // Generate system prompt based on user preferences and entry context
  generateSystemPrompt(entries) {
    return `You are an AI that helps users reflect on their diary entries by speaking in their own voice and perspective. 
    You have access to their past diary entries and should use them to provide thoughtful, empathetic responses.
    
    Consider the emotional context and mood patterns in their entries. When responding:
    1. Maintain a first-person perspective as if you're their past self speaking to them
    2. Reference specific entries and dates when relevant
    3. Show emotional intelligence and empathy
    4. Help them notice patterns or growth
    5. Avoid generic advice; keep responses personal and specific to their entries
    
    Their past entries for context:
    ${this.formatEntriesForContext(entries)}`;
  }

  // Get relevant entries based on query
  async getRelevantEntries(userId, query) {
    let filter = { user: userId };
    
    // If date range is specified
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
    }

    // If mood is specified
    if (query.mood) {
      filter.mood = query.mood;
    }

    // If topic/tag is specified
    if (query.tag) {
      filter.tags = query.tag;
    }

    // Get entries sorted by date
    const entries = await Entry.find(filter)
      .sort({ createdAt: -1 })
      .limit(10); // Limit to recent entries for context

    return entries;
  }

  // Generate chat response
  async generateChatResponse(userId, message, query = {}) {
    try {
      // Get relevant entries
      const entries = await this.getRelevantEntries(userId, query);
      
      if (entries.length === 0) {
        return {
          response: "I don't have any relevant diary entries to reference for this conversation. Would you like to create a new entry?",
          context: []
        };
      }

      // Generate chat completion
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: this.generateSystemPrompt(entries)
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return {
        response: completion.choices[0].message.content,
        context: entries.map(entry => ({
          date: entry.createdAt,
          mood: entry.mood,
          preview: entry.type === 'text' ? 
            entry.content.text.substring(0, 100) : 
            entry.content.transcription.substring(0, 100)
        }))
      };
    } catch (error) {
      console.error('Chat generation error:', error);
      throw new Error('Failed to generate chat response');
    }
  }

  // Analyze emotional patterns
  async analyzeEmotionalPatterns(userId) {
    try {
      // Get all entries for the user
      const entries = await Entry.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(50);

      if (entries.length === 0) {
        return {
          message: "Not enough entries to analyze patterns yet."
        };
      }

      const entriesContext = this.formatEntriesForContext(entries);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Analyze the following diary entries and provide insights about emotional patterns, recurring themes, and personal growth. 
            Focus on being constructive and empathetic. Structure the analysis in clear sections.`
          },
          {
            role: "user",
            content: entriesContext
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return {
        analysis: completion.choices[0].message.content,
        entriesAnalyzed: entries.length
      };
    } catch (error) {
      console.error('Pattern analysis error:', error);
      throw new Error('Failed to analyze emotional patterns');
    }
  }
}

module.exports = new ChatService(); 