const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  did: {
    type: String,
    required: [true, 'Missing user did'],
  },
  verifiableCredentials: {
    type: Object,
    default: []
  },
  created: {
    type: Date,
    default: Date.now(),
  },
  active: {
    type: Boolean,
    default: true,
  }
});

const user = mongoose.model('user', userSchema);

module.exports = user;
