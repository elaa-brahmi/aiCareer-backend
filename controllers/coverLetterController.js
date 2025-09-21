const dotenv = require("dotenv");
const { InferenceClient } = require("@huggingface/inference");

dotenv.config();

const hf = new InferenceClient(process.env.HUGGING_FACE_COVER_GEN);

//works but missing infos about the user to be fixed later on
const generateCoverLetter = async (req, res) => {
  const { title, companyName, description, tone, exp, skills } = req.body;
  const userId=req.user.id

  try {
    const modelName = "Qwen/Qwen3-Next-80B-A3B-Instruct";

    const prompt = `
      Write a professional cover letter with a ${tone || "formal"} tone
      for the position of ${title} at ${companyName}.
      The candidate has ${exp || "some"} years of experience.
      Job description: ${description || "Not provided"}.
      Skills to highlight: ${skills?.join(", ") || "General technical skills"}.
      Today's date is ${formattedDate}. Make sure to include this date at the top of the letter.
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

    console.log("Generated Cover Letter:\n", generatedText);

    return res.status(200).json({
      message: "Cover letter generated successfully",
      coverLetter: generatedText.trim(),
    });
  } catch (error) {
    console.error("Hugging Face Error Response:", error.response?.data || error.message);
    console.error("Status Code:", error.response?.status || "Unknown");
    console.error("Full Error:", error.stack);

    return res.status(400).json({ message: "Error generating cover letter" });
  }
};

module.exports = { generateCoverLetter };
