import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Interview from './pages/Interview';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/interview/:jobId" element={<Interview />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;