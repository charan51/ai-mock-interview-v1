const axios = require('axios');
const Job = require('../models/Job');

const fetchRemotiveJobs = async () => {
  try {
   
    const response = await axios.get('https://remotive.com/api/remote-jobs', {
      params: {
        category: 'software-dev',
        limit: 10
      },
      timeout: 10000
    });

    const jobs = response.data.jobs;
    if (!Array.isArray(jobs)) {
      throw new Error('Invalid response from Remotive API: jobs is not an array');
    }

    console.log(`Fetched ${jobs.length} jobs from Remotive API`);

   
    let successCount = 0;
    let failureCount = 0;

    for (const job of jobs) {
      try {
       
        if (!job.id || !job.title || !job.description || !job.company_name) {
          console.warn(`Skipping job with missing required fields: ${JSON.stringify(job)}`);
          failureCount++;
          continue;
        }

       
        const jobData = {
          remotiveId: String(job.id),
          title: job.title,
          description: job.description,
          companyName: job.company_name,
          sourceUrl: job.url || null,
          lastUpdated: new Date()
        };

       
        await Job.findOneAndUpdate(
          { remotiveId: job.id },
          { $set: jobData },
          { upsert: true, new: true }
        );

        console.log(`Stored job ${job.title} in the database`);
        successCount++;
      } catch (error) {
        console.error(`Error processing job ${job.title || 'unknown'}:`, error.message);
        failureCount++;
      }
    }

    console.log(`MongoDB updated with Remotive jobs: ${successCount} successful, ${failureCount} failed`);
    return { successCount, failureCount };
  } catch (error) {
    console.error('Error fetching Remotive jobs:', error.message);
    if (error.response) {
      console.error('Remotive API response:', error.response.data);
    }
    throw new Error(`Failed to fetch Remotive jobs: ${error.message}`);
  }
};

module.exports = { fetchRemotiveJobs };