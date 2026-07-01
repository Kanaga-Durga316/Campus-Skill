const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
// Skill model placeholder (optional) - if not present, skip
let Skill;
try { Skill = require('../models/Skill'); } catch (e) { Skill = null; }

// GET /api/skills
router.get('/', async (req, res) => {
  try {
    if (!Skill) return res.json([]);
    const skills = await Skill.find().limit(200).populate('owner');
    res.json(skills);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/skills
router.post('/', async (req, res) => {
  try {
    if (!Skill) return res.status(500).json({ error: 'Skill model not found' });
    const skill = await Skill.create(req.body);
    res.status(201).json(skill);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/skills/:id
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const skill = await Skill.findById(req.params.id).populate('owner');
    if (!skill) return res.status(404).json({ error: 'Not found' });
    res.json(skill);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/skills/:id
router.put('/:id', async (req, res) => {
  try {
    const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(skill);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/skills/:id
router.delete('/:id', async (req, res) => {
  try {
    await Skill.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
