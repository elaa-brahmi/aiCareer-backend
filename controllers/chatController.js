const { getEmbedding } = require("../embedder");
const pinecone = require("../config/pineconeClient");
const chatModel = require('../models/chat')
require('dotenv').config();

const generate_response = async(context,userQuestion )=>{
    const response1 = await fetch("https://api.groq.com/openai/v1/models", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
        }
        });
    const data = await response1.json();
    console.log(data); // Should list available models

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
         { 
            role: "system", 
            content: context 
        },
          { role: "user", content:userQuestion }
        ]
      })
    });

    if (!response.ok) {
      throw new Error("Failed to fetch response from chatbot API");
    }

    const apiData = await response.json();
    console.log("Chatbot API response:", apiData);
    const botReply = apiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that.";
    console.log("Bot reply:", botReply);
    return botReply
}
const embed_user_query = async (req, res) => {
    try {
      const { msg } = req.body;
  
      // Save user message
      await chatModel.create({
        userId: req.user.id,
        role: "user",
        content: msg,
      });
  
      // Get embedding
      const embedding = await getEmbedding(msg);
      console.log("Embedding length:", embedding.length);
  
      // Query Pinecone
      const index = pinecone.Index("rag-jobs");
      const query = await index.query({
        vector: embedding,
        topK: 5,
        includeMetadata: true,
      });
  
      console.log("Pinecone query result count:", query.matches?.length || 0);
      if (query.matches?.length) {
        console.log(
          "Top match score:",
          query.matches[0].score,
          "\nTop match metadata:",
          query.matches[0].metadata
        );
      } else {
        console.warn(" No matches returned from Pinecone!");
      }
  
      //Build context
      const context =
        query.matches
          ?.map((m, i) => {
            console.log(`Match #${i + 1} metadata:`, m.metadata);
            return `
            Job Title: ${m.metadata?.job_title || "N/A"}
            Company: ${m.metadata?.company_name || "N/A"}
            Location: ${m.metadata?.location || "N/A"}
            Experience: ${m.metadata?.experience_level || "N/A"}
            Description: ${m.metadata?.description || "N/A"}
          `;
          })
          .join("\n\n") || "No context found.";
  
      console.log("Generated context:\n", context.slice(0, 500), "...");  
      //Build prompt
      const prompt = `
        You are an AI career assistant helping users explore job opportunities.
        Use the context below to answer the user's question concisely and helpfully.
        If the context doesn’t contain relevant information, say you don’t know.
  
        Context:
        ${context}
  
        User Question:
        ${msg}
      `;
  
      console.log("Final prompt preview:\n", prompt.slice(0, 600), "...");
      const botReply = await generate_response(prompt,msg)
  
  
      //  Save bot response
      await chatModel.create({
        userId: req.user.id,
        role: "bot",
        content: botReply,
      });
  
      return res.status(200).json({ msg: botReply });
    } catch (error) {
      console.error(" embed_user_query ERROR:", error);
      return res.status(500).json({ error: error.message });
    }
};
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