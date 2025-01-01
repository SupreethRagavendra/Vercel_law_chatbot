import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';

const app = express();
const port = 3000;

const API_KEY = 'AIzaSyAE1CYD7nrpDpO2DHL8nyfTvD0_qS27dBk';

app.use(bodyParser.json());

app.post('/get-answer', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Check if the question is law-related
  const isLawRelated = checkLawRelated(prompt);

  if (!isLawRelated) {
    return res.json({ answer: 'This question is not related to law. Please ask a legal question.' });
  }

  try {
    console.log("Making request to Gemini API...");
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

    // Check if the response contains valid candidates and content
    if (response.data.candidates && response.data.candidates.length > 0) {
      const content = response.data.candidates[0].content;
      if (content && content.parts) {
        const generatedContent = content.parts[0].text;
        return res.json({ answer: formatLawAnswer(generatedContent) });
      } else {
        return res.json({ error: 'No relevant legal content found in the response.' });
      }
    } else {
      return res.json({ error: 'No valid answer received from the Gemini API' });
    }
  } catch (error) {
    console.error('Error while calling Gemini API:', error);
    return res.status(500).json({ error: 'An error occurred while setting up the request: ' + error.message });
  }
});

// Function to check if the question is related to law
function checkLawRelated(question) {
  const lawKeywords = ['law', 'legal',  'property dispute case','rights', 'court', 'justice', 'lawsuit', 'lawyer', 'section', 'murder', 'divorce', 'patent', 'harassment'];
  return lawKeywords.some(keyword => question.toLowerCase().includes(keyword));
}

// Function to format the law-related answer
function formatLawAnswer(content) {
  return content
    .split('. ')  // Split content by sentences
    .map((sentence) => `${sentence}.`)  // Add the period back at the end of each sentence
    .join(''); // Join sentences with <br> tag for line breaks in HTML
}

app.use(express.static('public'));

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
