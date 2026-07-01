const express = require('express');
const router = express.Router();
let Message;
try { Message = require('../models/Message'); } catch (e) { Message = null; }

// GET /api/messages
router.get('/', async (req, res) => {
  try {
    if (!Message) return res.json([]);
    const items = await Message.find().limit(200).populate('from to requestRef');
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/messages
router.post('/', async (req, res) => {
  try {
    if (!Message) return res.status(500).json({ error: 'Model not found' });
    const it = await Message.create(req.body);
    res.status(201).json(it);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
