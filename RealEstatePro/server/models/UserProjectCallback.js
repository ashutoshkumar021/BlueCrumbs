const mongoose = require('mongoose');

const userProjectCallbackSchema = new mongoose.Schema({
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
  user_property_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserProperty'
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'converted', 'not_interested'],
    default: 'pending'
  }
}, {
  timestamps: true
});

userProjectCallbackSchema.index({ status: 1 });
userProjectCallbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model('UserProjectCallback', userProjectCallbackSchema);
