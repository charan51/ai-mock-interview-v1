const axios = require('axios');
const JUDGE0_API_URL = 'https://judge0-ce.p.rapidapi.com/submissions';

const pollJudge0Result = async (token) => {
  const maxAttempts = 10;
  const delayMs = 1000; 

  for (let i = 0; i < maxAttempts; i++) {
    const response = await axios.get(`${JUDGE0_API_URL}/${token}`, {
      headers: {
        'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      },
      params: { base64_encoded: 'false', fields: '*' }
    });

    const result = response.data;
    console.log('Poll result:', result);

    if (result.status.id > 2) { 
      return result;
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  throw new Error('Judge0 processing timed out');
};
exports.executeCode = async (code, language) => {
  const languageMap = {
    javascript: 63,
    python: 71,
    java: 62
  };
  const languageId = languageMap[language];
  if (!languageId) throw new Error('Unsupported language');

  const response = await axios.post(JUDGE0_API_URL, {
    source_code: code,
    language_id: languageId,
    stdin: ''
  }, {
    headers: {
      'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      'Content-Type': 'application/json'
    }
  });

  return await pollJudge0Result(response.data.token);
};