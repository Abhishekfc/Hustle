const express = require('express');
const Card = require('../models/Card');

const router = express.Router();

const sampleCards = [
  { title: 'Analytics', category: 'Tools', letter: 'A', order: 1 },
  { title: 'Dashboard', category: 'Tools', letter: 'D', order: 2 },
  { title: 'Reports', category: 'Data', letter: 'R', order: 3 },
  { title: 'Projects', category: 'Work', letter: 'P', order: 4 },
  { title: 'Tasks', category: 'Work', letter: 'T', order: 5 },
  { title: 'Charts', category: 'Data', letter: 'C', order: 6 },
  { title: 'Settings', category: 'Config', letter: 'S', order: 7 },
  { title: 'Users', category: 'Admin', letter: 'U', order: 8 },
  { title: 'Files', category: 'Resources', letter: 'F', order: 9 },
  { title: 'Logs', category: 'Data', letter: 'L', order: 10 },
  { title: 'Billing', category: 'Admin', letter: 'B', order: 11 },
  { title: 'Support', category: 'Resources', letter: 'S', order: 12 }
];

router.post('/', async (req, res) => {
  try {
    await Card.deleteMany({});
    await Card.insertMany(sampleCards);
    res.json({ message: 'Database seeded with sample cards' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
