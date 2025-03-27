import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import axios from 'axios';
import parse from 'html-react-parser';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import CodeMirror from '@uiw/react-codemirror';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';

function MockInterview({ job }) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [parsedQuestion, setParsedQuestion] = useState(null);
  const navigate = useNavigate(); 

  
  useEffect(() => {
    if (!job || !job.mockQuestion) {
      setParsedQuestion(null);
      return;
    }
    setParsedQuestion(job.mockQuestion);
  }, [job]);

  
  const languageExtensions = {
    javascript: [javascript()],
    python: [python()],
    java: [java()]
  };

  
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await axios.post('http://54.90.228.139:5001/api/attempts/submit', {
        userId: '507f1f77bcf86cd799439011',
        jobId: job._id,
        code,
        language
      });
      setFeedback(res.data);
    } catch (err) {
      console.error('Submission error:', err);
      if (err.response) {
        setError(`Server error: ${err.response.data.error || err.response.statusText}`);
      } else if (err.request) {
        setError('No response from server. Check if backend is running on port 5001.');
      } else {
        setError('Error submitting code: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleFullScreen = () => setIsFullScreen(!isFullScreen);

  
  const handleBackToHome = () => {
    navigate('/'); 
  };

  
  const renderProblemDetails = (problem) => {
    console.log('Rendering problem:', problem);
    if (!problem || !problem.title) {
      return <p>No problem details available.</p>;
    }

    return (
      <>
        <h2 className="text-lg font-semibold">{problem.title}</h2>
        <p className="mt-2">{problem.description}</p>
        <p className="mt-2 text-sm">Difficulty: {problem.difficulty || 'Not specified'}</p>

        {problem.constraints && Object.keys(problem.constraints).length > 0 && (
          <div className="mt-4">
            <p className="font-medium">Constraints:</p>
            <ul className="list-disc pl-5">
              {Object.entries(problem.constraints).map(([key, value], index) => (
                <li key={index}>{key}{value ? `: ${value}` : ''}</li>
              ))}
            </ul>
          </div>
        )}

        {(problem.input_format || problem.output_format) && (
          <div className="mt-4">
            <p className="font-medium">Input/Output Format:</p>
            <p><strong>Input:</strong> {problem.input_format?.description || 'Not specified'}</p>
            <p><strong>Output:</strong> {problem.output_format?.description || 'Not specified'}</p>
          </div>
        )}

        {problem.examples && problem.examples.length > 0 && (
          <div className="mt-4">
            <p className="font-medium">Examples:</p>
            {problem.examples.map((example, index) => (
              <div key={index} className="mt-2 p-2 bg-gray-100 rounded">
                <p><strong>Input:</strong> {Object.entries(example.input).map(([key, value]) => `${key} = ${JSON.stringify(value)}`).join(', ')}</p>
                <p><strong>Output:</strong> {JSON.stringify(example.output)}</p>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <Button 
          variant="outline" 
          onClick={handleBackToHome}
          className="w-auto"
        >
          Back to Home
        </Button>
      </div>

      <div className={isFullScreen ? 'grid grid-cols-1' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
        {!isFullScreen && (
          <Card className="h-full">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mt-4">Mock Interview Question</h2>
              {renderProblemDetails(parsedQuestion)}
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Select onValueChange={setLanguage} value={language} className="w-1/2">
              <SelectTrigger>
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="java">Java</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={toggleFullScreen}
              className="w-1/2"
            >
              {isFullScreen ? 'Exit Full Screen' : 'Full Screen Editor'}
            </Button>
          </div>

          <CodeMirror
            value={code}
            height={isFullScreen ? '80vh' : '400px'}
            theme={dracula}
            extensions={languageExtensions[language]}
            onChange={(value) => setCode(value)}
            placeholder={`Write your ${language} code here...`}
            className={isFullScreen ? 'border rounded-md' : 'border rounded-md'}
          />

          <Button 
            onClick={handleSubmit} 
            disabled={loading || !code.trim()}
            className="w-full"
          >
            {loading ? 'Submitting...' : 'Submit Code'}
          </Button>

          {error && (
            <Card>
              <CardContent className="p-4">
                <p className="text-red-500">{error}</p>
              </CardContent>
            </Card>
          )}

          {feedback && !error && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <h3 className="text-lg font-semibold">Feedback</h3>
                {feedback.results && feedback.results.length > 0 ? (
                  feedback.results.map((result, index) => (
                    <div key={index} className="mt-2">
                      <p><strong>Test Case {index + 1}:</strong> {result.passed ? 'Passed ✅' : 'Failed ❌'}</p>
                      <p><strong>Input:</strong> {Object.entries(result.input).map(([key, value]) => `${key} = ${JSON.stringify(value)}`).join(', ')}</p>
                      <p><strong>Expected Output:</strong> {result.expectedOutput ? JSON.stringify(result.expectedOutput) : 'Not available'}</p>
                      <p><strong>Actual Output:</strong> {result.actualOutput ? JSON.stringify(result.actualOutput) : 'Not available'}</p>
                    </div>
                  ))
                ) : (
                  <p>No test cases were executed. Please ensure the mock question has test cases or check the backend for issues.</p>
                )}
                {feedback.aiFeedback && (
                  <div className="mt-4">
                    <p><strong>AI Feedback:</strong></p>
                    <p>{feedback.aiFeedback}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {!isFullScreen && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold">Job Description</h3>
            <div className="mt-2 prose">{parse(job.description)}</div>
            <p className="mt-2 text-sm">Company: {job.companyName}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default MockInterview;