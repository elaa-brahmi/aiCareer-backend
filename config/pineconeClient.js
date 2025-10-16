const { Pinecone } = require("@pinecone-database/pinecone");

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
  maxRetries: 3, // Enable retries for transient errors
  // Optional: Add sourceTag for tracking in Pinecone dashboard
  sourceTag: "job-scraper",
});

module.exports = pinecone;
