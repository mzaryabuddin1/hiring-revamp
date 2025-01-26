const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // Job title
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    description: { type: String, required: true }, // Job description
    skills: [ { type: String }],
    location_type: {
      type: String,
      enum: ["On-site", "Remote"],
      required: true,
    },
    location: {
      lat: { type: Number },
      long: { type: Number },
      address: { type: String },
    }, // Location details
    salary: { type: Number }, // Salary offered
    employment_type: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Freelance"],
      required: true,
    },
    job_duration: { type: String }, // e.g., "6 months"
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    posted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Employer who posted the job
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
