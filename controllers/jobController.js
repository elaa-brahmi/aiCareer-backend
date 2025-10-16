const JobModel = require("../models/job"); // your Job model
const MatchesJobs = require('../models/resume_job_matches');
const { Op } = require('sequelize');
const pinecone = require("../config/pineconeClient");

// Delete old jobs from Postgres and Pinecone
const deleteOldJobs = async () => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 1); // 1 month ago

    //  Get old jobs from Postgres
    const oldJobs = await JobModel.findAll({
      where: {
        posted_at: {
          [Op.lt]: cutoffDate,
        },
      },
    });

    if (!oldJobs.length) {
      console.log('No old jobs found to delete.');
      return;
    }

    const oldJobIDs = oldJobs.map(job => job.id);
    const oldJobUrls = oldJobs.map(job => job.url);

     //  Delete from MatchesJobs
     const deletedMatchesCount = await MatchesJobs.destroy({ where: { jobId: oldJobIDs } });
     console.log(`deleted ${deletedMatchesCount} job matches from MatchesJobs.`);
    //  Delete from Postgres JobModel
    const deletedJobsCount = await JobModel.destroy({ where: { id: oldJobIDs } });
    console.log(`deleted ${deletedJobsCount} jobs from JobModel.`);

   

    //  Delete from Pinecone
    const index = pinecone.Index("jobs");
    const deleteResponse = await index.deleteMany({
      filter: { url: { $in: oldJobUrls } },
    });
    console.log(`deleted vectors from Pinecone reponse ${deleteResponse}`);

  } catch (error) {
    console.error('Error deleting old jobs:', error.message);
  }
};

module.exports = deleteOldJobs;
