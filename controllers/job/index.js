const Job = require("../../models/Job");

const jobCrtl = {
  // Create a new job
  create: async (req, res) => {
    try {
      const jobData = req.body;

      // Validate job data
      const schema = Joi.object({
        title: Joi.string().required(),
        category: Joi.string().required(), // Category ID
        description: Joi.string().required(),
        skills: Joi.array().items(Joi.string()).required(),
        location_type: Joi.string().valid("On-site", "Remote").required(),
        location: Joi.object({
          lat: Joi.number(),
          long: Joi.number(),
          address: Joi.string().optional(),
        }).optional(),
        salary: Joi.number().optional(),
        employment_type: Joi.string()
          .valid("Full-time", "Part-time", "Contract", "Freelance")
          .required(),
        job_duration: Joi.string().optional(),
      });

      const { error, value } = schema.validate(jobData);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const job = new Job({
        ...value,
        posted_by: req.user.id, // Assuming user is set by Auth middleware
      });

      await job.save();
      res.status(201).json({ success: "Job created successfully.", job });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get all jobs
  getAll: async (req, res) => {
    try {
      const jobs = await Job.find({ status: "open" })
        .populate("category")
        .populate("posted_by");
      res.status(200).json(jobs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get one job by ID
  getOne: async (req, res) => {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: "Job ID is required." });
      }

      const job = await Job.findById(id)
        .populate("category")
        .populate("posted_by");
      if (!job) {
        return res.status(404).json({ error: "Job not found." });
      }

      res.status(200).json(job);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update job
  update: async (req, res) => {
    try {
      const { id } = req.query;
      const updates = req.body;

      if (!id) {
        return res.status(400).json({ error: "Job ID is required." });
      }

      const job = await Job.findByIdAndUpdate(id, updates, { new: true });
      if (!job) {
        return res.status(404).json({ error: "Job not found." });
      }

      res.status(200).json({ success: "Job updated successfully.", job });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = jobCrtl;
