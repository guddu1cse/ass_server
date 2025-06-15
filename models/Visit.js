const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
    ipAddress: {
        type: String,
        required: true,
        unique: true
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
        region: String,
        isp: String
    },
    visitCount: {
        type: Number,
        default: 1
    },
    origin: {
        type: String,
        default: 'Unknown'
    },
    lastVisit: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Visit', visitSchema); 