const mongoose = require('mongoose');

const realEstateProjectSchema = new mongoose.Schema({
  project_name: {
    type: String,
    trim: true
  },
  builder_name: {
    type: String,
    trim: true,
    index: true
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
    trim: true,
    index: true
  },
  status_possession: {
    type: String,
    trim: true,
    index: true
  },
  location: {
    type: String,
    trim: true,
    index: true
  },
  base_location: {
    type: String,
    trim: true,
    index: true
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
  }
}, {
  timestamps: true
});

// Add text index for search functionality
realEstateProjectSchema.index({ 
  project_name: 'text', 
  builder_name: 'text', 
  location: 'text' 
});

realEstateProjectSchema.index({
  project_name: 1
}, { unique: true });

module.exports = mongoose.model('RealEstateProject', realEstateProjectSchema);
