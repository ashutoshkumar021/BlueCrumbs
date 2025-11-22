const mongoose = require('mongoose');

const userPropertySchema = new mongoose.Schema({
  project_name: {
    type: String,
    trim: true
  },
  builder_name: {
    type: String,
    trim: true
  },
  project_type: {
    type: String,
    trim: true
  },
  min_price: {
    type: String,
    trim: true
  },
  max_price: {
    type: String,
    trim: true
  },
  size_sqft: {
    type: String,
    trim: true
  },
  bhk: {
    type: String,
    trim: true
  },
  status_possession: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  base_location: {
    type: String,
    trim: true
  },
  rera_number: {
    type: String,
    trim: true
  },
  possession_date: {
    type: String,
    trim: true
  },
  photos: {
    type: [String],
    default: []
  },
  owner_name: {
    type: String,
    trim: true,
    required: true
  },
  owner_email: {
    type: String,
    trim: true
  },
  owner_phone: {
    type: String,
    trim: true,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserProperty', userPropertySchema);
