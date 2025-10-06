let embedder;


async function getEmbedder() {
  if (!embedder) {
    const { pipeline, env } = await import("@xenova/transformers");
    //force it to load the model locally rather than trying to fetch via Hugging Face
    env.TFJS_BACKEND = "cpu";   // Or "wasm" if using WASM in Node
    env.HF_HUB_URL = "";         // Disable Hugging Face hub

    embedder = await pipeline(
      "feature-extraction",
     "Xenova/llama-text-embed-v2" 
    );
  }
  return embedder;
}

async function getEmbedding(text) {
  const model = await getEmbedder();
  const output = await model(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

module.exports = { getEmbedding };
