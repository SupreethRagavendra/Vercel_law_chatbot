import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';

const app = express();
const API_KEY = 'AIzaSyAE1CYD7nrpDpO2DHL8nyfTvD0_qS27dBk';

app.use(bodyParser.json());

app.post('/get-answer', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const isLawRelated = checkLawRelated(prompt);

  if (!isLawRelated) {
    return res.json({ answer: 'This question is not related to law. Please ask a legal question.' });
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.candidates && response.data.candidates.length > 0) {
      const content = response.data.candidates[0].content;
      return res.json({ answer: content.parts[0].text || 'No answer found.' });
    } else {
      return res.json({ error: 'No valid answer received from the Gemini API.' });
    }
  } catch (error) {
    console.error('Error while calling Gemini API:', error.response?.data || error.message);
    return res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

function checkLawRelated(question) {
  const lawKeywords = [
    'law', 'legal', 'property dispute case', 'rights', 'court', 'justice', 'lawsuit', 
    'lawyer', 'section', 'murder', 'divorce', 'patent', 'harassment'
  ];
  return lawKeywords.some(keyword => question.toLowerCase().includes(keyword));
}

app.use(express.static('public'));

module.exports = app; // Required for Vercel
