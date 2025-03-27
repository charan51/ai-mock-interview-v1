const Attempt = require('../models/Attempt');
const Job = require('../models/Job');
const { reviewCode } = require('../services/aiReview'); 

const submitAttempt = async (req, res) => {
  try {
    const { userId, jobId, code, language } = req.body;
    if (!userId || !jobId || !code || !language) {
      return res.status(400).json({ error: 'Missing required fields: userId, jobId, code, and language are required' });
    }
    const supportedLanguages = ['javascript', 'python', 'java'];
    if (!supportedLanguages.includes(language)) {
      return res.status(400).json({ error: `Unsupported language: ${language}. Supported languages are ${supportedLanguages.join(', ')}` });
    }
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (!job.mockQuestion) {
      return res.status(400).json({ error: 'No mock question available for this job' });
    }

    console.log('Calling reviewCode with code:', code);
    const reviewResult = await reviewCode(code, language, job.mockQuestion);
    console.log('Review result:', reviewResult);
    const attempt = new Attempt({
      userId,
      jobId,
      code,
      language,
      results: reviewResult.results || [],
      aiFeedback: reviewResult.aiFeedback || 'No feedback available',
      submittedAt: new Date()
    });
    await attempt.save();
    console.log('Attempt saved:', attempt);
    res.status(200).json({
      message: 'Code submitted and reviewed successfully',
      attemptId: attempt._id,
      results: reviewResult.results,
      aiFeedback: reviewResult.aiFeedback
    });
  } catch (error) {
    console.error('Error in submitAttempt:', error.message);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};
const getUserAttempts = async (req, res) => {
  try {
    const { userId, jobId } = req.params;

    if (!userId || !jobId) {
      return res.status(400).json({ error: 'Missing required parameters: userId and jobId are required' });
    }

    const attempts = await Attempt.find({ userId, jobId })
      .sort({ submittedAt: -1 })
      .limit(10);

    res.status(200).json({
      message: 'Attempts retrieved successfully',
      attempts
    });
  } catch (error) {
    console.error('Error in getUserAttempts:', error.message);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};
const getAttemptById = async (req, res) => {
  try {
    const { attemptId } = req.params;

    if (!attemptId) {
      return res.status(400).json({ error: 'Missing required parameter: attemptId is required' });
    }

    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    res.status(200).json({
      message: 'Attempt retrieved successfully',
      attempt
    });
  } catch (error) {
    console.error('Error in getAttemptById:', error.message);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};

module.exports = {
  submitAttempt,
  getUserAttempts,
  getAttemptById
};