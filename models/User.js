const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    first_name: { type: String, required: true },
    middle_name: { type: String },
    last_name: { type: String, required: true },
    avatar: {
      type: String,
      default:
        "https://img.freepik.com/free-vector/colorful-letter-gradient-logo-design_474888-2309.jpg",
    },
    bio: { type: String },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: true,
    },
    location: {
      lat: { type: Number },
      long: { type: Number },
    },
    other_contacts: { type: [String] },
    referral_code: { type: String },
    referral_points: { type: Number, default: 0 },
    referral_count: { type: Number, default: 0 },
    referral_history: [
      {
        referral_code: { type: String },
        referred_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    address: { type: String },
    verified: { type: Boolean, default: false },
    passwordResetOTP: { type: Number },
    passwordResetOTPExpires: { type: Date },
    lastLogin: { type: Date },
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
    password: { type: String, required: true },
    salt: { type: String, required: true },
    profile_information: {
      cv: { type: String },
      skills: { type: [String] },
    },
    social_media: { type: [String] },
    experiences: [
      {
        title: { type: String, required: true },
        employment_type: {
          type: String,
          enum: [
            "Full-time",
            "Part-time",
            "Self-employed",
            "Freelance",
            "Contract",
            "Internship",
            "Apprenticeship",
            "Seasonal",
            "Other",
          ],
          required: true,
        },
        organization: { type: String },
        start_date: { type: Date, required: true },
        end_date: { type: Date },
        current_job_status: { type: Boolean, default: false },
        description: { type: String },
        location: { type: String },
        location_type: {
          type: String,
          enum: ["On-site", "Hybrid", "Remote"],
          required: true,
        },
        skills: { type: [String] },
        media: { type: [String] },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
