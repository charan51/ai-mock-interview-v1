import React from 'react';

function Feedback({ feedback }) {
  return (
    <div className="feedback">
      <h3>Feedback</h3>
      <p><strong>Execution Result:</strong> {feedback.executionResult}</p>
      <p><strong>AI Review:</strong> {feedback.aiFeedback}</p>
    </div>
  );
}

export default Feedback;