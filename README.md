# LeetCode AI Assistant — Chrome Extension

A Chrome extension that adds an AI-powered chat assistant directly to LeetCode problem pages.  
It helps users understand problems, guide through solution approaches, provide hints, and explain algorithms — all without leaving the coding environment.

This assistant uses a backend server integrated with Gemini (Google’s generative AI) to provide contextual responses based on the problem text and user input.

---

## Features

✔ Slide-in AI chat panel on LeetCode  
✔ Sends problem description automatically  
✔ Structured hints and explanations  
✔ Conversation memory per session  
✔ Markdown rendering (code & formatting)  
✔ Clean dark UI designed to feel native to LeetCode

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Chrome Extension UI | HTML, JavaScript, CSS |
| Backend | Node.js, Express |
| AI Integration | Google Gemini 2.5 Flash API |
| AI Prompt Logic | System & conversation history |

---

## How It Works

1. **Extension Content Script** injected on LeetCode pages detects problem text.  
2. **Chat panel UI** lets users ask questions about the problem or approach.  
3. The extension sends requests to your local backend server (`localhost`).  
4. Backend queries Gemini (AI model) and returns structured responses.  
5. Responses are displayed in a modern, slide-in chat interface.
