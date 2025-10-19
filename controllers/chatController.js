const { getEmbedding } = require("../embedder");
const pinecone = require("../config/pineconeClient");
const chatModel = require('../models/chat')

const embed_user_query = async(req,res) => {
    try{
        const {msg} = req.body
        console.log('user input ',msg)
        //add to chat history
        await chatModel.create({
            userId:req.user.id,
            role:'user',
            content:msg
        })
        //embed and do the semantic search

        const index = pinecone.Index("rag-jobs");

       /*  const embedding = await getEmbedding(msg);
        console.log("resume Embedding length:", embedding.length);
      
      
        const query = await index.query({
          vector: embedding,
          topK: 15,
          includeMetadata: true,
        });
      
        return query.matches */
        return res.status(200).json({msg:'msg received'})

    }
    catch(error){
        console.log(error)
    }
}
const return_user_history = async(req,res) =>{
    const userId = req.user.id
    try{
        const history = await chatModel.findAll({
            where:{userId:userId},
            order: [['createdAt', 'DESC']],
        })
        return res.status(200).json({history:history})
    }
    catch(error){
        console.log(error)
        return res.status(400).json({message:error})
    }

}
module.exports = {embed_user_query,return_user_history}