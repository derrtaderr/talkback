const Entry = require('../models/entry');
const AWS = require('aws-sdk');
const config = require('../config/config');

// Configure AWS
const s3 = new AWS.S3({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.region
});

// Create new entry
exports.createEntry = async (req, res) => {
  try {
    const { type, content, mood, tags } = req.body;
    
    const entry = new Entry({
      user: req.user._id,
      type,
      content,
      mood,
      tags,
      metadata: {}
    });

    await entry.save();
    res.status(201).json({
      message: 'Entry created successfully',
      entry
    });
  } catch (error) {
    res.status(400).json({
      error: 'Failed to create entry',
      details: error.message
    });
  }
};

// Get all entries for a user with pagination and filters
exports.getEntries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { user: req.user._id };
    if (req.query.mood) filter.mood = req.query.mood;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.tag) filter.tags = req.query.tag;

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.createdAt.$lte = new Date(req.query.endDate);
    }

    const entries = await Entry.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Entry.countDocuments(filter);

    res.json({
      entries,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalEntries: total
    });
  } catch (error) {
    res.status(400).json({
      error: 'Failed to fetch entries',
      details: error.message
    });
  }
};

// Get single entry
exports.getEntry = async (req, res) => {
  try {
    const entry = await Entry.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json(entry);
  } catch (error) {
    res.status(400).json({
      error: 'Failed to fetch entry',
      details: error.message
    });
  }
};

// Update entry
exports.updateEntry = async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['content', 'mood', 'tags'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates' });
    }

    const entry = await Entry.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    updates.forEach(update => entry[update] = req.body[update]);
    await entry.save();

    res.json({
      message: 'Entry updated successfully',
      entry
    });
  } catch (error) {
    res.status(400).json({
      error: 'Failed to update entry',
      details: error.message
    });
  }
};

// Delete entry
exports.deleteEntry = async (req, res) => {
  try {
    const entry = await Entry.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // If voice entry, delete from S3
    if (entry.type === 'voice' && entry.content.voiceUrl) {
      const key = entry.content.voiceUrl.split('/').pop();
      await s3.deleteObject({
        Bucket: config.aws.bucketName,
        Key: key
      }).promise();
    }

    await entry.remove();
    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    res.status(400).json({
      error: 'Failed to delete entry',
      details: error.message
    });
  }
};

// Get entry statistics
exports.getStats = async (req, res) => {
  try {
    const stats = await Entry.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          textEntries: { 
            $sum: { $cond: [{ $eq: ['$type', 'text'] }, 1, 0] }
          },
          voiceEntries: { 
            $sum: { $cond: [{ $eq: ['$type', 'voice'] }, 1, 0] }
          },
          avgWordsPerEntry: { 
            $avg: '$metadata.wordCount'
          }
        }
      }
    ]);

    const moodDistribution = await Entry.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$mood',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      statistics: stats[0] || {
        totalEntries: 0,
        textEntries: 0,
        voiceEntries: 0,
        avgWordsPerEntry: 0
      },
      moodDistribution: moodDistribution
    });
  } catch (error) {
    res.status(400).json({
      error: 'Failed to fetch statistics',
      details: error.message
    });
  }
}; 