require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const cardRoutes = require('./routes/cards');
const seedRoutes = require('./routes/seed');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zuzo';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/cards', cardRoutes);
app.use('/api/seed', seedRoutes);

app.listen(PORT, () => {
  console.log(`ZuZo API server running on http://localhost:${PORT}`);
});
