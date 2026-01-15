# Contributing to Grooopy

First off, thanks for taking the time to contribute! 🎉

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Chrome version**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Screenshots** if applicable

### Suggesting Features

Feature requests are welcome! Please provide:

- **Clear description** of the feature
- **Use case** — why would this be useful?
- **Possible implementation** (optional)

### Pull Requests

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit (`git commit -m 'Add amazing feature'`)
6. Push (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/grooopy.git
cd grooopy

# Install dependencies
npm install

# Build
npm run build

# Load in Chrome: chrome://extensions → Load unpacked → select folder
```

## Code Style

- **Readable over clever** — Code is read more than written
- **Meaningful names** — `calculateGroupCapacity` not `calcGrpCap`
- **Comments for why, not what** — The code shows what, comments explain why
- **JSDoc for public methods**

## Architecture Notes

### Key Files

| File | Purpose |
|------|---------|
| `src/clustering.js` | Core AI clustering engine |
| `src/tabManager.js` | Chrome API interactions |
| `background.js` | Service worker orchestration |

### The Clustering Pipeline

```
Tabs → Content Extraction → Embeddings → Similarity Matrix → HAC → Groups
```

## Questions?

Open an issue with the `question` label.

---

Thanks for contributing! 🚀
