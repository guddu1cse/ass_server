require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const geoip = require('geoip-lite');
const Question = require('./models/Question');
const Application = require('./models/Application');
const Visit = require('./models/Visit');
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

async function getGeoLocation(ip) {
    const cleanIp = ip.split(',')[0].trim().replace(/^::ffff:/, '');

    try {
        const response = await fetch(`https://api.ipapi.com/api/${cleanIp}?access_key=${process.env.IP_KEY}`);

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        return {
            country: data.country_name || 'Unknown',
            city: data.city || 'Unknown',
            region: data.region_name || 'Unknown',
            isp: data.org || 'Unknown'
        };
    } catch (error) {
        console.error('Error fetching geolocation:', error.message);
        return {
            country: 'Unknown',
            city: 'Unknown',
            region: 'Unknown',
            isp: 'Unknown'
        };
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

        const originHeader = req.headers['origin'] || req.headers['referer'] || '';
        let recipient = process.env.MAIL_TO;
        let recipientName = '';
        if (originHeader.includes('guddu')) {
            recipient = process.env.MAIL_TO_GUDDU;
            recipientName = 'Guddu';
        } else if (originHeader.includes('lucky')) {
            recipient = process.env.MAIL_TO_LUCKY;
            recipientName = 'Lucky';
        }

        const newApplication = new Application({
            description,
            email,
            hrName,
            organization,
            phone,
            role,
            salary: salary || "",
            origin: originHeader
        });

        const savedApplication = await newApplication.save();
        console.log('Application submitted successfully:', savedApplication);

        // Send notification email asynchronously
        const emailSubject = 'New Job Application Received';
        const greeting = recipientName ? `Hi ${recipientName},\n\n` : 'Hi,\n\n';
        const emailMessage = `
            ${greeting}
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
        sendNotificationEmail(emailSubject, emailMessage, recipient)
            .then(() => console.log('Email sent successfully'))
            .catch(err => console.error('Error sending email:', err));

        // Send response immediately
        res.status(204).send();
    } catch (err) {
        console.error('Error submitting application:', err);
        res.status(500).json({ error: 'Error submitting application' });
    }
});

app.post('/api/track-visit', async (req, res) => {
    try {
        const ipAddress = req.headers['x-forwarded-for'] ||
            req.headers['x-real-ip'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress;

        const userAgent = req.headers['user-agent'];
        const origin = req.headers['origin'] || req.headers['referer'] || 'Unknown';
        const cleanIp = ipAddress.replace(/^::ffff:/, '');

        // Get location using ipapi.co
        const locationData = await getGeoLocation(cleanIp);

        // Try to find existing visit record
        let visit = await Visit.findOne({ ipAddress: cleanIp });

        if (visit) {
            // Update existing visit
            visit.visitCount += 1;
            visit.lastVisit = new Date();
            visit.userAgent = userAgent; // Update user agent
            visit.origin = origin;
            await visit.save();
        } else {
            // Create new visit
            visit = new Visit({
                ipAddress: cleanIp,
                userAgent,
                origin,
                location: {
                    country: locationData?.country || 'Unknown',
                    city: locationData?.city || 'Unknown',
                    region: locationData?.region || 'Unknown',
                    isp: locationData?.isp || 'Unknown'
                }
            });
            await visit.save();
        }

        console.log('Visit tracked:', {
            ip: cleanIp,
            visitCount: visit.visitCount,
            origin: visit.origin,
            location: locationData
        });

        res.status(201).json({
            message: 'Visit tracked successfully',
            visitData: {
                ip: cleanIp,
                visitCount: visit.visitCount,
                origin: visit.origin,
                location: locationData
            }
        });
    } catch (err) {
        console.error('Error tracking visit:', err);
        res.status(500).json({ error: 'Error tracking visit' });
    }
});

app.post('/api/find-visits', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (
            username !== process.env.API_USERNAME ||
            password !== process.env.API_PASSWORD
        ) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Fetch all visits from MongoDB
        const visits = await Visit.find({});
        // Only include visits with valid origin, country, region, and city
        const visitList = visits
            .map(visit => ({
                origin: visit.origin || 'Unknown',
                country: visit.location?.country || 'Unknown',
                region: visit.location?.region || 'Unknown',
                city: visit.location?.city || 'Unknown',
                count: visit.visitCount || 0,
                lastVisitDate: visit.lastVisit ? convertIst(visit.lastVisit) : null
            }))
            .filter(v => v.origin !== 'Unknown' && v.country !== 'Unknown' && v.region !== 'Unknown' && v.city !== 'Unknown');

        // Get all unique origins, ignoring 'Unknown'
        const Origins = [...new Set(visitList.map(v => v.origin))].filter(origin => origin !== 'Unknown');

        // Aggregate countries -> regions -> cities
        const countryMap = {};
        visitList.forEach(v => {
            const { country, region, city } = v;
            if (!countryMap[country]) {
                countryMap[country] = { countryName: country, count: 0, regions: {} };
            }
            countryMap[country].count += 1;
            if (!countryMap[country].regions[region]) {
                countryMap[country].regions[region] = { regionName: region, count: 0, cities: {} };
            }
            countryMap[country].regions[region].count += 1;
            if (!countryMap[country].regions[region].cities[city]) {
                countryMap[country].regions[region].cities[city] = { cityName: city, count: 0 };
            }
            countryMap[country].regions[region].cities[city].count += 1;
        });
        const countries = Object.values(countryMap).map(country => ({
            countryName: country.countryName,
            count: country.count,
            regions: Object.values(country.regions).map(region => ({
                regionName: region.regionName,
                count: region.count,
                cities: Object.values(region.cities)
            }))
        }));

        return res.status(200).json({
            visits: visitList,
            Origins,
            countries
        });
    } catch (err) {
        console.error('Error in /api/find-visits:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    fetchData();
}); 