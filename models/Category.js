const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    status: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "open",
    },
    posted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Employer who posted the category
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
