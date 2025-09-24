const dotenv = require("dotenv");
const { InferenceClient } = require("@huggingface/inference");
const fs = require("fs");
const PDFDocument = require("pdfkit");
dotenv.config();
const supabase = require('../config/supabase'); 
const CoverLetterModel = require("../models/coverLetter");
const User = require('../models/user')
const hf = new InferenceClient(
    process.env.HUGGING_FACE_COVER_GEN
  );
  

//works but missing infos about the user to be fixed later on
//maybe add resume
const generateCoverLetter = async (req, res) => {
  const { fullName,title, companyName, description, tone, exp, skills } = req.body;
  const userId="10"
  const dbUser = await User.findByPk(userId);

    if (!dbUser) {
    return res.status(404).json({ message: "User not found" });
    }


  try {
    if(dbUser.plan === "free" &&  dbUser.status === "inactive" && dbUser.cover_letters_this_week >= 5){
        return res.status(400).json({ message: "upgrade plan to generate cover letters" });

    }
    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const modelName = "Qwen/Qwen3-Next-80B-A3B-Instruct";
    const normalizedSkills = Array.isArray(skills)
    ? skills
    : skills
        ? skills.split(/[\s,]+/).filter(Boolean) // split by space or comma
        : [];

        const prompt = `
        Write a professional cover letter for the position of ${title} at ${companyName} with a ${tone || "formal"} tone.
        Start the letter with "Dear Hiring Committee,".
        Mention that the candidate has ${exp || "some"} years of experience.
        Job description: ${description || "Not provided"}.
        Skills to highlight: ${normalizedSkills.length > 0 ? normalizedSkills.join(", ") : "General technical skills"}.
        Include today's date (${formattedDate}) at the top of the letter.
        End the letter with "Sincerely, ${fullName}".
  `;

    console.log("Prompt sent to Hugging Face:\n", prompt);

    const response = await hf.chatCompletion({
      model: modelName,
      messages: [
        { role: "system", content: "You are a helpful assistant that writes professional cover letters." },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const generatedText = response.choices?.[0]?.message?.content || "";
    console.log('generated hg text',generatedText)
    const publicUrl= await uploadPDFBuffer(userId,generatedText)
    const newCoverLetter = await CoverLetterModel.create({
        userId: userId,
        title: title,
        companyName: companyName,
        generatedUrl: publicUrl,  // <-- use Supabase public URL here
      });
    return res.status(200).json({
    message: "Cover letter generated and uploaded successfully",
    coverLetterUrl: publicUrl,
    });
    
  } catch (error) {
    console.error("Hugging Face Error Response:", error.response?.data || error.message);
    console.error("Status Code:", error.response?.status || "Unknown");
    console.error("Full Error:", error.stack);

    return res.status(400).json({ message: "Error generating cover letter" });
  }
};
const getCoverLettersByUser = async (req,res) => {
    const userId=req.user.id
    try{
    const coverLetters = await CoverLetterModel.findAll({
        where: { userId },
        order: [["createdAt", "DESC"]],
      });
  
      if (coverLetters.length === 0) {
        return res.status(200).json({ message: "No cover letters found for this user" ,
            urls: coverLetters,
        });
      }
  
      return res.status(200).json({
        message: "Cover letter URLs retrieved successfully",
        urls: coverLetters, // return as array of URLs
      });
    
    } catch (error) {
      console.error("Error fetching cover letter URLs:", error);
      return res.status(500).json({ message: "Error fetching cover letter URLs" });
    }

}
const resetWeeklyCoverLetters = async() =>{
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
          user.cover_letters_this_week = 0;
          await user.save();
        
        }
    
        return {
          message: `${users.length} users reset cover letters this week`,
          count: users.length
        };
      } catch (error) {
        console.error('Error resetting cover letters this week:', error.message);
        throw new Error('Error while verifying resetting cover letters');
      }
}

async function uploadPDFBuffer(userId, generatedText) {
    const pdfDoc = new PDFDocument();
    const chunks = [];
  
    pdfDoc.on('data', (chunk) => chunks.push(chunk)); //pdfkit streams the pdf content as a sequence of small chunks
    pdfDoc.on('error', (err) => { throw err; });
  
    // Write content to PDF
    pdfDoc.fontSize(12).text(generatedText, { align: 'left' });
  
    // End PDF
    pdfDoc.end();
  
    // Wait until PDF is fully generated
    await new Promise((resolve) => pdfDoc.on('end', resolve));
  
    // Combine all chunks into a single Buffer
    const pdfBuffer = Buffer.concat(chunks);
  
    const fileName = `users/${userId}/cover_letters/cover_letter_${Date.now()}.pdf`;
  
    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from('cover_letters')
      .upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: true });
  
    if (error) throw error;
  
    // Get public URL
    const { data: publicUrlData, error: urlError } = supabase
      .storage
      .from('cover_letters')
      .getPublicUrl(fileName);
  
    if (urlError) throw urlError;
  
    const publicUrl = publicUrlData.publicUrl;
    console.log('public url', publicUrl);
  
    return publicUrl;
  }
  


module.exports = { generateCoverLetter, getCoverLettersByUser, resetWeeklyCoverLetters };