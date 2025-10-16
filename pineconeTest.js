const { Pinecone } = require("@pinecone-database/pinecone");

const dotenv = require("dotenv");
dotenv.config();
(async () => {
  try {

    const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
    maxRetries: 3,
    sourceTag: "job-scraper",
    });

    const index = pinecone.Index("jobs");
    // mock embedding 
    const embedding = Array(1024).fill(0);
    const res = await index.query({ vector: embedding, topK: 1 });
    console.log("Query result:", res);

  } catch (err) {
    console.error("Error querying Pinecone:", err);
  }
})();
