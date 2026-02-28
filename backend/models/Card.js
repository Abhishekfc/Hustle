const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, default: '' },
  letter: { type: String, required: true },
  order: { type: Number, default: 0 }
});

module.exports = mongoose.model('Card', cardSchema);
