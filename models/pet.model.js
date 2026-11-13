const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['dog', 'cat', 'bird', 'other'], required: true },
  breed: { type: String },
  age: { type: Number },
  weight: { type: Number },
  color: { type: String },
  gender: { type: String, enum: ['male', 'female'] },
  size: { type: String, enum: ['small', 'medium', 'large', 'extra-large'] },
  description: { type: String },
  image: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'lost', 'found', 'adopted'], default: 'active' },
  lastSeen: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

petSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Pet', petSchema);