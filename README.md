AI Career is an intelligent, AI-powered career platform designed to transform the way we search for jobs and build our professional future. It brings together automation, data engineering, and generative AI to help users discover personalized job opportunities, analyze their resumes, and generate professional documents — all in one seamless experience.
🌟 Key Features
🔍 Automated Job Scraping: Integrated with n8n (running locally on Docker) and Puppeteer to automatically fetch and update job listings from LinkedIn and RemoteOK.
🧠 AI Resume Matching: Matches resumes with job descriptions using Hugging Face embeddings stored in Pinecone Vector DB, enabling accurate semantic search and recommendation.
🧾 Resume & Cover Letter Management:
Generates personalized cover letters for each job using AI.
Securely stores resumes and cover letters in Supabase for easy access and management.
💬 AI Chatbot Assistant (RAG-based): A Retrieval-Augmented Generation chatbot trained on cleaned Kaggle datasets related to jobs, career advice, and interview prep — offering real-time guidance and insights.
🧹 Python Microservice: A dedicated FastAPI microservice for:
Generating embeddings for Pinecone.
Cleaning and preparing Kaggle datasets before loading into the RAG knowledge base.
🔐 Secure Authentication: Implemented Google/GitHub OAuth for safe and quick sign-in.
💳 Premium Plans with Stripe: Offers subscription-based access to premium AI features.
🐳 Containerized Architecture: Fully Dockerized, including PostgreSQL and n8n, ensuring smooth deployment across environments.
⚙️ CI/CD Pipeline: Automated deployment on Render through GitHub Actions for continuous integration and delivery.


💻 Tech Stack
Backend: Node.js, Express, PostgreSQL, Jest, Pinecone, Hugging Face, FastAPI (Python)
 Frontend: Next.js, Tailwind CSS
 Infrastructure & DevOps: Docker, GitHub Actions, Render
 Storage & Auth: Supabase, Stripe, Google/GitHub OAuth
 Automation & Data: n8n, Puppeteer
 AI & NLP: Hugging Face Transformers, Pinecone, RAG
