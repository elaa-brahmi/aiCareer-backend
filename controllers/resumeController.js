const UserModel = require('../models/user')
const supabase = require('../config/supabase'); 
const ResumeModel = require('../models/resume');
const JobModel = require("../models/job"); 
const pinecone = require("../config/pineconeClient");
const { getEmbedding } = require("../embedder");
//const { pdfParse } = require("pdf-parse");
const resetMonthlyUploads = async() =>{
    try {
        const users = await UserModel.findAll({
          where: {
            status: 'inactive',
            plan: 'free',
          }
        });
        if (users.length === 0) {
          console.log('No users found');
          return { message: 'No  users found' };
        }
    
        for (const user of users) {
          user.uploads_this_month = 0;
          await user.save();
        
        }
    
        return {
          message: `${users.length} users reset uploads this month`,
          count: users.length
        };
      } catch (error) {
        console.error('Error resetting uploads this month:', error.message);
        throw new Error('Error while verifying resetting uploads');
      }
}
const uploadResumeToSupaBase = async(userId,buffer,originalname) =>{
  const fileName = `users/${userId}/resumes/resume_${Date.now()}.pdf`;
  // Upload to Supabase
  const { data, error } = await supabase.storage
    .from('resumes')
    .upload(fileName, buffer, { contentType: 'application/pdf', upsert: true });
  if (error) throw error;
  // Get public URL
  const { data: publicUrlData, error: urlError } = supabase
    .storage
    .from('resumes')
    .getPublicUrl(fileName);

  if (urlError) throw urlError;

  const publicUrl = publicUrlData.publicUrl;
  console.log('uploaded resume url ',publicUrl) 

  //save to resume
  await ResumeModel.create(
    {
      fileName:originalname,
      generatedUrl:publicUrl,
      userId:userId
    }
  )
}

const  matchResume = async(resumeText) => {
  const index = pinecone.Index("jobs-index");

  const embedding = await getEmbedding(resumeText);

  const query = await index.query({
    vector: embedding,
    topK: 10,
    includeMetadata: true,
  });

  return query.matches.map((match) => ({
    id: match.id,
    score: match.score,
    title: match.metadata.title,
    description: match.metadata.description,
  }));
}
const extractText = async (fileBuffer) => {
  try {
    const { default: pdfParse } = await import("pdf-parse"); // dynamic import
    const data = await pdfParse(fileBuffer);
    return data.text; // extracted plain text from PDF
  } catch (err) {
    console.error("Error extracting text from PDF:", err);
    throw new Error("Could not extract text from resume");
  }
};

const resumeAnalyzer = async(req,res)=> {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No resume uploaded" });
    }
    console.log("Received file:", req.file.originalname);
    const { originalname, mimetype, size, buffer } = req.file;
    const userId = req.user?.id
    await uploadResumeToSupaBase(userId,buffer,originalname)
    //analyze logic
    //extract resume text
    const text=await extractText(buffer);
    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ message: "Resume text could not be extracted" });
    }
    const matches= await matchResume(text)
    
    res.json({
      message: "Resume analyzed successfully",
      matches,
    });
  } catch (error) {
    console.error("Resume analyzer error:", error);
    res.status(500).json({ message: "Error analyzing resume" });
  }

}
const getUserResumes = async(req,res) => {
  const userId=req.user.id
  console.log('getting resumes for user ',userId)
  try{
    const resumes = await ResumeModel.findAll({
      where: { userId:userId },
      order: [["createdAt", "DESC"]],
    });

    console.log('user resumes ',resumes)
    return res.status(200).json({resumes:resumes})
  }
  catch(error){
    console.log(error)
    return res.status(400).json({message:error})
  }

}
const deleteResume = async(req,res) => {
  const resumeId = req.params.resumeId;
  try{

    await ResumeModel.destroy({
      where:{
        id:resumeId
      }
    });
    res.status(200).json({message:'resume deleted'})
  }
  catch(error){
    console.log(error)
    res.status(400).json({message:'error deleting resume'})
  }

}
module.exports={resetMonthlyUploads,resumeAnalyzer,getUserResumes,deleteResume}
