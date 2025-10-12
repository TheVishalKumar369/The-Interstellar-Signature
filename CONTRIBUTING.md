# Contributing to 3I/ATLAS

First off, thank you for considering contributing to 3I/ATLAS! It's people like you that make this project such a great tool for visualizing interstellar objects.

## Code of Conduct

This project and everyone participating in it is governed by respect, inclusivity, and collaboration. By participating, you are expected to uphold these values.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps which reproduce the problem**
* **Provide specific examples to demonstrate the steps**
* **Describe the behavior you observed and what behavior you expected**
* **Include screenshots if relevant**
* **Include your environment details** (OS, browser, Node version, Python version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a detailed description of the suggested enhancement**
* **Provide specific examples to demonstrate the enhancement**
* **Explain why this enhancement would be useful**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

## Development Setup

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python main.py
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Coding Style

### Python (Backend)
- Follow PEP 8
- Use type hints where possible
- Document functions with docstrings
- Keep functions focused and single-purpose

### TypeScript/React (Frontend)
- Use functional components with hooks
- Use TypeScript for type safety
- Follow React best practices
- Use meaningful variable names

### Git Commit Messages
- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Example:
```
Add animation playback speed control

- Implement speed selector dropdown (0.5x to 10x)
- Update playback interval calculation
- Add UI controls in animation panel

Fixes #123
```

## Project Structure

- `backend/` - FastAPI backend
- `frontend/` - React + Three.js frontend
- `data/pds/` - PDS metadata JSON files
- `docs/` - Documentation

## Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Adding New Interstellar Objects

1. Add object to `backend/main.py` INTERSTELLAR_OBJECTS registry
2. Create PDS metadata JSON in `data/pds/`
3. Update color mapping in `frontend/src/components/ThreeJSViewer.tsx`
4. Test with real JPL Horizons data

## Questions?

Feel free to open an issue with the question tag, or reach out via the project's communication channels.

Thank you for contributing! 🚀
