const express = require('express');
const Card = require('../models/Card');

const router = express.Router();

// Get all cards, optionally filtered by category
router.get('/', async (req, res) => {
  try {
    const { category, sort } = req.query;
    let query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    let cards = await Card.find(query).sort({ order: 1 });

    if (sort === 'az') {
      cards.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'za') {
      cards.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sort === 'letter') {
      cards.sort((a, b) => a.letter.localeCompare(b.letter));
    }

    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all unique categories for filter buttons
router.get('/categories', async (req, res) => {
  try {
    const categories = await Card.distinct('category');
    res.json(['all', ...categories.sort()]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
