import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';

function JobList({ jobs }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {jobs.map(job => (
        <Card 
          key={job._id} 
          className="border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300"
        >
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{job.title}</CardTitle>
            <p className="text-sm text-gray-500">Company: {job.companyName}</p>
          </CardHeader>
          <CardContent>
            <Link to={`/interview/${job._id}`}>
              <Button className="w-full bg-gray-800 text-white hover:bg-gray-700 rounded-lg">
                Start Mock Interview
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default JobList;