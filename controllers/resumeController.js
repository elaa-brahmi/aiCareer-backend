const supabase = require('../config/supabase'); 
const ResumeModel = require('../models/resume');
const JobModel = require("../models/job"); 
const pinecone = require("../config/pineconeClient");
const { getEmbedding } = require("../embedder");
const  pdfParse  = require("pdf-parse");
const MatchesJobs = require('../models/resume_job_matches');
const UserModel = require('../models/user');
const {sendNotification} = require('./notificationController')
const axios = require('axios')

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

const matchResume = async(resumeText) => {
  const index = pinecone.Index("jobs");

  const embedding = await getEmbedding(resumeText);
  console.log("resume Embedding length:", embedding.length);


  const query = await index.query({
    vector: embedding,
    topK: 15,
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
    //impede free plan users from uploading more than 
    const user = req.user
    if(user.plan==='free' && user.uploads_this_month>=5){
      return res.status(400).json({message:'uploads exceeded 5 , upgrade to premium '})
    }
    //add to uploads resumes count 
    user.uploads_this_month+=1;
    await user.save()


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
          //don't save an existing job for the same userId 
          const existingJob = await MatchesJobs.findOne({
            where: {
              userId: userId,
              url: details.url
            }
          });
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
const getUserMatches = async (req, res) => {
    const userId = req.user.id;
    try {
      // Extract pagination params from query (default: page 1, 6 items per page)
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 6) || 6;
      const offset = (page - 1) * limit;
  
      // Fetch total count for pagination metadata
      const totalCount = await MatchesJobs.count({
        where: { userId }
      });
  
      // Fetch paginated results
      const matches = await MatchesJobs.findAll({
        where: { userId },
        order: [
          ['score', 'DESC'],
          ['postedAt', 'DESC']
        ],
        limit,
        offset,
      });
  
      return res.status(200).json({
        matches,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page * limit < totalCount,
          hasPrevPage: page > 1
        }
      });
    } catch (error) {
      console.error("Error fetching user matches:", error);
      return res.status(400).json({ message: "Error finding jobs" });
    }
};
//this will be cron function to update user's matching jobs and alert the user with new matches 
const updateUserMatches = async(req,res) => {
  try {
  const users = await UserModel.findAll()
  for(const user of users){
    // Get all resumes for this user
    const userResumes = await ResumeModel.findAll({
      where: { userId: user.id },
      attributes: ['id', 'generatedUrl', 'fileName'],
    });

    if (!userResumes.length) {
      console.log(`No resumes for user ${user.id}`);
      continue;
    }
      for (const resume of userResumes){
        //we have generatedurl of the project in supabase get the file , extract text and get matches

        // Download PDF from Supabase public URL
        try {
        let newJobs=0
        const response = await axios.get(resume.generatedUrl, {
          responseType: 'arraybuffer',
        });

        const fileBuffer = Buffer.from(response.data, 'binary');
        const resumeText = await extractText(fileBuffer);

        if (!resumeText || resumeText.trim().length < 50) {
          console.log(`Skipping resume ${resume.id} (too short or unreadable)`);
          continue;
        }
         // Get updated matches from Pinecone
         const matches = await matchResume(resumeText);
         console.log(`Found ${matches.length} new matches for user ${user.id}`);
         // Save new matches (avoid duplicates)
         for (const match of matches) {
          const jobDetails = await getJobDetailsByUrl(match.url);
          if (!jobDetails) continue;

          const existing = await MatchesJobs.findOne({
            where: {
              userId: user.id,
              jobId: jobDetails.jobID,
              url: jobDetails.url
            },
          });
          if (existing) continue;
          //notify the user of how many new matches
          newJobs++;
          await MatchesJobs.create({
            score: match.score * 100,
            resumeId: resume.id,
            userId: user.id,
            jobId: jobDetails.jobID,
            title: jobDetails.title,
            description: jobDetails.description,
            url: jobDetails.url,
            company: jobDetails.companyName,
            location: jobDetails.location,
            companyLogo: jobDetails.companyLogo,
            postedAt: jobDetails.postedAt,
          });
        }
        //send notification
        if(newJobs > 0){
          console.log('a new job alert')
          await sendNotification(user.id,`you received ${newJobs} new job matches on your resume ${resume.fileName}`)
        }
        else{
          console.log(`no new matches found for user having id ${user.id}`)
        }


        console.log(` Updated matches for user ${user.id}`);
      } catch (resumeError) {
        console.error(`Error processing resume ${resume.id}:`, resumeError.message);
      }
    }
  }
    console.log(" Completed updateUserMatches cron job.");
  } catch (error) {
    console.error(" updateUserMatches global error:", error);
  }


}
  
  
module.exports={resumeAnalyzer,getUserResumes,deleteResume,updateUserMatches,getUserMatches}
