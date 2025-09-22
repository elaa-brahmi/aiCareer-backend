const dotenv = require("dotenv");
const { InferenceClient } = require("@huggingface/inference");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const cloudinary = require("../config/cloudinary");
dotenv.config();
const CoverLetterModel = require("../models/coverLetter");
const hf = new InferenceClient(process.env.HUGGING_FACE_COVER_GEN,
  );
  

//works but missing infos about the user to be fixed later on
//maybe add resume
const generateCoverLetter = async (req, res) => {
  const { fullName,title, companyName, description, tone, exp, skills } = req.body;
  const userId=req.user.id
  console.log('user id from generate cover letter', userId)


  try {
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

    // Create PDF
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const pdfPath = path.join(tempDir, `cover_letter_${userId}.pdf`);
    const writeStream = fs.createWriteStream(pdfPath);

    const pdfDoc = new PDFDocument();
    pdfDoc.pipe(writeStream);
    pdfDoc.fontSize(12).text(generatedText, { align: "left" });
    pdfDoc.end();

    // Wait for file to finish writing
    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    // Upload PDF to Cloudinary
    const result = await cloudinary.uploader.upload(pdfPath, {
    folder: `users/${userId}/cover_letters`,
    resource_type: "raw",
    });
    console.log("PDF uploaded to Cloudinary:", result.secure_url);

    // Save URL to CoverLetter model 
    const newCoverLetter = await CoverLetterModel.create({
    userId: userId,
    title: title,
    companyName: companyName,
    generatedUrl: result.secure_url,
    });

    //Cleanup
    fs.unlinkSync(pdfPath);

    return res.status(200).json({
    message: "Cover letter generated and uploaded successfully",
    coverLetterUrl: result.secure_url,
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
    console.log('user id from get cover lettrs ', userId)
    try{
    const coverLetters = await CoverLetterModel.findAll({
        where: { userId },
        order: [["createdAt", "DESC"]],
      });
  
      if (!coverLetters || coverLetters.length === 0) {
        return res.status(404).json({ message: "No cover letters found for this user" });
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

module.exports = { generateCoverLetter, getCoverLettersByUser };