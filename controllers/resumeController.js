const UserModel = require('../models/user')
const supabase = require('../config/supabase'); 
const ResumeModel = require('../models/resume');
const JobModel = require("../models/job"); 
const pinecone = require("../config/pineconeClient");
const { getEmbedding } = require("../embedder");
const  pdfParse  = require("pdf-parse");
const MatchesJobs = require('../models/resume_job_matches')
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

  //save to resume
  const savedResume = await ResumeModel.create(
    {
      fileName:originalname,
      generatedUrl:publicUrl,
      userId:userId
    }
  )
  return savedResume.id;
}

const  matchResume = async(resumeText) => {
  const index = pinecone.Index("jobs");

  const embedding = await getEmbedding(resumeText);
  console.log("resume Embedding length:", embedding.length);


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
    url:match.metadata.url  }));
}
const extractText = async (fileBuffer) => {
  try {
    const data = await pdfParse(fileBuffer);
    return data.text; // extracted plain text from PDF
  } catch (err) {
    console.error("Error extracting text from PDF:", err);
    throw new Error("Could not extract text from resume");
  }
};

const resumeAnalyzer = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No resume uploaded" });
    }

    console.log("Received file:", req.file.originalname);
    const { originalname, buffer } = req.file;
    const userId = req.user?.id;

    const resumeId = await uploadResumeToSupaBase(userId, buffer, originalname);

    const text = await extractText(buffer);
    if (!text || text.trim().length < 50) {
      return res.status(400).json({ message: "Resume text could not be extracted" });
    }

    const matches = await matchResume(text);

    res.status(200).json({
      message: "Resume analyzed successfully",
      matches,
    });

    // Save matches asynchronously in the background
    (async () => {
      for (const match of matches) {
        try {
          const details = await getJobDetailsByUrl(match.url);
          const existingJob = await MatchesJobs.findOne({ where: { url: details.url } });
          if (existingJob) continue;

          await MatchesJobs.create({
            score: match.score * 100,
            resumeId: resumeId,
            userId: userId,
            jobId: details.jobID,
            title: details.title,
            description: details.description,
            url: details.url,
            company: details.companyName,
            location: details.location,
            companyLogo: details.companyLogo,
            postedAt: new Date(details.postedAt).toISOString(),
          });
        } catch (err) {
          console.error("Error saving match:", err);
        }
      }
    })();
  } catch (error) {
    console.error("Resume analyzer error:", error);
    res.status(500).json({ message: "Error analyzing resume" });
  }
};

const getJobDetailsByUrl = async(url) => {
  try {
    const job = await JobModel.findOne({
      where: { url },
      attributes: [
        'id',
        'title',
        'description',
        'company',
        'location',
        'companyLogo',
        'posted_at', // alias for clarity
      ],
    });

    if (!job) return null;

    return {
      jobID: job.id,
      title: job.title,
      description: job.description,
      companyName: job.company,
      location: job.location,
      companyLogo: job?.companyLogo,
      postedAt: job.posted_at ? new Date(job.posted_at).toISOString() : null,
      url, // original URL
    };
  } catch (error) {
    console.error('Error fetching job details:', error);
    throw new Error('Could not fetch job details');
  }
};

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
