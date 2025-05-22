require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Question = require('./models/Question');
const app = express();

// middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// db config
mongoose.connect('mongodb+srv://guddu1cse:D!xncUC4HdmeLh!@cluster0.ooakn6b.mongodb.net/db?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('db connection successful'))
    .catch(err => console.error('unable to connect to MongoDB', err));


app.get('/api/questions', async (req, res) => {
    try {
        const questions = await Question.find();
        res.json(questions);
    } catch (err) {
        console.error('Error fetching questions:', err);
        res.status(500).json({ error: 'Error fetching questions' });
    }
});

app.post('/api/submit-test', async (req, res) => {
    try {
        const { questions } = req.body;

        const updatePromises = questions.map(question =>
            Question.findByIdAndUpdate(
                question._id,
                {
                    status: question.status,
                    selectedAnswers: question.selectedAnswers
                },
                { new: true }
            )
        );

        await Promise.all(updatePromises);
        res.json({ message: 'Test results saved successfully' });
    } catch (err) {
        console.error('Error saving test results:', err);
        res.status(500).json({ error: 'Error saving test results' });
    }
});

app.delete('/api/questions', async (req, res) => {
    try {
        await Question.deleteMany({});
        console.log('All questions deleted successfully');
        res.json({ message: 'All questions deleted successfully' });
    } catch (err) {
        console.log('error in cleaning quetions list');
        res.status(500).json({ error: 'error deleting questions' });
    }
});

app.post('/api/questions', async (req, res) => {
    try {
        const { question, options, correctAnswer, status, selectedAnswers } = req.body;

        if (!question || !options || !correctAnswer) {
            console.error('Question, options, and correctAnswer are required');
            return res.status(400).json({ error: 'Question, options, and correctAnswer are required' });
        }

        const newQuestion = new Question({
            question,
            options,
            correctAnswer,
            status: status || 'NOT_ATTEMPTED',
            selectedAnswers: selectedAnswers || null
        });

        const savedQuestion = await newQuestion.save();
        console.log('Question added successfully:', savedQuestion);
        res.status(201).json(savedQuestion);
    } catch (err) {
        console.error('Error adding question:', err);
        res.status(500).json({ error: 'Error adding question' });
    }
});

app.get('/api/test', (req, res) => {
    res.json({
        message: 'Server is running',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 