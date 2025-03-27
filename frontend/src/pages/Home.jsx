import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import JobList from '../components/JobList';

function Home() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get('http://54.90.228.139:5001/api/jobs', { timeout: 5000 });
        setJobs(res.data);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        if (err.response) {
          setError(`Failed to load jobs: ${err.response.data.error || err.response.statusText}`);
        } else if (err.request) {
          setError('No response from server. Is the backend running on port 5000?');
        } else {
          setError('Error: ' + err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-100 to-gray-200 py-16 text-center">
        <h1 className="text-5xl font-bold mb-4 tracking-tight">AI-Powered Mock Interview System</h1>
        <p className="text-xl text-gray-600 mb-8">
          Prepare for your dream job with AI-generated mock interviews.
        </p>
        <Button 
          className="bg-gray-800 text-white hover:bg-gray-700 text-lg px-6 py-3 rounded-lg shadow-md"
          onClick={() => window.scrollTo({ top: document.getElementById('job-listings').offsetTop, behavior: 'smooth' })}
        >
          Explore Job Listings
        </Button>
      </div>

      {/* Job Listings Section */}
      <div id="job-listings" className="container mx-auto p-6">
        <h2 className="text-3xl font-semibold mb-6">Available Jobs for Mock Interviews</h2>
        {loading ? (
          <div className="text-center text-gray-500">Loading jobs...</div>
        ) : error ? (
          <Card className="border border-gray-300 shadow-sm">
            <CardContent className="p-4">
              <p className="text-red-500">{error}</p>
            </CardContent>
          </Card>
        ) : jobs.length === 0 ? (
          <Card className="border border-gray-300 shadow-sm">
            <CardContent className="p-4">
              <p>No jobs available at the moment. Check back later!</p>
            </CardContent>
          </Card>
        ) : (
          <JobList jobs={jobs} />
        )}
      </div>
    </div>
  );
}

export default Home;