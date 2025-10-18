let embedder;


async function getEmbedder() {
  if (!embedder) {
    const { pipeline } = await import("@xenova/transformers");
    

    embedder = await pipeline(
      "feature-extraction",
      "Xenova/multilingual-e5-large"
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
