import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import MockInterview from '../components/MockInterview';

function Interview() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
const res = await axios.get(`http://54.90.228.139:5001/api/jobs/${jobId}`, {
  
  headers: {
    'user-id': '507f1f77bcf86cd799439011'
  }
});
        setJob(res.data);
      } catch (err) {
        console.error('Error fetching job:', err);
        if (err.response) {
          setError(`Failed to load job: ${err.response.data.error || err.response.statusText}`);
        } else if (err.request) {
          setError('No response from server. Is the backend running on port 5000?');
        } else {
          setError('Error: ' + err.message);
        }
      }
    };

    fetchJob();
  }, [jobId]);

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-red-500">Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto p-4">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{job.title} - Mock Interview</h1>
      <MockInterview job={job} />
    </div>
  );
}

export default Interview;
