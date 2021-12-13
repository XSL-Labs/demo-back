const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: [true, 'Missing challenge id'],
  },
  verifiableCredentials: {
    type: Array,
    default: []
  },
  query: {
    type: Array,
    default: []
  },
  purpose: {
    type: String
  },
  state: {
    type: String,
    enum: ['waiting', 'treating', 'validated', 'expired'],
    default: 'waiting',
  },
  verifiablePresentation: {
    type: Object,
    default: {}
  },
  userDid: {
    type: String
  },
  message: {
    type: String
  },
  created: {
    type: Date,
    default: Date.now,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

const Challenge = mongoose.model('Challenge', challengeSchema);

module.exports = Challenge;
