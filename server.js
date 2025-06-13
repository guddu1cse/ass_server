require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Question = require('./models/Question');
const Application = require('./models/Application');
const { sendNotificationEmail } = require('./utils/mailService');
const app = express();
let serverStartRequestTime = null;
let serverStartedResponseTime = null;
let serverErrorTime = null;
let serverError = null;

// middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// db config
mongoose.connect(`${process.env.MONGODB_URI}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
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
        serverStartTime: serverStartRequestTime,
        serverStartResponseTime: serverStartedResponseTime,
        serverError: serverError,
        serverErrorTime: serverErrorTime,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/up', (req, res) => {
    res.json({
        message: 'Server is running',
    });
});

function convertIst(utcTime) {
    const date = new Date(utcTime);
    return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

const url = process.env.BASE_URL + '/api/up';
async function fetchData() {
    try {
        serverStartRequestTime = convertIst(new Date().toISOString());
        console.log('ping server: ', url);
        await fetch(url);
        serverStartedResponseTime = convertIst(new Date().toISOString());
        serverError = null;
        serverErrorTime = null;
    } catch (err) {
        serverError = err;
        serverErrorTime = convertIst(new Date().toISOString());
    } finally {
        setTimeout(fetchData, 60 * 1000 * 5); //5 minutes
    }
}

app.post('/api/application', async (req, res) => {
    try {
        const {
            description,
            email,
            hrName,
            organization,
            phone,
            role,
            salary
        } = req.body;

        if (!description || !email || !hrName || !organization || !phone || !role) {
            return res.status(400).json({ error: 'All required fields must be provided' });
        }

        const newApplication = new Application({
            description,
            email,
            hrName,
            organization,
            phone,
            role,
            salary: salary || ""
        });

        const savedApplication = await newApplication.save();
        console.log('Application submitted successfully:', savedApplication);

        // Send notification email asynchronously
        const emailSubject = 'New Job Application Received';
        const emailMessage = `
            A new job application has been received:
            
            Role: ${role}
            Organization: ${organization}
            HR Name: ${hrName}
            Email: ${email}
            Phone: ${phone}
            Salary: ${salary || 'Not specified'}
            
            Description:
            ${description}
        `;

        // Send email in background without awaiting
        sendNotificationEmail(emailSubject, emailMessage)
            .then(() => console.log('Email sent successfully'))
            .catch(err => console.error('Error sending email:', err));

        // Send response immediately
        res.status(204).send();
    } catch (err) {
        console.error('Error submitting application:', err);
        res.status(500).json({ error: 'Error submitting application' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    fetchData();
}); 