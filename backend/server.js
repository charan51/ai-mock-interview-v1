const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jobRoutes = require('./routes/jobs');
const attemptRoutes = require('./routes/attempts');
const { fetchRemotiveJobs } = require('./services/remotiveJobs');
const { getLastFetchTime, setLastFetchTime, jobScheduler } = require('./services/jobScheduler');
const cors = require('cors')
const cron = require('node-cron');
const app = express();
const Job = require('./models/Job');
app.use(cors())
app.use(express.json());



dotenv.config({ path: './.env' });

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, serverSelectionTimeoutMS: 20000 })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));
app.use('/api/jobs', jobRoutes);
app.use('/api/attempts', attemptRoutes);

const fetchRemotiveJobsOnce = async () => {
  console.log('Checking if database is empty...');
  const lastFetchTime = await getLastFetchTime();
  const currentTime = new Date();
  const timeDifference = currentTime - lastFetchTime;

  const isDatabaseEmpty = await Job.countDocuments() === 0;

  if (isDatabaseEmpty) {
    console.log('Database is empty. Running initial Remotive job update...');
    await fetchRemotiveJobs();
    await setLastFetchTime(currentTime);
  } else if (timeDifference > 24 * 60 * 60 * 1000) { 
    console.log('Running daily Remotive job update...');
    await fetchRemotiveJobs();
    await setLastFetchTime(currentTime);
  }
};

const checkAndRunFetchRemotiveJobs = async () => {
  console.log('Checking if database is empty...');
  const isDatabaseEmpty = await Job.countDocuments() === 0;

  if (isDatabaseEmpty) {
    console.log('Database is empty. Running initial Remotive job update...');
    await fetchRemotiveJobsOnce();
  }
};

checkAndRunFetchRemotiveJobs();

cron.schedule('0 0 * * *', fetchRemotiveJobsOnce, {
  scheduled: true,
  timezone: 'UTC'
});
jobScheduler();

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
