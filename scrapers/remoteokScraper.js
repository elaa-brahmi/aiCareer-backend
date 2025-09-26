const fetch = require("node-fetch");
const JobModel = require("../models/job"); // your Job model
const { Op } = require('sequelize');

const SOURCE = "remoteok";

// Fetch jobs from RemoteOK JSON
const fetchJobs = async() => {
  try {
    const response = await fetch("https://remoteok.com/remote-dev-jobs.json", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch jobs: ${response.status}`);
    }

    const data = await response.json();
    // Skip metadata
    return data.slice(1).map((job) => ({
      title: job.position,
      description: job.description || "",
      company: job.company,
      location: job.location || "",
      url: `https://remoteok.com${job.url}`,
      posted_at: new Date(job.date),
      source: SOURCE,
    }));
  } catch (err) {
    console.error("Error fetching jobs:", err.message);
    return [];
  }
}

// Save jobs to DB, avoiding duplicates
const  saveJobsToDB = async(jobs) =>{
  for (const job of jobs) {
    const existing = await JobModel.findOne({
      where: { url: job.url, source: SOURCE },
    });

    if (!existing) {
      await JobModel.create({ ...job, created_at: new Date() });
    }
  }
  console.log(`${jobs.length} jobs processed and stored.`);
}

// Main function to fetch + save
const updateJobs = async()  => {
  console.log("Fetching jobs from RemoteOK...");
  const jobs = await fetchJobs();
  await saveJobsToDB(jobs);
  console.log("Job update completed.");
}
const  getAllJobs = async(req,res) =>{
    try{
        const jobs = await JobModel.findAll({
            where:{
                source:'remoteok'
            },
        });
        res.json(jobs);
    }
    catch(error){
        res.status(500).json({ error: "Failed to fetch jobs" });
    }
}

module.exports = { updateJobs,getAllJobs };
