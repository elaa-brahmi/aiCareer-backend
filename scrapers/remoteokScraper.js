const dotenv = require("dotenv");
const { InferenceClient } = require("@huggingface/inference");
const fetch = require("node-fetch");
const JobModel = require("../models/job"); // your Job model
const { Op } = require('sequelize');
const pinecone = require("../config/pineconeClient");
const { getEmbedding } = require("../embedder");
const { v4: uuidv4 } = require('uuid');
dotenv.config();
const SOURCE = "remoteok";
const hf = new InferenceClient(
    process.env.HUGGING_FACE_COVER_GEN
  );
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
        try{
            const prompt = `
            Instructions:
            - Remove all HTML and CSS tags like <p>, <ul>, <li>, <b>, <a>, <div>, <br>, etc.
            - Keep only readable text and sentences.
            - Preserve important text structure like bullet points or lists by separating them with line breaks or dashes.
            - Do NOT include any leftover code, scripts, or links.
            - Output only the cleaned text, no extra commentary.

            Input:
            ${job.description}
                    `;
            const response = await hf.chatCompletion({
                model: "deepseek-ai/DeepSeek-V3.1-Terminus",
                messages: [
                  { role: "system", content: "You are a text-cleaning assistant. Your task is to extract only the meaningful plain text job description from the given HTML content." },
                  { role: "user", content: prompt },
                ],
                max_tokens: 1000,
                temperature: 0.2,
              });
          
              const generatedText = response.choices?.[0]?.message?.content || "";
              console.log('generated job description',generatedText)
              await JobModel.create({ ...job, id:uuidv4(),  description: generatedText, created_at: new Date() });


        }
        catch(error){
            console.log(error)
        }
    }
  }
  console.log(`${jobs.length} jobs from remoteok processed and stored.`);
}
async function indexJob(title, description, jobId) {
  const index = pinecone.Index("jobs-index");

  let alreadyIndexed = false;

  try {
    const existing = await index.fetch({ ids: [jobId] });

    if (existing?.records && Object.keys(existing.records).length > 0) {
      console.log(`Job already indexed: ${title}`);
      alreadyIndexed = true;
    }
  } catch (err) {
    console.error(`Pinecone fetch failed for jobId=${jobId}:`, err.message);
    // Don’t block indexing if fetch fails — assume not indexed
  }

  if (alreadyIndexed) return;

  try {
    const text = `${title}\n${description}`;
    const embedding = await getEmbedding(text);

    await index.upsert([
      {
        id: jobId, // stable ID, e.g. job.url
        values: embedding,
        metadata: { title, description },
      },
    ]);

    console.log(`Indexed job: ${title}`);
  } catch (err) {
    console.error(`Failed to index job "${title}" (${jobId}):`, err.message);
  }
}


// Main function to fetch + save
const updateJobs = async()  => {
  console.log("Fetching jobs from RemoteOK...");
  const jobs = await fetchJobs();
  await saveJobsToDB(jobs);
  for (const job of jobs) {
    // Index into Pinecone (use url as unique id)
    await indexJob(job.title, job.description, job.url);
  }
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
