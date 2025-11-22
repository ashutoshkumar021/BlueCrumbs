const mongoose = require('mongoose');

const serchBoxFormSchema = new mongoose.Schema({
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
  location: {
    type: String,
    trim: true
  },
  property_type: {
    type: String,
    trim: true
  },
  project_name: {
    type: String,
    trim: true
  },
  builder_name: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

serchBoxFormSchema.index({
  email: 1,
  phone: 1,
  project_name: 1,
  location: 1,
  createdAt: -1
});

module.exports = mongoose.model('SerchBoxForm', serchBoxFormSchema);
