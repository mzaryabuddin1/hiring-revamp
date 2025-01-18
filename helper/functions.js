require('dotenv').config()
const nodemailer = require("nodemailer");
const crypto = require("crypto");

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

const generatePasswordHash = (password) => {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return { salt, hash };
};

const verifyPassword = (password, salt, hash) => {
    const derivedHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return derivedHash === hash;
};


module.exports = { sendEmail, generatePasswordHash, verifyPassword };