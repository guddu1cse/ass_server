const mongoose = require('mongoose');

const conversessionSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    prompt: {
        type: String,
        required: true
    },
    response: {
        type: String,
        required: false
    },
    timestamp: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

conversessionSchema.index({ sessionId: 1, timestamp: 1 });

module.exports = mongoose.model('Conversession', conversessionSchema);


