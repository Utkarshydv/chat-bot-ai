const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
console.log("Loaded key:", process.env.OPENROUTER_API_KEY);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Dynamically import fetch (ESM compatibility)
let fetch;
(async () => {
  fetch = (await import('node-fetch')).default;
})();

app.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!fetch) {
    return res.status(503).json({ reply: "Server is still initializing, try again shortly." });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: message }
        ]
      })
    });

    const data = await response.json(); // ✅ Declare data here
    console.log("OpenRouter raw response:", data); // ✅ Safe

    const reply = data.choices?.[0]?.message?.content || "No response from model.";
    res.json({ reply });

  } catch (error) {
    console.error('Error from OpenRouter:', error);
    res.status(500).json({ reply: "Server error. Could not connect to AI." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
