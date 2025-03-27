const Job = require('../models/Job');
const { generateMockQuestion } = require('../services/aiQuestionGenerator');
const REQUIRED_FIELDS = [
  'title',
  'description',
  'difficulty',
  'constraints',
  'input_format',
  'output_format',
  'examples'
];
const getJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error.message);
    next(error);
  }
};


getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    const hasValidMockQuestion = job.mockQuestion && 
      typeof job.mockQuestion === 'object' && 
      REQUIRED_FIELDS.every(field => {
        const hasField = job.mockQuestion[field] !== undefined && job.mockQuestion[field] !== null;
        if (!hasField) {
          console.log(`Missing or null field: ${field}`);
        }
        return hasField;
      });
    if (hasValidMockQuestion) {
      console.log('Mock question already exists for job:', job.title);
      console.log('Existing mock question:', job.mockQuestion);
    } else {
      const mockQuestion = await generateMockQuestion(job.title, job.description);
      console.log('Generated mock question');

      if (mockQuestion && typeof mockQuestion === 'object') {
        
        const missingFields = REQUIRED_FIELDS.filter(field => !mockQuestion[field]);
        if (missingFields.length > 0) {
          console.error('Generated mock question is incomplete, missing fields:', missingFields);
          return res.status(500).json({ message: 'Generated mock question is incomplete' });
        }

        job.mockQuestion = mockQuestion;
        await job.save();
        console.log('Mock question saved successfully');
      } else {
        console.error('No valid mock question generated');
        return res.status(500).json({ message: 'Failed to generate a valid mock question' });
      }
    }

    res.json(job);
  } catch (error) {
    console.error('Error fetching job by ID:', error.message);
    next(error);
  }
};

module.exports = { getJobs, getJobById };