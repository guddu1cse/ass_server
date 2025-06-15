const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
    ipAddress: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    location: {
        country: String,
        city: String,
        region: String
    }
});

module.exports = mongoose.model('Visit', visitSchema); 