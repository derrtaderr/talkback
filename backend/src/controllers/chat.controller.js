const chatService = require('../services/chat.service');

// Start or continue a chat conversation
exports.chat = async (req, res) => {
  try {
    const { message, filters } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await chatService.generateChatResponse(
      req.user._id,
      message,
      filters
    );

    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate chat response',
      details: error.message
    });
  }
};

// Get emotional patterns analysis
exports.getPatternAnalysis = async (req, res) => {
  try {
    const analysis = await chatService.analyzeEmotionalPatterns(req.user._id);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to analyze patterns',
      details: error.message
    });
  }
}; 