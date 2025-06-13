const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

// Function to send notification email
const sendNotificationEmail = async (subject, message) => {
    try {
        const mailOptions = {
            from: process.env.MAIL_FROM,
            to: process.env.MAIL_TO,
            subject: subject,
            text: message,
            html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>${subject}</h2>
                    <p>${message}</p>
                    <p>Time: ${new Date().toLocaleString()}</p>
                   </div>`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

module.exports = {
    sendNotificationEmail
}; 