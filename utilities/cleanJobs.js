const fs = require("fs-extra");
const csv = require("csv-parser");
const path = require("path");
const dayjs = require("dayjs");
const { uniqBy } = require("lodash");

const globalAIFile = path.join(__dirname, "../data/ai_job_dataset.csv");
const linkedinFile = path.join(__dirname, "../data/linkedin_job_postings.csv");
const outputFile = path.join(__dirname, "../data/cleaned_jobs.json");

// Mappings
const expMap = { EN: "Entry", MI: "Mid", SE: "Senior", EX: "Executive" };
const sizeMap = { S: "Small", M: "Medium", L: "Large" };

const parseRemote = (r) => {
  const val = Number(r);
  if (val === 0) return "Onsite";
  if (val === 50) return "Hybrid";
  if (val === 100) return "Remote";
  return "Unknown";
};

const cleanSkills = (skills) =>
  skills
    ? skills
        .split(/[;,|]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

const sanitizeText = (text) =>
  text ? text.replace(/\s+/g, " ").trim() : "";

const normalizeLinkedInLevel = (level) => {
  if (!level) return "Unknown";
  const val = level.toLowerCase();
  if (val.includes("entry") || val.includes("junior")) return "Entry";
  if (val.includes("mid")) return "Mid";
  if (val.includes("senior") || val.includes("lead")) return "Senior";
  if (val.includes("exec") || val.includes("director")) return "Executive";
  return "Unknown";
};

async function readCSV(file) {
  return new Promise((resolve, reject) => {
    const data = [];
    fs.createReadStream(file)
      .pipe(csv())
      .on("data", (row) => data.push(row))
      .on("end", () => resolve(data))
      .on("error", reject);
  });
}

async function main() {
  console.log(" Reading datasets...");

  const [globalAI, linkedIn] = await Promise.all([
    readCSV(globalAIFile),
    readCSV(linkedinFile),
  ]);

  console.log("Datasets loaded.");

  // Clean and normalize Global AI dataset
  const aiJobs = globalAI.map((row) => {
    const skills = cleanSkills(row.required_skills);
    const desc = sanitizeText(
      `Role: ${row.job_title} at ${row.company_name} (${row.company_location}). 
      Requires ${skills.join(", ") || "relevant AI skills"}.
      Salary: ${row.salary_usd || "N/A"} ${row.salary_currency || "USD"} 
      for ${expMap[row.experience_level] || "Unknown"} level. 
      Industry: ${row.industry || "N/A"}. Education: ${
        row.education_required || "N/A"
      }.`
    );

    return {
      id: sanitizeText(row.job_id || ""),
      job_title: sanitizeText(row.job_title),
      company_name: sanitizeText(row.company_name),
      location: sanitizeText(row.company_location),
      experience_level: expMap[row.experience_level] || "Unknown",
      company_size: sizeMap[row.company_size] || row.company_size || "Unknown",
      salary_usd: Number(row.salary_usd) || null,
      remote_mode: parseRemote(row.remote_ratio),
      skills,
      education_required: sanitizeText(row.education_required),
      years_experience: Number(row.years_experience) || null,
      industry: sanitizeText(row.industry),
      posting_date: row.posting_date
        ? dayjs(row.posting_date).toISOString()
        : null,
      description: desc,
      source: "Global_AI_Job_Market_2025",
    };
  });

  // Clean and normalize LinkedIn dataset
  const liJobs = linkedIn.map((row, i) => {
    const title = sanitizeText(row.job_title || row.title);
    const company = sanitizeText(row.company || row.company_name);
    const skills = cleanSkills(row.skills || row.required_skills || "");
    const desc = sanitizeText(
      `${title} role at ${company} located in ${
        row.job_location || row.location || "Unknown"
      }. Type: ${row.job_type || "N/A"}. 
      Level: ${normalizeLinkedInLevel(row.job_level)}. 
      ${skills.length ? "Skills: " + skills.join(", ") + "." : ""}`
    );

    return {
      id: `LI_${i}`,
      job_title: title,
      company_name: company,
      location: sanitizeText(
        `${row.job_location || row.location || ""}, ${
          row.search_country || ""
        }`
      ),
      experience_level: normalizeLinkedInLevel(row.job_level),
      job_type: sanitizeText(row.job_type),
      skills,
      url: sanitizeText(row.job_link),
      description: desc,
      source: "LinkedIn_2023_2024",
    };
  });

  // Merge + deduplicate
  const allJobs = uniqBy([...aiJobs, ...liJobs], "id");
  console.log(` Total cleaned jobs: ${allJobs.length}`);

  // Stream-write instead of full JSON stringify (avoid RangeError)
  const writeStream = fs.createWriteStream(outputFile);
  writeStream.write("[\n");

  for (let i = 0; i < allJobs.length; i++) {
    writeStream.write(JSON.stringify(allJobs[i]));
    if (i < allJobs.length - 1) writeStream.write(",\n");
  }

  writeStream.write("\n]");
  writeStream.end();

  console.log(` Cleaned dataset saved to ${outputFile}`);
}

main().catch((err) => console.error(" Error:", err));
