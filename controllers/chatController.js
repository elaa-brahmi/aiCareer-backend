const { getEmbedding } = require("../embedder");
const pinecone = require("../config/pineconeClient");

const embed_user_query = async(req,res) => {
    try{
        const {msg} = req.body
        console.log('user input ',msg)
        //embed and do the semantic search
        const index = pinecone.Index("rag-jobs");

        const embedding = await getEmbedding(resumeText);
        console.log("resume Embedding length:", embedding.length);
      
      
        const query = await index.query({
          vector: embedding,
          topK: 15,
          includeMetadata: true,
        });
      
        return query.matches

    }
    catch(error){
        console.log(error)
    }
}
module.exports = {embed_user_query}