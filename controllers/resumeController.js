const UserModel = require('../models/user')
const supabase = require('../config/supabase'); 
const ResumeModel = require('../models/resume')
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
const uploadResumeToSupaBase = async(userId,buffer) =>{
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
      generatedUrl:publicUrl,
      userId:userId
    }
  )
}
const resumeAnalyzer = async(req,res)=> {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No resume uploaded" });
    }
    console.log("Received file:", req.file.originalname);
    const { originalname, mimetype, size, buffer } = req.file;
    const userId = req.user?.id
    await uploadResumeToSupaBase(userId,buffer)
    //analyze logic
    res.json({ message: "Resume uploaded successfully" });
  } catch (error) {
    console.error("Resume analyzer error:", error);
    res.status(500).json({ message: "Error analyzing resume" });
  }

}
module.exports={resetMonthlyUploads,resumeAnalyzer}
