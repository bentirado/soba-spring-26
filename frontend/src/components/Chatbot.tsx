import { useState, useRef, useEffect } from "react";
import type * as React from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  X,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface ChatbotProps {
  onQueryGenerate?: (query: string) => void;
}

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000";

const STORAGE_KEY = "binjow_chat_history";
const HISTORY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hello! I'm Binjow, your Science Museum of Oklahoma assistant. I can help you navigate the platform and find what you need. How can I help you today?",
  timestamp: new Date(),
  suggestions: [
    "How do I upload data?",
    "Where can I see volunteer trends?",
    "How do I send a badge?",
  ],
};

function loadStoredMessages(): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [WELCOME_MESSAGE];
    const { messages, savedAt } = JSON.parse(raw) as {
      messages: Message[];
      savedAt: number;
    };
    if (Date.now() - savedAt > HISTORY_TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return [WELCOME_MESSAGE];
    }
    return messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [WELCOME_MESSAGE];
  }
}

function saveMessages(messages: Message[]) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ messages, savedAt: Date.now() })
    );
  } catch {
    // storage full or unavailable — silently ignore
  }
}

export function Chatbot({ onQueryGenerate: _onQueryGenerate }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(loadStoredMessages);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (messagesRef.current) {
      messagesRef.current.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => scrollToBottom("smooth"), 50);
    return () => clearTimeout(timeout);
  }, [messages, isLoading]);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const currentInput = inputValue.trim();
    setError("");

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: currentInput,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      // Build the conversation history to send — exclude the welcome message's
      // suggestion buttons since those are UI-only and not part of the AI context.
      const history = updatedMessages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = (await response.json()) as { reply: string };

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      setError("Could not reach the assistant. Please make sure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setIsOpen(true)}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: "56px",
            height: "56px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "999px",
            border: "none",
            cursor: "pointer",
            background: "linear-gradient(135deg, #1e5eb8, #ff7b3f)",
            color: "white",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            zIndex: 9999,
          }}
        >
          <MessageSquare size={24} />
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              bottom: "20px",
              right: "20px",
              width: "380px",
              height: "520px",
              background: "#fff",
              borderRadius: "16px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              zIndex: 9999,
              border: "1px solid #e5e7eb",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "linear-gradient(90deg, #1e5eb8, #ff7b3f, #2ea86f)",
                color: "white",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    lineHeight: 0,
                  }}
                >
                  <MessageSquare size={18} color="#1e5eb8" style={{ display: "block" }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px" }}>BINJOW AI</div>
                  <div style={{ fontSize: "12px", opacity: 0.9 }}>
                    Your platform guide
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={messagesRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px 12px",
                background: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      display: "flex",
                      justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                      gap: "8px",
                    }}
                  >
                    {message.role === "assistant" && (
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "999px",
                          background: "linear-gradient(135deg, #1e5eb8, #2ea86f)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Bot size={16} color="white" style={{ display: "block" }} />
                      </div>
                    )}

                    <div
                      style={{
                        maxWidth: "80%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: message.role === "user" ? "flex-end" : "flex-start",
                        gap: "6px",
                      }}
                    >
                      <div
                        style={{
                          padding: "10px 12px",
                          borderRadius: "16px",
                          fontSize: "14px",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          background:
                            message.role === "user"
                              ? "linear-gradient(135deg, #1e5eb8, #1a52a0)"
                              : "#ffffff",
                          color: message.role === "user" ? "white" : "#1f2937",
                          border:
                            message.role === "assistant" ? "1px solid #e5e7eb" : "none",
                        }}
                      >
                        {message.content}
                      </div>

                      {message.suggestions && message.suggestions.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                          {message.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSuggestionClick(suggestion)}
                              style={{
                                fontSize: "12px",
                                padding: "6px 10px",
                                borderRadius: "999px",
                                border: "1px solid #dbe3ea",
                                background: "white",
                                cursor: "pointer",
                              }}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}

                      <span style={{ fontSize: "11px", color: "#6b7280" }}>
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {message.role === "user" && (
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "999px",
                          background: "linear-gradient(135deg, #ff7b3f, #e66e38)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <User size={16} color="white" style={{ display: "block" }} />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "999px",
                        background: "linear-gradient(135deg, #1e5eb8, #2ea86f)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Bot size={16} color="white" style={{ display: "block" }} />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "16px",
                        padding: "10px 12px",
                        fontSize: "14px",
                        color: "#6b7280",
                      }}
                    >
                      <Loader2 size={16} className="animate-spin" />
                      Thinking...
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input area */}
            <div
              style={{
                borderTop: "1px solid #e5e7eb",
                padding: "12px",
                background: "white",
              }}
            >
              {error && (
                <p style={{ fontSize: "12px", color: "#dc2626", marginBottom: "8px" }}>
                  {error}
                </p>
              )}
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask how to use the platform..."
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    minHeight: "46px",
                    maxHeight: "90px",
                    resize: "none",
                    borderRadius: "12px",
                    border: "1px solid #dbe3ea",
                    padding: "10px 12px",
                    fontSize: "14px",
                    outline: "none",
                    background: "#f8fafc",
                  }}
                />

                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    border: "none",
                    cursor: !inputValue.trim() || isLoading ? "not-allowed" : "pointer",
                    background: "linear-gradient(135deg, #1e5eb8, #2ea86f)",
                    color: "white",
                    opacity: !inputValue.trim() || isLoading ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    lineHeight: 0,
                  }}
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" style={{ display: "block" }} />
                  ) : (
                    <Send size={16} style={{ display: "block" }} />
                  )}
                </button>
              </div>

              <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "8px" }}>
                Enter to send • Shift+Enter for new line
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
