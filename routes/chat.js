const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const resumePrompt = require('../prompts/resumePrompt');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  try {
    const filtered = messages.filter((m, i) => !(i === 0 && m.role === 'assistant'));

    const chatMessages = [
      { role: 'system', content: resumePrompt },
      ...filtered.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: chatMessages,
      max_tokens: 2000,
    });

    const rawText = response.choices[0].message.content;
    const cleaned = rawText.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      return res.status(500).json({
        error: 'AI returned invalid JSON',
        raw: rawText,
      });
    }

    res.json(parsed);
  } catch (err) {
    console.error('Groq API error:', err.message);
    res.status(500).json({ error: 'Failed to get response from Groq' });
  }
});

module.exports = router;