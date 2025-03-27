const mongoose = require('mongoose');
const JobScheduler = mongoose.model('JobScheduler', new mongoose.Schema({
  lastFetchTime: { type: Date, required: true }
}));
const getLastFetchTime = async () => {
  const jobScheduler = await JobScheduler.findOne();
  return jobScheduler ? jobScheduler.lastFetchTime : new Date(0);
};

const setLastFetchTime = async (time) => {
  let jobScheduler = await JobScheduler.findOne();
  if (!jobScheduler) {
    jobScheduler = new JobScheduler({ lastFetchTime: time });
  } else {
    jobScheduler.lastFetchTime = time;
  }
  await jobScheduler.save();
};

const jobScheduler = async () => {
  // No logic to generate mock questions when the database is empty
};

module.exports = { getLastFetchTime, setLastFetchTime, jobScheduler };
