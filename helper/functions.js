require('dotenv').config()
const nodemailer = require("nodemailer");

const sendEmail = async ({subject, message, to}) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASSWORD,
        },
    });

    try {
        await transporter.sendMail({
            from: `"Inventory System" <${process.env.EMAIL}>`,
            to,
            subject: subject,
            html: message,
        });
        return true
    } catch (error) {
        console.error("Error sending email:", error.message);
        return false
    }
}

module.exports = { sendEmail };