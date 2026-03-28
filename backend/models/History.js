const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    default: 'Untitled Podcast',
  },
  originalText: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  audioFile: {
    type: String, // filename on server
    default: null,
  },
  voiceMode: {
    type: String,
    enum: ['normal', 'fast', 'story'],
    default: 'normal',
  },
  wordCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('History', historySchema);
