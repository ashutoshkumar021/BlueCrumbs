const mongoose = require('mongoose');

const projectCallbackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  project_name: {
    type: String,
    required: true,
    trim: true
  },
  builder_name: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'converted', 'not_interested'],
    default: 'pending'
  }
}, {
  timestamps: true
});

projectCallbackSchema.index({ status: 1 });
projectCallbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ProjectCallback', projectCallbackSchema);
