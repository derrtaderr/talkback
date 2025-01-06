const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['voice', 'text'],
    required: true
  },
  content: {
    text: String,
    voiceUrl: String,
    transcription: String
  },
  mood: {
    type: String,
    enum: ['happy', 'sad', 'angry', 'anxious', 'neutral', 'excited', 'tired'],
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  metadata: {
    duration: Number, // For voice entries (in seconds)
    wordCount: Number, // For text entries
    location: String, // Optional location data
  }
}, {
  timestamps: true
});

// Index for better query performance
entrySchema.index({ user: 1, createdAt: -1 });
entrySchema.index({ tags: 1 });
entrySchema.index({ mood: 1 });

// Pre-save middleware to set wordCount for text entries
entrySchema.pre('save', function(next) {
  if (this.type === 'text' && this.content.text) {
    this.metadata.wordCount = this.content.text.trim().split(/\s+/).length;
  }
  next();
});

const Entry = mongoose.model('Entry', entrySchema);

module.exports = Entry; 