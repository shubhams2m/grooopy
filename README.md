<div align="center">

# 🧠 Grooopy

### AI-Powered Tab Grouping for Chrome

**Stop drowning in tabs. Let AI organize them for you.**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://chrome.google.com/webstore)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Made with AI](https://img.shields.io/badge/Made%20with-🧠%20AI-blueviolet?style=for-the-badge)](https://github.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](http://makeapullrequest.com)

<img src="icons/icon128.png" width="128" alt="Grooopy Logo">

*Your tabs, intelligently organized. Locally. Privately. Instantly.*

[Features](#-features) • [Installation](#-installation) • [How It Works](#-how-it-works) • [Architecture](#-architecture) • [Contributing](#-contributing)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🧠 **Semantic Clustering** | Uses state-of-the-art NLP embeddings to understand what your tabs are *about* |
| 🎯 **Content-First** | Groups by meaning, not just domain. React docs across 5 sites? One group. |
| 📏 **Screen-Aware** | Adapts grouping density based on your window width |
| 🔒 **100% Private** | Everything runs locally in your browser. No data leaves your machine. |
| ⚡ **One-Click** | Click the button. Watch the magic. That's it. |
| 🎨 **Smart Naming** | Auto-generates meaningful group names using semantic analysis |

---

## 🚀 Installation

### From Source (Developer)

```bash
# Clone the repository
git clone https://github.com/shubhams2m/grooopy.git
cd grooopy

# Install dependencies
npm install

# Build the extension
npm run build
```

Then load in Chrome:
1. Go to `chrome://extensions`
2. Enable **Developer Mode** (top right)
3. Click **Load unpacked**
4. Select the `grooopy` folder

### From Chrome Web Store
*Coming soon...*

---

## 🎬 How It Works

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           YOUR 47 OPEN TABS                              │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  📄 Content Extraction                                                    │
│  • Page titles, meta descriptions, headers, paragraphs                   │
│  • URL path analysis                                                     │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  🧠 AI Embedding Generation                                               │
│  • all-MiniLM-L6-v2 (384-dim sentence embeddings)                        │
│  • Runs 100% locally via Transformers.js + ONNX/WebAssembly              │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  📊 Multi-Signal Similarity Scoring                                       │
│  • Semantic similarity (primary)                                         │
│  • Domain affinity boost                                                 │
│  • URL path pattern matching                                             │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  🔗 Agglomerative Hierarchical Clustering                                 │
│  • Bottom-up merging with average linkage                                │
│  • Adaptive thresholds based on tab count                               │
│  • Screen-width aware group capacity                                     │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  ✨ ORGANIZED TAB GROUPS                                                  │
│  📁 REACT     📁 NEWS     📁 SHOPPING     📁 DOCS                        │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture

```
grooopy/
├── manifest.json          # Chrome extension manifest (MV3)
├── background.js          # Service worker entry point
├── build.js               # esbuild configuration
├── src/
│   ├── clustering.js      # 🧠 Core AI clustering engine
│   ├── tabManager.js      # Chrome tabs/groups API wrapper
│   ├── offscreen.js       # Offscreen document for AI processing
│   ├── offscreen.html     # Offscreen document HTML
│   ├── popup.html         # Extension popup UI
│   └── popup.js           # Popup logic
├── dist/                  # Built bundles
└── icons/                 # Extension icons
```

### The Clustering Engine

The heart of Grooopy is `src/clustering.js` — a production-grade implementation featuring:

- **Agglomerative Hierarchical Clustering (HAC)** with average linkage
- **Multi-signal similarity scoring**: semantic embeddings + domain affinity + URL patterns
- **Adaptive thresholds** that scale with tab count
- **Smart singleton consolidation** with multi-pass orphan handling
- **Semantic name generation** using TF-IDF-like scoring

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| AI Model | [all-MiniLM-L6-v2](https://huggingface.co/Xenova/all-MiniLM-L6-v2) via Transformers.js |
| Runtime | ONNX + WebAssembly |
| Bundler | esbuild |
| Platform | Chrome Extension Manifest V3 |

### Why This Model?

- **22.7 MB** — Small enough for browser caching
- **384 dimensions** — Fast similarity computation
- **MIT License** — Free for any use
- **SOTA performance** — Trained on 1B+ sentence pairs

---

## 🤝 Contributing

Contributions are welcome! Whether it's:

- 🐛 Bug fixes
- ✨ New features
- 📖 Documentation improvements
- 🎨 UI/UX enhancements

### Development Setup

```bash
# Clone and install
git clone https://github.com/shubhams2m/grooopy.git
cd grooopy
npm install

# Build (with file watching)
npm run build

# Load the extension in Chrome and test
```

### Code Style

- Clean, readable code with meaningful comments
- JSDoc for public methods
- Descriptive variable names

---

## 📜 License

MIT License — do whatever you want with it.

---

## 🙏 Acknowledgments

- [Transformers.js](https://github.com/xenova/transformers.js) by Xenova — for making SOTA ML accessible in the browser
- [Hugging Face](https://huggingface.co) — for the model hosting
- The open source community

---

<div align="center">

### Built with ❤️ and caffeine

*Created with the assistance of [Antigravity](https://github.com/google/anthropic-quickstarts) — an AI coding assistant.*

**If this helped you tame your tab chaos, consider giving it a ⭐**

</div>
