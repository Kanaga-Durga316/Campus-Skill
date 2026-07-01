const express = require('express');
const router = express.Router();
let ExchangeRequest;
try { ExchangeRequest = require('../models/ExchangeRequest'); } catch (e) { ExchangeRequest = null; }

// GET /api/requests
router.get('/', async (req, res) => {
  try {
    if (!ExchangeRequest) return res.json([]);
    const items = await ExchangeRequest.find().limit(200).populate('requester responder skillRequested skillOffered');
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/requests
router.post('/', async (req, res) => {
  try {
    if (!ExchangeRequest) return res.status(500).json({ error: 'Model not found' });
    const it = await ExchangeRequest.create(req.body);
    res.status(201).json(it);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/requests/:id (update status/message)
router.patch('/:id', async (req, res) => {
  try {
    const it = await ExchangeRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(it);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
