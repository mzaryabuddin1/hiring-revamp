const Joi = require("joi").extend(require("joi-phone-number"));
const jwt = require("jsonwebtoken");
// const argon2 = require("argon2");
const {
  sendEmail,
  generatePasswordHash,
  verifyPassword,
} = require("../../helper/functions");
const User = require("../../models/User");

const authCrtl = {
  // Register User
  register: async (req, res) => {
    try {
      // Define Joi Schema
      const schema = Joi.object({
        phone: Joi.string()
          .phoneNumber({
            defaultCountry: "PK", // Default country code
            format: "international", // E.164 format
            strict: true, // Only valid numbers
          })
          .required()
          .messages({
            "string.empty": "Phone number is required",
            "phoneNumber.invalid": "Invalid phone number format",
          }),
        email: Joi.string().email().required(),
        password: Joi.string()
          .pattern(new RegExp("^(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9]).{8,}$"))
          .required()
          .messages({
            "string.pattern.base":
              "Password must contain at least one uppercase letter, one special character, one number, and be at least 8 characters long.",
          }),
        country: Joi.string().required(),
        middle_name: Joi.string().optional(),
        first_name: Joi.string().required(),
        last_name: Joi.string().required(),
        bio: Joi.string().optional(),
        dob: Joi.date().less("now").required().messages({
          "date.less": "Date of birth must be in the past.",
        }),
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
              end_date: Joi.date().optional().allow(null),
              current_job_status: Joi.boolean().required(),
              description: Joi.string().optional(),
              location: Joi.string().optional(),
              location_type: Joi.string()
                .valid("On-site", "Hybrid", "Remote")
                .required(),
              skills: Joi.array().items(Joi.string()).optional(),
              media: Joi.array().items(Joi.string()).optional(),
            }).custom((value, helpers) => {
              // Custom validation for `end_date` and `current_job_status`
              if (value.current_job_status && value.end_date) {
                return helpers.message(
                  "End date should not be entered if current job status is true."
                );
              }
              return value; // Validation passed
            })
          )
          .optional(),
      });

      // Validate Input
      const { error, value } = schema.validate(req.body, { abortEarly: false }); // Validate all fields
      if (error) {
        return res.status(400).json({
          error: error.details[0].message, // Send all validation errors
        });
      }

      value.email = value.email.toLowerCase();

      // Check for Existing User
      const existingUser = await User.findOne({
        $or: [{ email: value.email }, { phone: value.phone }],
      });
      if (existingUser) {
        return res.status(400).json({ error: "User already exists!" });
      }

      // Hash Password
      const hash = generatePasswordHash(value.password);
      value.salt = "salt";

      // Create User
      const user = new User({
        ...value,
        password: hash,
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

      res.status(201).json({
        success: "Registration successful",
        access_token,
      });
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
        // email: Joi.string().email().optional(),
        phone: Joi.string()
          .phoneNumber({
            defaultCountry: "PK",
            format: "international",
            strict: true,
          })
          .required(),
          password: Joi.string()
          .pattern(new RegExp("^(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9]).{8,}$"))
          .required()
          .messages({
            "string.pattern.base":
              "Password must contain at least one uppercase letter, one special character, one number, and be at least 8 characters long.",
          }),
      }).required(); // Require either email or phone, but not both

      // Validate Input
      const { error, value } = schema.validate(req.body);
      if (error)
        return res.status(400).json({ error: error.details[0].message });

      // Find User
      const user = await User.findOne({ phone: value.phone });
      if (!user) return res.status(400).json({ error: "User not found" });

      // Verify Password
      const validPassword = verifyPassword(
        value.password,
        "salt",
        user.password
      );
      console.log(value.password, user.password)

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
        email: Joi.string().email().optional(),
        phone: Joi.string()
          .phoneNumber({
            defaultCountry: "PK",
            format: "international",
            strict: true,
          })
          .optional(),
      }).xor("email", "phone"); // Require either email or phone, but not both

      // Validate Input
      const { error, value } = schema.validate(req.body);
      if (error)
        return res.status(400).json({ error: error.details[0].message });

      // Find User
      const user = await User.findOne({
        $or: [{ email: value.email?.toLowerCase() }, { phone: value.phone }],
      });
      if (!user) return res.status(400).json({ error: "User not found" });

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000);
      const expireTime = new Date(Date.now() + 5 * 60 * 1000);

      // Update User with OTP
      user.passwordResetOTP = otp;
      user.passwordResetOTPExpires = expireTime;

      await user.save();

      // Send OTP Email or SMS
      if (value.email) {
        await sendEmail({
          to: user.email,
          subject: "Password Reset OTP",
          message: `Your OTP is ${otp}. It is valid for 5 minutes.`,
        });
      } else {
        // SMS logic if needed
        console.log(`OTP sent to phone ${user.phone}: ${otp}`);
      }

      res.status(200).json({ success: "OTP sent successfully" });
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
        email: Joi.string().email().optional(),
        phone: Joi.string()
          .phoneNumber({
            defaultCountry: "PK",
            format: "international",
            strict: true,
          })
          .optional(),
        password: Joi.string()
          .pattern(new RegExp("^(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9]).{8,}$"))
          .required()
          .messages({
            "string.pattern.base":
              "Password must contain at least one uppercase letter, one special character, one number, and be at least 8 characters long.",
          }),
        otp: Joi.string().length(6).required(),
      }).xor("email", "phone"); // Require either email or phone, but not both

      // Validate Input
      const { error, value } = schema.validate(req.body);
      if (error)
        return res.status(400).json({ error: error.details[0].message });

      // Find User
      const user = await User.findOne({
        $or: [{ email: value.email?.toLowerCase() }, { phone: value.phone }],
      });
      if (!user) return res.status(400).json({ error: "User not found" });

      // Validate OTP
      if (!user.passwordResetOTP || user.passwordResetOTP !== value.otp)
        return res.status(400).json({ error: "Invalid or expired OTP" });
      if (new Date() > user.passwordResetOTPExpires)
        return res.status(400).json({ error: "OTP expired" });


      // Update Password and Clear OTP
      const hash = generatePasswordHash(value.password);
      user.password = hash;
      user.salt = "salt";
      user.passwordOTPUsed = true;
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
