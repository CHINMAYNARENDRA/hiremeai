# HireMeAI

HireMeAI is an AI-powered interview assistant that answers interview questions on behalf of a candidate based on their uploaded resume. The project combines a FastAPI backend, a React frontend, and Groq-powered AI responses to create a smart resume-based interview chatbot.

## Features

* Upload resume and use it as context for interview answers
* AI-generated responses tailored to the candidate profile
* FastAPI backend for request handling
* React frontend for user interaction
* Groq integration for fast LLM responses

## Tech Stack

**Frontend**

* React
* Vite
* JavaScript

**Backend**

* FastAPI
* Python

**AI / LLM**

* Groq API

**Other Tools**

* Uvicorn
* Pydantic
* Python package management with `pyproject.toml`

## Project Structure

```bash
hiremeai/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── Chinmay.pdf
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── main.py
├── pyproject.toml
└── README.md
```

## Setup Instructions

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create a `.env` file in the backend if your app needs API keys:

```env
GROQ_API_KEY=your_groq_api_key
```

## How It Works

1. User uploads a resume.
2. Backend processes the resume content.
3. Interview question is sent to the AI model.
4. Model generates an answer based on the resume context.
5. Response is shown in the React frontend.

## Use Case

This project can be used as:

* A mock interview assistant
* A resume-based answer generator
* A candidate preparation tool for interviews

## Notes

* Make sure your API keys are configured correctly.
* Ensure backend and frontend are running on the correct ports.
* The repository currently does not include a detailed README, so this file adds basic project documentation.

## Author

**Chinmay Narendra Patil**
