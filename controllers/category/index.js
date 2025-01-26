const Joi = require("joi");
const Category = require("../../models/Category");

const categoryCrtl = {
  // Get all category
  getAll: async (req, res) => {
    try {
      // Define Joi schema for query parameters
      const schema = Joi.object({
        page: Joi.number().min(1).default(1), // Default page is 1
        limit: Joi.number().min(1).max(100).default(10), // Default limit is 10, max is 100
        search: Joi.string().optional().allow(""), // Optional search query
      });

      // Validate query parameters
      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { page, limit, search } = value;

      // Build query filters
      const filters = { status: "active" };
      if (search) {
        filters.name = { $regex: search, $options: "i" }; // Case-insensitive search
      }
     

      // Pagination calculations
      const skip = (page - 1) * limit;

      // Fetch jobs with pagination
      const categories = await Category.find(filters)
        .skip(skip)
        .limit(limit).select('-status -posted_by');

      // Total count for pagination metadata
      const totalCount = await Category.countDocuments(filters);

      res.status(200).json({
        success: "Fetch Successfully",
        data: categories,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get one category by ID
  getOne: async (req, res) => {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: "Category ID is required." });
      }

      const category = await Category.findById(id);

      if (!category) {
        return res.status(404).json({ error: "Category not found." });
      }

      res.status(200).json(category);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = categoryCrtl;
