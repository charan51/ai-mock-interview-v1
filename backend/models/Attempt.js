const mongoose = require('mongoose');
const attemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  code: String,
  language: String,
  executionResult: String,
  aiFeedback: String,
  timestamp: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Attempt', attemptSchema);