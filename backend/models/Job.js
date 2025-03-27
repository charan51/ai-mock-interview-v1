const mongoose = require('mongoose');
const mockQuestionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, required: true },
  constraints: { type: Object, required: true },
  input_format: { type: Object, required: true },
  output_format: { type: Object, required: true },
  examples: { type: Array, required: true }
});

const jobSchema = new mongoose.Schema({
  remotiveId: { type: String, required: false }, 
  title: { type: String, required: true },
  description: { type: String, required: true },
  companyName: { type: String, required: true }, 
  sourceUrl: { type: String, required: false }, 
  lastUpdated: { type: Date, required: false }, 
  mockQuestion: { type: mockQuestionSchema, required: false } 
});

module.exports = mongoose.model('Job', jobSchema);