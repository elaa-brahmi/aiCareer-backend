const { formatJobData } = require('./formatter');
const SOURCE = "linkedin";
const JobModel = require("../../models/job"); 
const pinecone = require("../../config/pineconeClient");
const { getEmbedding } = require("../../embedder");
const { v4: uuidv4 } = require("uuid");
const {hashId} = require('../../utilities/hash')
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();
//unused function replaced with n8n automation



async function manualFetch(indexHost, apiKey, id) {
  try {
    console.log(`Manually fetching ID: ${id} from host: ${indexHost}`);
    const response = await axios.get(
      `https://${indexHost}/vectors/fetch?ids=${id}`,
      {
        headers: { "Api-Key": apiKey },
        timeout: 10000, // 10s timeout
      }
    );
    console.log("Manual fetch response:", response.status, response.data);
    return response.data;
  } catch (err) {
    console.error("Manual fetch error:", err.message);
    if (err.response) {
      console.error("Response status:", err.response.status);
      console.error("Response data:", err.response.data);
    }
    // Handle empty index or missing record
    if (err.response?.status === 404 || err.message.includes("Unexpected end of JSON input")) {
      console.log("Assuming empty index or missing record");
      return { records: {} };
    }
    throw err;
  }
}

async function indexJob(title, description, jobUrl) {
  //console.log("Indexing job:", title, description, jobUrl);
  const index = pinecone.Index("jobs");
  const safeId = hashId(jobUrl);
  console.log("Scraping job with hashed ID:", safeId);

  if (typeof title !== "string" || typeof description !== "string" || typeof jobUrl !== "string") {
    throw new Error("Invalid input: title, description, and jobUrl must be strings");
  }
  if (!title || !description || !jobUrl) {
    throw new Error("Invalid input: title, description, and jobUrl must be non-empty");
  }

  try {
    // Verify index exists
    const indexDescription = await pinecone.describeIndex("jobs");
    if (!indexDescription || !indexDescription.status?.ready) {
      throw new Error("Pinecone index 'jobs' is not ready or does not exist");
    }

    // Fetch existing records using manual fetch
    let existing;
    try {
      existing = await manualFetch(indexDescription.host, process.env.PINECONE_API_KEY, safeId);
    } catch (fetchErr) {
      throw new Error(`Failed to fetch record: ${fetchErr.message}`);
    }

    if (existing?.records && Object.keys(existing.records).length > 0) {
      console.log(`Job already indexed: ${title}`);
      return;
    }
    //console.log('embedding description :',description)

    // Clean text for embedding (Pinecone will auto-embed the 'text' field)
    const text = `${title}\n${description.replace(/\n\s*\n/g, "\n").trim()}`; // Clean excessive newlines
    //console.log("Text for Pinecone embedding:", text.slice(0, 100) + (text.length > 100 ? "..." : ""));
    const embedding = await getEmbedding(text);
    //console.log("Embedding result:", embedding);
    // Validate metadata size (includes text for embedding)
    const metadata = { 
      title, 
      description, 
      url: jobUrl,
    };
    // Validate embedding
    

    const metadataSize = Buffer.byteLength(JSON.stringify(metadata), "utf8");
    console.log("Metadata size (bytes):", metadataSize);
    if (metadataSize > 40 * 1024) {
      throw new Error("Metadata exceeds Pinecone's 40KB limit");
    }

    console.log("Upserting data with auto-embedding:", { id: safeId, metadata });
    await index.upsert([
      {
        id: safeId,
        values: embedding,
        metadata,
      },
    ]);

    console.log(`Indexed job: ${title} (auto-embedded with llama-text-embed-v2)`);
  } catch (err) {
    console.error(`Failed to index job "${title}" (${jobUrl}):`, err.message, err.stack);
    throw err;
  }
}

const saveJobsToDB = async(jobs) => {
  console.log('saveJobsToDB called with', jobs.length, 'jobs');
  let savedCount = 0;
  let duplicateCount = 0;
  
  for (const job of jobs) {
    console.log('Processing job:', job.title, 'URL:', job.url);
    
    const existing = await JobModel.findOne({
      where: { url: job.url, source: SOURCE },
    });
    
    if(!existing){
      try{
        console.log('Saving new job:', job.title);
        await JobModel.create({ ...job, source: SOURCE, created_at: new Date() });
        savedCount++;
        console.log('Job saved successfully');
      }
      catch(error){
        console.log('Error saving job:', error.message);
      }
    } else {
      duplicateCount++;
      console.log('Job already exists, skipping:', job.title);
    }
  }
  console.log(`${savedCount} new jobs from LinkedIn processed and stored. ${duplicateCount} duplicates skipped.`);
}

/* const constructSearchUrl = (keywords, location = '', dateSincePosted = '') => {
  const baseUrl = 'https://www.linkedin.com/jobs/search';
  const params = new URLSearchParams({
    keywords: keywords,
    position: 1,
    pageNum: 0
  });

  if (location) {
    params.append('location', location);
  }

  if (dateSincePosted) {
    params.append('f_TPR', dateSincePosted);
  }

  return `${baseUrl}?${params.toString()}`;
} */

const saveJobs = async (jobsArray) => {
  try {
    if (!Array.isArray(jobsArray)) {
      throw new Error("Invalid jobs format received");
    }

    console.log("Total jobs received:", jobsArray.length);

    const formattedJobs = jobsArray.map(job => ({
      id: job.id,
      title: job.title,
      company: job.companyName,
      location: job.location,
      url: job.link,
      applyUrl: job.applyUrl,
      description: job.descriptionText,
      companyLogo: job.companyLogo,
      companyLinkedinUrl: job.companyLinkedinUrl,
      posted_at: job.postedAt,
      source: 'linkedin'
    }));

    // Remove duplicates (same job ID)
    const uniqueJobs = Object.values(
      formattedJobs.reduce((acc, job) => {
        acc[job.id] = job;
        return acc;
      }, {})
    );

    console.log("Unique jobs:", uniqueJobs.length);
    await saveJobsToDB(uniqueJobs);
    for (const job of uniqueJobs) {
      try{
      await indexJob(job.title, job.description, job.url);
      }
      catch(error){
        console.error("Error indexing job:", error.message);
      }
    }
  } catch (error) {
    console.error("Error saving jobs:", error.message);
  }
};

module.exports={saveJobs,indexJob}