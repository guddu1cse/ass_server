const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    hrName: {
        type: String,
        required: true
    },
    organization: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    salary: {
        type: String,
        default: ""
    },
    seen: {
        type: Boolean,
        default: false
    },
    respond: {
        type: Boolean,
        default: false
    },
    seenTime: {
        type: Date,
        default: null
    },
    respondTime: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Application', applicationSchema); 