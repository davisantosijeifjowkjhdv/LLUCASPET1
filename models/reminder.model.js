const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['vaccination', 'deworming', 'vet-visit', 'medication', 'feeding', 'grooming', 'other'], required: true },
  frequency: { type: String, enum: ['one-time', 'daily', 'weekly', 'monthly', 'yearly'] },
  nextDue: { type: Date },
  lastNotified: { type: Date },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

reminderSchema.pre('save', function(next) {
  next();
});

module.exports = mongoose.model('Reminder', reminderSchema);