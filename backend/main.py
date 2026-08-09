import json
import os
import tempfile
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel
from pypdf import PdfReader


# =========================================================
# ENVIRONMENT
# =========================================================

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY is not set")

client = Groq(api_key=GROQ_API_KEY)

# Current Groq production model
MODEL = "llama-3.1-8b-instant"


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="HireMeAI Backend",
    description="AI-powered interview chatbot based on uploaded resume",
    version="1.0.0",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# RESUME MODELS
# =========================================================

class Experience(BaseModel):
    company: str | None = None
    role: str | None = None
    duration: str | None = None
    description: str | None = None
    skills_used: list[str] = []


class Resume(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    total_experience_years: float | None = None

    skills: list[str] = []
    experiences: list[Experience] = []
    education: list[str] = []
    projects: list[str] = []
    certifications: list[str] = []


resume_schema = Resume.model_json_schema()


class ChatRequest(BaseModel):
    question: str


# =========================================================
# GLOBAL CURRENT RESUME
# =========================================================

current_resume: Resume | None = None


# =========================================================
# READ PDF
# =========================================================

def read_pdf(file_path: Path) -> str:
    """
    Extract text from a PDF file.
    """

    reader = PdfReader(str(file_path))

    text = ""

    for page in reader.pages:
        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"

    return text.strip()


# =========================================================
# PARSE RESUME USING GROQ
# =========================================================

def parse_resume(resume_text: str) -> Resume:

    system_prompt = f"""
You are an expert resume parser.

Extract information from the resume based on its meaning,
not only exact section headings.

Return ONLY valid JSON matching this schema:

{json.dumps(resume_schema, indent=2)}

Rules:

1. Do not invent information.
2. If a value is unavailable, return null.
3. If a list has no information, return an empty list.
4. Include internships inside experiences.
5. Extract skills mentioned across the entire resume.
6. Extract projects mentioned in the resume.
7. Extract certifications mentioned in the resume.
8. Keep the information faithful to the resume.
"""

    user_prompt = f"""
Parse the following resume:

---------------- RESUME ----------------

{resume_text}

-----------------------------------------
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": user_prompt,
            },
        ],
        response_format={
            "type": "json_object"
        },
    )

    raw_output = response.choices[0].message.content

    try:
        data = json.loads(raw_output)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Resume parsing returned invalid JSON: {str(e)}",
        )

    try:
        return Resume(**data)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Resume data validation failed: {str(e)}",
        )


# =========================================================
# ASK CANDIDATE
# =========================================================

def ask_candidate(question: str, resume: Resume) -> str:

    system_prompt = f"""
You are an AI assistant representing a job candidate
during a job interview.

Below is the candidate's resume information:

{resume.model_dump_json(indent=2)}

Rules:

1. Answer ONLY using information available in the resume.
2. Never invent experience, skills, companies, projects,
   education, certifications, or achievements.
3. If the requested information is not available,
   say exactly:

"I don't have enough information to answer that."

4. Answer professionally.
5. Answer naturally as if the candidate is speaking.
6. Keep answers concise but useful.
7. For interview questions, answer in first person.
8. Do not mention that you are an AI unless specifically asked.
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": question,
            },
        ],
    )

    return response.choices[0].message.content


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/")
def home():

    return {
        "message": "HireMeAI Backend is running!",
        "status": "healthy",
    }


# =========================================================
# UPLOAD RESUME
# =========================================================

@app.post("/upload_resume")
async def upload_resume(file: UploadFile = File(...)):

    global current_resume

    # Check file type
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected.",
        )

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported.",
        )

    try:

        # Read uploaded file
        file_bytes = await file.read()

        if not file_bytes:
            raise HTTPException(
                status_code=400,
                detail="Uploaded PDF is empty.",
            )

        # Save temporarily
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".pdf",
        ) as temp_file:

            temp_file.write(file_bytes)
            temp_path = Path(temp_file.name)

        try:

            # Extract PDF text
            resume_text = read_pdf(temp_path)

            if not resume_text.strip():
                raise HTTPException(
                    status_code=400,
                    detail="Could not extract text from this PDF.",
                )

            # Parse resume
            current_resume = parse_resume(resume_text)

        finally:

            # Delete temporary PDF
            if temp_path.exists():
                temp_path.unlink()

        return {
            "message": "Resume uploaded successfully!",
            "filename": file.filename,
            "resume": current_resume.model_dump(),
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Resume upload failed: {str(e)}",
        )


# =========================================================
# CHAT
# =========================================================

@app.post("/chat")
def chat(request: ChatRequest):

    global current_resume

    if current_resume is None:
        raise HTTPException(
            status_code=400,
            detail="Please upload a resume first.",
        )

    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    try:

        answer = ask_candidate(
            request.question,
            current_resume,
        )

        return {
            "answer": answer,
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate answer: {str(e)}",
        )


# =========================================================
# RUN LOCALLY
# =========================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True,
    )