const mongoose = require('mongoose');

const healthSchema = new mongoose.Schema({
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  date: { type: Date, default: Date.now },
  weight: { type: Number },
  temperature: { type: Number },
  appetite: { type: String, enum: ['good', 'reduced', 'poor', 'none'] },
  energyLevel: { type: String, enum: ['very-high', 'high', 'normal', 'low', 'very-low'] },
  bowelMovements: { type: String, enum: ['normal', 'soft', 'hard', 'diarrhea', 'constipation'] },
  vomiting: { type: Boolean, default: false },
  symptoms: [{ type: String }],
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

healthSchema.pre('save', function(next) {
  next();
});

module.exports = mongoose.model('Health', healthSchema);