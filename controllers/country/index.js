const Country = require("../../models/Country");

const countryCrtl = {
  // Get all countries
  getAll: async (req, res) => {
    try {
        
      const { name } = req.query; // Get the 'name' query parameter

      // Build the filter object
      const filter = { status: "active" };
      if (name) {
        filter.name = { $regex: name, $options: "i" }; // Case-insensitive search
      }

      const countries = await Country.find(filter);
      res.status(200).json(countries);

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = countryCrtl;
