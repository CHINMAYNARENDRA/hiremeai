import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Menu,
  X,
  Send,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  User,
  Bot,
  RefreshCcw,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import "./App.css";

const API_BASE = "/api";

const seedChats = [
  {
    id: "c1",
    title: "Experience at previous company",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    messages: [
      { id: "m1", role: "user", content: "Tell me about your last role." },
      {
        id: "m2",
        role: "assistant",
        content:
          "I worked as a Backend Developer at TechNova Solutions for 1.5 years, where I built and maintained REST APIs using FastAPI, optimized database queries in PostgreSQL, and collaborated with a team of 5 engineers on a customer-facing analytics platform.",
      },
    ],
  },
  {
    id: "c2",
    title: "Skills with Python and ML",
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    messages: [
      { id: "m3", role: "user", content: "What's your experience with Python?" },
      {
        id: "m4",
        role: "assistant",
        content:
          "I have 3+ years of professional experience with Python, primarily for backend development (FastAPI, Flask) and data processing (Pandas, NumPy). I've also built small ML pipelines using scikit-learn for classification tasks.",
      },
    ],
  },
  {
    id: "c3",
    title: "New chat",
    createdAt: Date.now() - 1000 * 60 * 30,
    messages: [],
  },
];

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function formatRelativeTime(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default function App() {
  const [chats, setChats] = useState(seedChats);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [resumeStatus, setResumeStatus] = useState("idle");
  const [resumeName, setResumeName] = useState(null);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const activeChat = chats.find((c) => c.id === activeId) || null;

  const filteredChats = chats
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .filter((c) => c.title.toLowerCase().includes(searchQuery.trim().toLowerCase()));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages?.length, sending]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  const updateChat = useCallback((id, updater) => {
    setChats((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  }, []);

  function handleNewChat() {
    setActiveId(null);
    setInput("");
    setError(null);
    setSidebarOpen(false);
  }

  function handleDeleteChat(id, e) {
    e.stopPropagation();
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  }

  function handleSelectChat(id) {
    setActiveId(id);
    setSidebarOpen(false);
    setError(null);
  }

  async function handleUploadResume(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeStatus("uploading");
    setResumeName(file.name);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/upload_resume`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      setResumeStatus("success");
    } catch (err) {
      setResumeStatus("error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function sendMessage() {
    const question = input.trim();
    if (!question || sending) return;

    let chatId = activeId;
    if (!chatId) {
      const chat = {
        id: uid(),
        title: question.slice(0, 42),
        createdAt: Date.now(),
        messages: [],
      };
      setChats((prev) => [chat, ...prev]);
      chatId = chat.id;
      setActiveId(chatId);
    }

    const userMsg = { id: uid(), role: "user", content: question };
    updateChat(chatId, (c) => ({
      ...c,
      title: c.messages.length === 0 ? question.slice(0, 42) : c.title,
      messages: [...c.messages, userMsg],
    }));
    setInput("");
    setSending(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const data = await res.json();
      const answer = data.answer ?? "I don't have enough information to answer that.";
      const botMsg = { id: uid(), role: "assistant", content: answer };
      updateChat(chatId, (c) => ({ ...c, messages: [...c.messages, botMsg] }));
    } catch (err) {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleRetry() {
    setError(null);
    sendMessage();
  }

  return (
    <div className="app">
      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Hidden file input shared by sidebar upload tile + composer plus button */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleUploadResume}
        hidden
      />

      <aside
        className={`sidebar ${sidebarOpen ? "sidebar--open" : ""} ${
          sidebarCollapsed ? "sidebar--collapsed" : ""
        }`}
      >
        <div className="sidebar__top">
          <div className="brand">
            <div className="brand__mark">
              <Sparkles size={15} strokeWidth={2.4} />
            </div>
            {!sidebarCollapsed && <span className="brand__name">CandidateChat</span>}
          </div>
          <button
            className="icon-btn icon-btn--ghost sidebar__collapse-btn"
            onClick={() => setSidebarCollapsed((v) => !v)}
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? <PanelLeft size={17} /> : <PanelLeftClose size={17} />}
          </button>
          <button
            className="icon-btn icon-btn--ghost sidebar__close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <button className="nav-row nav-row--primary" onClick={handleNewChat}>
          <Plus size={17} />
          {!sidebarCollapsed && <span>New chat</span>}
        </button>

        {!sidebarCollapsed && (
          <>
            <button
              type="button"
              className="upload-tile"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-tile__icon">
                {resumeStatus === "uploading" ? (
                  <Loader2 size={16} className="spin" />
                ) : resumeStatus === "success" ? (
                  <CheckCircle2 size={16} className="text-success" />
                ) : resumeStatus === "error" ? (
                  <AlertCircle size={16} className="text-danger" />
                ) : (
                  <Upload size={16} />
                )}
              </div>
              <div className="upload-tile__text">
                <span className="upload-tile__title">
                  {resumeStatus === "uploading"
                    ? "Uploading…"
                    : resumeStatus === "success"
                    ? "Resume uploaded"
                    : resumeStatus === "error"
                    ? "Upload failed — retry"
                    : "Upload resume"}
                </span>
                <span className="upload-tile__sub">{resumeName ?? "PDF, up to 10MB"}</span>
              </div>
            </button>

            <div className="sidebar__search">
              <Search size={15} className="sidebar__search-icon" />
              <input
                type="text"
                placeholder="Search chats"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="sidebar__section-label">Recents</div>
          </>
        )}

        <div className="chat-list">
          {!sidebarCollapsed && filteredChats.length === 0 && (
            <div className="chat-list__empty">
              <MessageSquare size={22} strokeWidth={1.5} />
              <p>No chats found</p>
            </div>
          )}
          {filteredChats.map((c) => (
            <div
              key={c.id}
              className={`chat-item ${c.id === activeId ? "chat-item--active" : ""}`}
              onClick={() => handleSelectChat(c.id)}
              title={c.title}
            >
              <MessageSquare size={15} className="chat-item__icon" />
              {!sidebarCollapsed && (
                <>
                  <div className="chat-item__body">
                    <span className="chat-item__title">{c.title}</span>
                    <span className="chat-item__time">{formatRelativeTime(c.createdAt)}</span>
                  </div>
                  <button
                    className="chat-item__delete"
                    onClick={(e) => handleDeleteChat(c.id, e)}
                    aria-label="Delete chat"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="sidebar__footer">
          <div className="user-chip">
            <div className="user-chip__avatar">CP</div>
            {!sidebarCollapsed && (
              <div className="user-chip__body">
                <span className="user-chip__name">Chinmay Patil</span>
                <span className="user-chip__meta">Free plan</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button
            className="icon-btn topbar__menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <div className="topbar__title">
            <h1>CandidateChat</h1>
          </div>
          <div
            className={`status-pill status-pill--${
              resumeStatus === "success" ? "success" : "neutral"
            }`}
          >
            <FileText size={13} />
            <span>{resumeStatus === "success" ? "Resume loaded" : "No resume"}</span>
          </div>
        </header>

        {!activeChat ? (
          <div className="empty-state">
            <h2>What's on your mind today?</h2>
            <div className="composer composer--centered">
              <div className="composer__inner">
                <button
                  type="button"
                  className="composer__plus"
                  aria-label="Attach resume"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus size={18} />
                </button>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder="Ask anything"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="button"
                  className="composer__send"
                  onClick={sendMessage}
                  disabled={sending || !input.trim()}
                  aria-label="Send message"
                >
                  {sending ? <Loader2 size={17} className="spin" /> : <Send size={17} />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="messages">
              {activeChat.messages.map((m) => (
                <div key={m.id} className={`message-row message-row--${m.role}`}>
                  <div className="message-avatar">
                    {m.role === "user" ? <User size={15} /> : <Bot size={15} />}
                  </div>
                  <div className="bubble">
                    <span className="bubble__label">
                      {m.role === "user" ? "You" : "Candidate"}
                    </span>
                    <p className="bubble__text">{m.content}</p>
                  </div>
                </div>
              ))}

              {sending && (
                <div className="message-row message-row--assistant">
                  <div className="message-avatar">
                    <Bot size={15} />
                  </div>
                  <div className="bubble">
                    <span className="bubble__label">Candidate</span>
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="error-banner">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                  <button onClick={handleRetry} className="error-banner__retry">
                    <RefreshCcw size={13} />
                    Retry
                  </button>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <div className="composer">
              <div className="composer__inner">
                <button
                  type="button"
                  className="composer__plus"
                  aria-label="Attach resume"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus size={18} />
                </button>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder="Ask anything"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="button"
                  className="composer__send"
                  onClick={sendMessage}
                  disabled={sending || !input.trim()}
                  aria-label="Send message"
                >
                  {sending ? <Loader2 size={17} className="spin" /> : <Send size={17} />}
                </button>
              </div>
              <span className="composer__hint">
                Press Enter to send, Shift + Enter for a new line
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}