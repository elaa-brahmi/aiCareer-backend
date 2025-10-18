/* const pinecone = require("../config/pineconeClient");
const { getSafeEmbedding } = require("../embedder");
const { hashId } = require("../utilities/hash");
const fs = require("fs-extra");
const axios = require("axios");
const { chain } = require("stream-chain");
const { parser } = require("stream-json");
const { streamArray } = require("stream-json/streamers/StreamArray");
const dotenv = require("dotenv");
dotenv.config();

const CLEANED_FILE = "./data/cleaned_jobs.json";
const INDEX_NAME = "rag-jobs";
const BATCH_SIZE = 50; // safe batch size for embeddings

async function manualFetch(indexHost, apiKey, id) {
  try {
    const response = await axios.get(
      `https://${indexHost}/vectors/fetch?ids=${id}`,
      { headers: { "Api-Key": apiKey }, timeout: 10000 }
    );
    return response.data;
  } catch (err) {
    if (err.response?.status === 404 || err.message.includes("Unexpected end of JSON input")) {
      return { records: {} };
    }
    throw err;
  }
}

async function indexJob(job) {
  const index = pinecone.Index(INDEX_NAME);
  const safeId = hashId(job.id || job.url || job.job_title);

  // Skip if already indexed
  const indexDesc = await pinecone.describeIndex(INDEX_NAME);
  const existing = await manualFetch(indexDesc.host, process.env.PINECONE_API_KEY, safeId);
  if (existing?.records && Object.keys(existing.records).length > 0) {
    console.log(`✅ Already indexed: ${job.job_title}`);
    return;
  }

  // Prepare text for embedding
  const text = `${job.job_title}\n${job.description.replace(/\n\s*\n/g, "\n").trim()}`;
  const embedding = await getSafeEmbedding(text);

  const metadata = {
    job_title: job.job_title,
    company_name: job.company_name,
    location: job.location,
    experience_level: job.experience_level,
    source: job.source,
    url: job.url || null,
    description: job.description,
    skills: job.skills || [],
  };

  // Validate metadata size (<= 40KB)
  const metadataSize = Buffer.byteLength(JSON.stringify(metadata), "utf8");
  if (metadataSize > 40 * 1024) {
    console.warn(`⚠ Metadata too large for Pinecone, skipping job: ${job.job_title}`);
    return;
  }

  await index.upsert([
    {
      id: safeId,
      values: embedding,
      metadata,
    },
  ]);

  console.log(`✅ Indexed job: ${job.job_title}`);
}

async function batchIndexJobs() {
    console.log("📖 Streaming cleaned jobs JSON...");
    const pipeline = chain([
      fs.createReadStream("./data/cleaned_jobs.json"),
      parser(),
      streamArray(),
    ]);
  
    let batch = [];
    let count = 0;
  
    for await (const { value: job } of pipeline) {
      batch.push(job);
  
      if (batch.length >= BATCH_SIZE) {
        await Promise.all(batch.map(indexJob));
        count += batch.length;
        console.log(`✅ Indexed ${count} jobs so far`);
        batch = [];
      }
    }
  
    // Process remaining jobs
    if (batch.length > 0) {
      await Promise.all(batch.map(indexJob));
      count += batch.length;
      console.log(`✅ Indexed ${count} jobs total`);
    }
  
    console.log("🎯 All jobs processed and indexed in Pinecone.");
  }
  

// Run
batchIndexJobs().catch((err) => console.error("❌ Error in batch indexing:", err));
 */