const express = require('express');
const router = express.Router();

// In-memory storage (replace with PostgreSQL later)
const resumes = {};

// Save resume
router.post('/save', (req, res) => {
  const { userId, resume } = req.body;

  if (!userId || !resume) {
    return res.status(400).json({ error: 'userId and resume are required' });
  }

  if (!resumes[userId]) {
    resumes[userId] = [];
  }

  const id = Date.now().toString();
  const entry = {
    id,
    resume,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  resumes[userId].push(entry);

  res.json({ success: true, id });
});

// Load all resumes for a user
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  const userResumes = resumes[userId] || [];
  res.json({ resumes: userResumes });
});

// Load single resume
router.get('/:userId/:id', (req, res) => {
  const { userId, id } = req.params;
  const userResumes = resumes[userId] || [];
  const found = userResumes.find((r) => r.id === id);

  if (!found) {
    return res.status(404).json({ error: 'Resume not found' });
  }

  res.json(found);
});

// Delete resume
router.delete('/:userId/:id', (req, res) => {
  const { userId, id } = req.params;

  if (!resumes[userId]) {
    return res.status(404).json({ error: 'No resumes found for this user' });
  }

  resumes[userId] = resumes[userId].filter((r) => r.id !== id);
  res.json({ success: true });
});

module.exports = router;
