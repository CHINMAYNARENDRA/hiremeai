# HireMeAI 🤖

HireMeAI is an AI-powered interview assistant that answers interview questions based on a candidate's resume. It uses **React**, **FastAPI**, and **Groq LLM** to provide personalized interview responses.

## 🚀 Live Demo

https://hiremeaiproject-frontend.onrender.com

## ✨ Features

* 📄 Resume upload
* 🤖 AI-powered interview chatbot
* 🧠 Resume-based answers
* 💬 Interactive chat interface
* ⚡ Fast AI responses using Groq
* 🌐 Deployed on Render

## 🛠️ Tech Stack

* **Frontend:** React.js, Vite, JavaScript, CSS
* **Backend:** Python, FastAPI
* **AI:** Groq API / LLM
* **Deployment:** Render
* **Tools:** Git, GitHub, VS Code

## 📁 Project Structure

```text
hiremeai/
├── backend/
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── main.py
├── pyproject.toml
└── README.md
```

## ⚙️ Run Locally

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

## 🔐 Environment Variables

Create a `.env` file and add your Groq API key:

```env
GROQ_API_KEY=your_groq_api_key
```

## 💡 How It Works

1. Upload your resume.
2. Ask an interview question.
3. HireMeAI uses your resume as context.
4. Groq LLM generates a personalized answer.
5. The answer is displayed in the chat interface.

## 🎯 Use Cases

* Interview preparation
* Resume-based mock interviews
* Placement preparation
* HR and technical interview practice

## 👨‍💻 Author

**Chinmay Narendra Patil**

GitHub: https://github.com/CHINMAYNARENDRA
