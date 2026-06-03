# LeetCode AI Assistant 🤖

> A Chrome extension that injects an AI-powered chat panel directly into LeetCode problem pages — get hints, explanations, and approach guidance without ever leaving the tab.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![JavaScript](https://img.shields.io/badge/JavaScript-97%25-F7DF1E?logo=javascript&logoColor=black)
![Groq API](https://img.shields.io/badge/Powered%20by-Groq-orange)

---

## What it does

When you open any LeetCode problem, a slide-in AI chat panel appears. The extension automatically reads the problem description and passes it as context to the AI — so you can ask things like:

- *"Walk me through the approach for this"*
- *"What data structure should I use here?"*
- *"I'm getting TLE — how do I optimize?"*
- *"Explain why a sliding window works for this"*

The AI knows exactly which problem you're on, so you never have to copy-paste anything.

---

## Features

- **Auto-reads the problem** — content script extracts problem text on page load
- **Slide-in chat panel** — feels native to LeetCode's dark UI, doesn't break the layout
- **Conversation memory** — follows the thread of your questions within a session
- **Markdown rendering** — code blocks, formatting, and syntax highlighting in responses
- **Hint mode** — guides you toward the solution without just giving it away
- **No backend** — calls Groq API directly from the browser, nothing to host

---

## Tech Stack

| Layer | Technology |
|---|---|
| Extension framework | Chrome Extension (Manifest V3) |
| Content injection | Content Scripts (`content.js`) |
| AI provider | Groq API (Llama 3) |
| UI | HTML + CSS + Vanilla JS |
| Storage | Chrome Storage API |
| Background tasks | Service Worker (`background.js`) |

---

## Installation

> No npm, no build step. Just load the folder directly into Chrome.

**1. Clone the repo**
```bash
git clone https://github.com/sanskrutee99/Leetcode-AI-Assistant.git
cd Leetcode-AI-Assistant
```

**2. Open Chrome Extensions**
```
chrome://extensions
```

**3. Enable Developer Mode**

Toggle the switch in the top-right corner of the Extensions page.

**4. Load the extension**

Click **"Load unpacked"** → select the `Leetcode-AI-Assistant` folder.

**5. Get a free Groq API key**

Go to [console.groq.com](https://console.groq.com) → sign up → create an API key. It's free.

**6. Add your key**

Click the extension icon in Chrome's toolbar → paste your Groq API key → save.

---

## Usage

1. Open any LeetCode problem — e.g. `leetcode.com/problems/two-sum`
2. The AI chat panel slides in on the right side
3. Start asking questions about the problem
4. The assistant responds with structured hints, approach breakdowns, and code explanations

---

## Project Structure

```
Leetcode-AI-Assistant/
├── manifest.json          ← Extension config (Manifest V3, permissions, content script rules)
├── background.js          ← Service worker (handles API calls, message passing)
├── content.js             ← Injected into LeetCode pages, extracts problem + mounts chat UI
├── popup.html             ← Extension popup (API key setup, settings)
├── popup.js               ← Popup logic
└── shared/
    ├── storage.js         ← Chrome storage wrapper (saves API key, conversation history)
    ├── groq.js            ← Groq API client (sends messages, handles streaming)
    ├── constants.js       ← Prompt templates, model config
    ├── problemContext.js  ← DOM scraper that extracts problem title + description
    └── chat.js            ← Chat UI component (renders messages, handles markdown)
```

---

## How It Works

```
User opens leetcode.com/problems/*
          ↓
  content.js injects into the page
          ↓
  problemContext.js reads problem title + description from the DOM
          ↓
  Chat panel UI mounts on the right side of the screen
          ↓
  User types a question
          ↓
  groq.js sends [system prompt + problem context + conversation history] to Groq API
          ↓
  Response streams back and renders in the chat panel with markdown
```

The system prompt is designed to act as a coding mentor — it gives structured hints and explains reasoning rather than just dumping a solution.

---

## Permissions

| Permission | Why it's needed |
|---|---|
| `storage` | Saves your Groq API key and chat history locally |
| `host_permissions: api.groq.com` | Allows the extension to call the Groq API from the browser |

The extension does **not** collect any data. Your API key never leaves your browser — it's stored in Chrome's local storage and sent directly to Groq.

---

## Configuration

| Setting | Default | Description |
|---|---|---|
| API Key | (required) | Your Groq API key from console.groq.com |
| Model | `llama3-8b-8192` | Fast, free, accurate for coding problems |

