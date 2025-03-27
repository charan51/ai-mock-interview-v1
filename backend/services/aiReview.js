const { OpenAI } = require('openai');
const { NodeVM } = require('vm2');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  timeout: 30000
});

const compareTaskFlowOutput = (actual, expected) => {
  if (!actual || !expected) return false;
  if (actual.completed !== expected.completed) return false;
  if (actual.failed !== expected.failed) return false;
  if (actual.pending !== expected.pending) return false;
  if (!Array.isArray(actual.errors) || !Array.isArray(expected.errors)) return false;
  if (actual.errors.length !== expected.errors.length) return false;
  const sortErrors = (errors) => errors.sort();
  const actualErrors = sortErrors([...actual.errors]);
  const expectedErrors = sortErrors([...expected.errors]);

  for (let i = 0; i < actualErrors.length; i++) {
    if (actualErrors[i] !== expectedErrors[i]) {
      
      if (!actualErrors[i].includes('Error at index') || !actualErrors[i].includes(expectedErrors[i].split(': ')[1])) {
        return false;
      }
    }
  }
  return true;
};
const fallbackTestCases = [
  {
    input: [
      { status: "completed" },
      { status: "failed", error: "Network issue" },
      { status: "pending" },
      { status: "failed", error: "Timeout error" }
    ],
    output: {
      completed: 1,
      failed: 2,
      pending: 1,
      errors: ["Error at index 1: Network issue", "Error at index 3: Timeout error"]
    }
  },
  {
    input: [
      { status: "completed" },
      { status: "completed" },
      { status: "pending" }
    ],
    output: {
      completed: 2,
      failed: 0,
      pending: 1,
      errors: []
    }
  },
  {
    input: [
      { status: "pending" },
      { status: "failed", error: "Database connection failed" },
      { status: "completed" },
      { status: "failed", error: "Invalid input" }
    ],
    output: {
      completed: 1,
      failed: 2,
      pending: 1,
      errors: ["Error at index 1: Database connection failed", "Error at index 3: Invalid input"]
    }
  },
  {
    input: [
      { status: "completed" },
      { status: "completed" },
      { status: "completed" },
      { status: "pending" },
      { status: "failed", error: "Service unavailable" }
    ],
    output: {
      completed: 3,
      failed: 1,
      pending: 1,
      errors: ["Error at index 4: Service unavailable"]
    }
  },
  {
    input: [
      { status: "pending" },
      { status: "pending" },
      { status: "pending" }
    ],
    output: {
      completed: 0,
      failed: 0,
      pending: 3,
      errors: []
    }
  }
];
const generateTestCases = async (mockQuestion) => {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not set. Using fallback test cases.');
    return mockQuestion.examples || fallbackTestCases;
  }

  const prompt = `
    Given the following coding problem, generate 3 additional test cases in JSON format. Each test case should include an "input" and "output" field, adhering to the problem's constraints and input/output format. Return ONLY a raw JSON array with no additional text, markdown, or backticks.

    Problem:
    Title: ${mockQuestion.title}
    Description: ${mockQuestion.description}
    Difficulty: ${mockQuestion.difficulty}
    Constraints: ${JSON.stringify(mockQuestion.constraints)}
    Input Format: ${mockQuestion.input_format?.description || 'Not specified'}
    Output Format: ${mockQuestion.output_format?.description || 'Not specified'}
    Existing Examples: ${JSON.stringify(mockQuestion.examples || [])}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a test case generator that outputs ONLY raw JSON, with no additional text, markdown, or backticks.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.5
    });

    let rawContent = response.choices[0].message.content.trim();
    console.log('Raw test cases response:', rawContent);

    
    if (rawContent.startsWith('```json') && rawContent.endsWith('```')) {
      rawContent = rawContent.slice(7, -3).trim();
    }

    let testCases;
    try {
      testCases = JSON.parse(rawContent);
    } catch (parseError) {
      console.error('Error parsing test cases:', parseError.message);
      throw new Error('Invalid JSON response for test cases');
    }

    if (!Array.isArray(testCases)) {
      throw new Error('Test cases must be an array');
    }

    
    const validatedTestCases = testCases.filter(testCase => {
      const tasks = testCase.input;
      return (
        Array.isArray(tasks) &&
        tasks.length <= 100 &&
        tasks.every(task => task && typeof task.status === 'string')
      );
    });

    return validatedTestCases.length > 0 ? validatedTestCases : (mockQuestion.examples || fallbackTestCases);
  } catch (error) {
    console.error('Error generating test cases:', error.message);
    if (error.response) {
      console.error('OpenAI API error details:', error.response.data);
    }
    return mockQuestion.examples || fallbackTestCases;
  }
};
const executeCode = (code, language, testCase) => {
  const vm = new NodeVM({
    console: 'inherit',
    sandbox: { tasks: testCase.input },
    require: false,
    timeout: 5000
  });

  try {
    if (language === 'javascript') {
      
      const hasProcessTaskFlow = code.includes('function processTaskFlow');
      const hasProcessTasks = code.includes('function processTasks');
      let script;

      if (hasProcessTaskFlow) {
        script = `
          ${code}
          processTaskFlow(tasks);
        `;
      } else if (hasProcessTasks) {
        script = `
          ${code}
          processTasks(tasks);
        `;
      } else {
        
        script = `
          function processTaskFlow(tasks) {
            ${code}
          }
          processTaskFlow(tasks);
        `;
      }
      const result = vm.run(script);
      return result;
    }
    return { error: 'Language not supported' };
  } catch (error) {
    console.error('Execution error:', error.message);
    return { error: error.message };
  }
};
const reviewCode = async (code, language, mockQuestion) => {
  console.log('Starting reviewCode for code:', code);

  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not set in environment.');
    return { executionResult: 'N/A', aiFeedback: 'AI review unavailable: API key missing.' };
  }

  
  const additionalTestCases = await generateTestCases(mockQuestion);
  const allTestCases = [...(mockQuestion.examples || []), ...additionalTestCases];
  console.log('All test cases:', allTestCases);

  
  const executionResults = [];
  let allPassed = true;
  for (const testCase of allTestCases) {
    const result = executeCode(code, language, testCase);
    if (result.error) {
      executionResults.push({
        input: testCase.input,
        expected: testCase.output,
        actual: result.error,
        passed: false
      });
      allPassed = false;
      continue;
    }

    const passed = compareTaskFlowOutput(result, testCase.output);
    allPassed = allPassed && passed;
    executionResults.push({
      input: testCase.input,
      expectedOutput: testCase.output,
      actualOutput: result,
      passed
    });
  }

  const executionSummary = executionResults.map((res, idx) => 
    `Test Case ${idx + 1}: Input: ${JSON.stringify(res.input)}, Expected: ${JSON.stringify(res.expectedOutput)}, Actual: ${res.actualOutput.error ? res.actualOutput : JSON.stringify(res.actualOutput)}, Passed: ${res.passed}`
  ).join('\n');

  console.log('Execution summary:', executionSummary);

  
  const prompt = `
    Review the following ${language} code based on this problem and its execution results:
    Problem: ${mockQuestion.title}
    Description: ${mockQuestion.description}
    Constraints: ${JSON.stringify(mockQuestion.constraints)}
    Input Format: ${mockQuestion.input_format?.description || 'Not specified'}
    Output Format: ${mockQuestion.output_format?.description || 'Not specified'}

    Code:
    \`\`\`${language}
    ${code}
    \`\`\`

    Execution Results:
    ${executionSummary}

    Provide feedback on:
    - Correctness: Does it work for all test cases?
    - Efficiency: Are there performance concerns?
    - Improvements: Suggest specific optimizations or better practices.
    Return the feedback as plain text (not JSON or markdown).
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a coding interview question reviewer.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const aiFeedback = response.choices[0].message.content.trim();
    console.log('Raw OpenAI feedback:', aiFeedback);

    return {
      results: executionResults,
      aiFeedback: aiFeedback
    };
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    if (error.response) {
      console.error('OpenAI API error details:', error.response.data);
    }
    return {
      results: executionResults,
      aiFeedback: 'Failed to get AI feedback due to an error.'
    };
  }
};

module.exports = { reviewCode };