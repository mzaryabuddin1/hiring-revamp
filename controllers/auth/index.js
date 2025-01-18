const Joi = require("joi").extend(require("joi-phone-number"));
const jwt = require("jsonwebtoken");
const argon2 = require("argon2");
const { sendEmail } = require("../../helper/functions");
const User = require("../../models/User");

const authCrtl = {
  // Register User
  register: async (req, res) => {
    try {
      // Define Joi Schema
      const schema = Joi.object({
        phone: Joi.string()
          .phoneNumber({
            defaultCountry: "PK", // Set a default country code, e.g., US
            format: "international", // Ensures the phone number is in E.164 format
            strict: true, // Only accept valid numbers
          })
          .required()
          .messages({
            "string.empty": "Phone number is required",
            "phoneNumber.invalid": "Invalid phone number format",
          }),
        email: Joi.string().email().required(),
        password: Joi.string()
          .min(6)
          .pattern(new RegExp("^(?=.*[A-Z])(?=.*[!@#$&*]).*$"))
          .required(),
        first_name: Joi.string().required(),
        middle_name: Joi.string().optional(),
        last_name: Joi.string().required(),
        bio: Joi.string().min(1).optional(),
        dob: Joi.date().optional(),
        gender: Joi.string().valid("male", "female", "other").required(),
        location: Joi.object({
          lat: Joi.number().required(),
          long: Joi.number().required(),
        }).optional(),
        address: Joi.string().min(1).optional(),
        profile_information: Joi.object({
          cv: Joi.string().uri().optional(),
          skills: Joi.array().items(Joi.string()).min(1).optional(),
        }).optional(),
        social_media: Joi.array().items(Joi.string().uri()).min(1).optional(),
        experiences: Joi.array()
          .items(
            Joi.object({
              title: Joi.string().required(),
              employment_type: Joi.string()
                .valid(
                  "Full-time",
                  "Part-time",
                  "Self-employed",
                  "Freelance",
                  "Contract",
                  "Internship",
                  "Apprenticeship",
                  "Seasonal",
                  "Other"
                )
                .required(),
              organization: Joi.string().required(),
              start_date: Joi.date().required(),
              end_date: Joi.date().optional(),
              current_job_status: Joi.boolean().required(),
              description: Joi.string().optional(),
              location: Joi.string().optional(),
              location_type: Joi.string()
                .valid("On-site", "Hybrid", "Remote")
                .required(),
              skills: Joi.array().items(Joi.string()).optional(),
              media: Joi.array().items(Joi.string()).optional(),
            })
          )
          .optional(),
      });

      // Validate Input
      const { error, value } = schema.validate(req.body);
      if (error)
        return res.status(400).json({ error: error.details[0].message });

      value.email = value.email.toLowerCase();

      // Check for Existing User
      const existingUser = await User.findOne({
        $or: [{ email: value.email }, { phone: value.phone }],
      });
      if (existingUser)
        return res.status(400).json({ error: "User already exists!" });

      // Hash Password
      const hashedPassword = await argon2.hash(value.password);

      // Create User
      const user = new User({
        ...value,
        password: hashedPassword,
      });

      await user.save();

      // Generate Access Token
      const access_token = createAccessToken({ id: user._id });

      // Send Welcome Email
      await sendEmail({
        to: user.email,
        subject: "Welcome to Hire",
        message: "Welcome to the hiring app!",
      });

      res
        .status(201)
        .json({ success: "Registration successful", access_token });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Login User
  login: async (req, res) => {
    try {
      // Define Joi Schema
      const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
      });

      // Validate Input
      const { error, value } = schema.validate(req.body);
      if (error)
        return res.status(400).json({ error: error.details[0].message });

      // Find User
      const user = await User.findOne({ email: value.email.toLowerCase() });
      if (!user) return res.status(400).json({ error: "User not found" });

      // Verify Password
      const validPassword = await argon2.verify(user.password, value.password);
      if (!validPassword)
        return res.status(400).json({ error: "Incorrect password" });

      // Generate Access Token
      const access_token = createAccessToken({ id: user._id });

      res.status(200).json({ success: "Login successful", access_token });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Forgot Password
  forgotPassword: async (req, res) => {
    try {
      // Define Joi Schema
      const schema = Joi.object({
        email: Joi.string().email().required(),
      });

      // Validate Input
      const { error, value } = schema.validate(req.body);
      if (error)
        return res.status(400).json({ error: error.details[0].message });

      // Find User
      const user = await User.findOne({ email: value.email.toLowerCase() });
      if (!user) return res.status(400).json({ error: "User not found" });

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000);
      const expireTime = new Date(Date.now() + 5 * 60 * 1000);

      // Update User with OTP
      user.passwordResetOTP = otp;
      user.passwordResetOTPExpires = expireTime;

      await user.save();

      // Send OTP Email
      await sendEmail({
        to: user.email,
        subject: "Password Reset OTP",
        message: `Your OTP is ${otp}. It is valid for 5 minutes.`,
      });

      res.status(200).json({ success: "OTP sent to your email" });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Reset Password
  resetPassword: async (req, res) => {
    try {
      // Define Joi Schema
      const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string()
          .min(6)
          .pattern(new RegExp("^(?=.*[A-Z])(?=.*[!@#$&*]).*$"))
          .required(),
        otp: Joi.string().length(6).required(),
      });

      // Validate Input
      const { error, value } = schema.validate(req.body);
      if (error)
        return res.status(400).json({ error: error.details[0].message });

      // Find User
      const user = await User.findOne({ email: value.email.toLowerCase() });
      if (!user) return res.status(400).json({ error: "User not found" });

      // Validate OTP
      if (!user.passwordResetOTP || user.passwordResetOTP !== value.otp)
        return res.status(400).json({ error: "Invalid or expired OTP" });
      if (new Date() > user.passwordResetOTPExpires)
        return res.status(400).json({ error: "OTP expired" });

      // Hash New Password
      const hashedPassword = await argon2.hash(value.password);

      // Update Password and Clear OTP
      user.password = hashedPassword;
      user.passwordResetOTP = null;
      user.passwordResetOTPExpires = null;

      await user.save();

      res.status(200).json({ success: "Password reset successfully" });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

// Helper Function: Create Access Token
const createAccessToken = (payload) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "365d",
  });
};

module.exports = authCrtl;
