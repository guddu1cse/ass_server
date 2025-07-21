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
const sendNotificationEmail = async (subject, message, recipient) => {
    try {
        const istTime = new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour12: true,
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });

        // message is now an object
        const {
            greeting = '',
            role = '',
            organization = '',
            hrName = '',
            email = '',
            phone = '',
            salary = '',
            description = ''
        } = message || {};

        const textBody = `${greeting}A new job application has been received:\nRole: ${role}\nOrganization: ${organization}\nHR Name: ${hrName}\nEmail: ${email}\nPhone: ${phone}\nSalary: ${salary}\n\nDescription: ${description}`;

        const htmlBody = `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; background-color: #f4f4f7; color: #333;">
                    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08); padding: 32px;">
                    
                    <h2 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">${subject}</h2>
                    
                    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">${greeting}A new job application has been received with the following details:</p>

                    <table style="width: 100%; font-size: 16px; line-height: 1.6; border-collapse: collapse;">
                        <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Role:</td>
                        <td style="padding: 8px 0;">${role}</td>
                        </tr>
                        <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Organization:</td>
                        <td style="padding: 8px 0;">${organization}</td>
                        </tr>
                        <tr>
                        <td style="padding: 8px 0; font-weight: bold;">HR Name:</td>
                        <td style="padding: 8px 0;">${hrName}</td>
                        </tr>
                        <tr>
                        <td style="padding: 8px 0; font-weight: bold;">HR Email:</td>
                        <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #0066cc; text-decoration: none;">${email}</a></td>
                        </tr>
                        <tr>
                        <td style="padding: 8px 0; font-weight: bold;">HR Phone:</td>
                        <td style="padding: 8px 0;">${phone}</td>
                        </tr>
                        <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Expected Salary:</td>
                        <td style="padding: 8px 0;">${salary}</td>
                        </tr>
                    </table>

                    <div style="margin-top: 24px;">
                        <p style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">Description:</p>
                        <p style="font-size: 16px; line-height: 1.6; background-color: #f9f9f9; padding: 16px; border-radius: 6px; border: 1px solid #e0e0e0;">${description}</p>
                    </div>

                    <hr style="margin: 32px 0; border: none; border-top: 1px solid #e0e0e0;">

                    <p style="font-size: 14px; color: #888888;">📅 Sent on: <strong>${istTime} (IST)</strong></p>
                    </div>
                </div>
                `;


        const mailOptions = {
            from: process.env.MAIL_FROM,
            to: recipient,
            subject: subject,
            text: textBody,
            html: htmlBody
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