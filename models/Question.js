const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    options: {
        type: [String],
        required: true
    },
    correctAnswer: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['NOT_ATTEMPTED', 'ANSWERED', 'NOT_ANSWERED', 'REVIEW'],
        default: 'NOT_ATTEMPTED'
    },
    selectedAnswers: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Question', questionSchema); 