const mongoose = require('mongoose');

const leetCodeStatsSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    profileData: {
        type: Object,
        default: {}
    },
    contestData: {
        type: Object,
        default: {}
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('LeetCodeStats', leetCodeStatsSchema);
