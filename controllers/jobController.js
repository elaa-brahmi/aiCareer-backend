const JobModel = require("../models/job"); // your Job model
const { Op } = require('sequelize');
const deleteOldJobs = async () => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - 1); // 1 month ago
  
      const deletedCount = await JobModel.destroy({
        where: {
          posted_at: {
            [Op.lt]: cutoffDate, 
          },
        },
      });
  
      console.log(`Deleted ${deletedCount} jobs older than 1 month.`);
    } catch (error) {
      console.error('Error deleting old jobs:', error.message);
    }
  };
module.exports= deleteOldJobs