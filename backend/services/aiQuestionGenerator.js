const { OpenAI } = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

const extractRelevantInfo = (jobDescription) => {
  const lowerDesc = jobDescription.toLowerCase();
  let relevantInfo = '';
  const responsibilityMarkers = ['key responsibilities', 'responsibilities', 'duties', 'tasks'];
  const qualificationMarkers = ['qualifications', 'requirements', 'skills', 'you have', 'made for you if you'];

  for (const marker of responsibilityMarkers) {
    const startIdx = lowerDesc.indexOf(marker);
    if (startIdx !== -1) {
      const sectionStart = jobDescription.indexOf('<ul', startIdx) || startIdx;
      const sectionEnd = jobDescription.indexOf('</ul>', sectionStart) + 5 || jobDescription.length;
      relevantInfo += jobDescription.substring(sectionStart, sectionEnd) + '\n';
      break;
    }
  }

  for (const marker of qualificationMarkers) {
    const startIdx = lowerDesc.indexOf(marker);
    if (startIdx !== -1) {
      const sectionStart = jobDescription.indexOf('<ul', startIdx) || startIdx;
      const sectionEnd = jobDescription.indexOf('</ul>', sectionStart) + 5 || jobDescription.length;
      relevantInfo += jobDescription.substring(sectionStart, sectionEnd) + '\n';
      break;
    }
  }

  if (!relevantInfo) {
    const lines = jobDescription.split('\n').filter(line => {
      const lowerLine = line.toLowerCase();
      return (
        lowerLine.includes('typescript') ||
        lowerLine.includes('react') ||
        lowerLine.includes('golang') ||
        lowerLine.includes('geometry') ||
        lowerLine.includes('three.js') ||
        lowerLine.includes('knowledge') ||
        lowerLine.includes('understanding') ||
        lowerLine.includes('autonomous') ||
        lowerLine.includes('proactive') ||
        lowerLine.includes('code') ||
        lowerLine.includes('problem') ||
        lowerLine.includes('english') ||
        lowerLine.match(/have|are|like to/i)
      );
    });
    relevantInfo = lines.join('\n');
  }

  const cleanedInfo = relevantInfo
    .replace(/<[^>]+>/g, '')
    .replace(/\n+/g, '\n')
    .trim();

  return cleanedInfo || jobDescription.replace(/<[^>]+>/g, '').trim();
};

const generateMockQuestion = async (jobTitle, jobDescription) => {
  const relevantDescription = extractRelevantInfo(jobDescription);
  console.log('Extracted relevant description:', relevantDescription);

  const prompt = `
   Generate a coding interview question relevant to the job title "${jobTitle}" and the following responsibilities and qualifications: "${relevantDescription}". 
    The question should be a practical coding problem that can be solved in JavaScript, with a clear input and output format, and should be suitable for a mock interview platform where users write and submit code. 
    Return ONLY a raw JSON object with no additional text, markdown, or backticks:
    {
      "title": "Question Title",
      "description": "Question Description (150-200 words, describing a coding problem with a clear goal, e.g., write a function to process data in a decentralized system)",
      "difficulty": "Difficulty Level (Easy, Medium, Hard)",
      "constraints": {"key": "value", "e.g.,": "array length <= 1000"},
      "input_format": {"description": "Description of the input (e.g., an array of numbers)"},
      "output_format": {"description": "Description of the output (e.g., a sorted array)"},
      "examples": [
        {"input": {"key": "value"}, "output": "expected output"},
        {"input": {"key": "value"}, "output": "expected output"}
      ]
    }
    Ensure the JSON is valid, with proper commas and brackets, especially in the "examples" array.
  `;

  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not set in environment. Using hardcoded key.');
  }

  try {
    console.log('Attempting OpenAI API call with jobTitle:', jobTitle);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a coding interview question generator that outputs ONLY raw JSON, with no additional text, markdown, or backticks. Ensure the question is relevant to the job title and provided responsibilities/qualifications, includes all specified fields, has a 150-200 word description, and is syntactically valid JSON with correct commas and brackets.' 
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 10000, 
      temperature: 0.5
    });

    console.log('OpenAI API response:', response);

    const rawContent = response.choices[0].message.content.trim();
    console.log('Raw OpenAI response content:', rawContent);

    let parsedQuestion;
    try {
      parsedQuestion = JSON.parse(rawContent);
      console.log('Parsed mock question:', parsedQuestion);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError.message);
      console.error('Error position:', parseError.message.match(/position (\d+)/)?.[1] || 'unknown');
      console.error('Raw content near error:', rawContent.substring(Math.max(0, parseError.message.match(/position (\d+)/)?.[1] - 20 || 0), parseError.message.match(/position (\d+)/)?.[1] + 20));
      throw new Error('Invalid JSON response from OpenAI');
    }

    const requiredFields = ['title', 'description', 'difficulty', 'constraints', 'input_format', 'output_format', 'examples'];
    const missingFields = requiredFields.filter(field => !parsedQuestion[field]);
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      throw new Error('Generated question is incomplete');
    }

    return parsedQuestion;
  } catch (error) {
    console.error('Error generating mock question:', error.message);
    if (error.response) {
      console.error('OpenAI API error details:', error.response.data);
    }
    return {
      title: "Fallback Question",
      description: "Write a function to reverse a string. Given a string input, return a new string with its characters reversed. For example, if the input is 'hello', the output should be 'olleh'. The solution should handle empty strings and single-character strings correctly. Constraints: The string length is between 0 and 10^5 characters. Time complexity should be O(n) where n is the string length.",
      difficulty: "Easy",
      constraints: { "0 <= string.length <= 10^5": "" },
      input_format: { description: "A string" },
      output_format: { description: "A reversed string" },
      examples: [
        { input: { string: "hello" }, output: "olleh" },
        { input: { string: "" }, output: "" },
        { input: { string: "a" }, output: "a" }
      ]
    };
  }
};

module.exports = { generateMockQuestion };