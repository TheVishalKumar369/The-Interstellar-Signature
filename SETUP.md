# Setup Guide for 3I/ATLAS

Complete step-by-step setup instructions for developers.

## System Requirements

- **Node.js**: v18.0.0 or higher
- **Python**: 3.9 or higher
- **Git**: Latest version
- **Browser**: Chrome, Firefox, or Edge (with WebGL support)

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/3I_ATLAS.git
cd 3I_ATLAS
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Or use a virtual environment (recommended):

```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate

# Then install
pip install -r requirements.txt
```

#### Configure Backend Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings (optional)
# Default values work for local development
```

#### Verify Backend Installation

```bash
python main.py
```

You should see:
```
INFO:     Started server process
INFO:     Uvicorn running on http://127.0.0.1:8000
```

Visit `http://localhost:8000/api/docs` to see the API documentation.

### 3. Frontend Setup

#### Install Node Dependencies

```bash
cd ../frontend
npm install
```

Or with yarn:
```bash
yarn install
```

#### Configure Frontend Environment

```bash
# Copy example environment file
cp .env.example .env

# Default settings:
# VITE_API_URL=http://localhost:8000
```

#### Verify Frontend Installation

```bash
npm run dev
```

You should see:
```
VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

## Running the Application

### Start Both Services

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Open your browser to `http://localhost:3000`

## Common Issues

### Backend Issues

**Issue: Port 8000 already in use**
```bash
# Change port in backend/.env
API_PORT=8001
```

**Issue: Module not found**
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

**Issue: JPL Horizons connection fails**
- Check internet connection
- Verify firewall settings
- Try increasing `JPL_REQUEST_DELAY` in `.env`

### Frontend Issues

**Issue: CORS errors**
```bash
# In backend/.env, ensure:
CORS_ORIGINS=["http://localhost:3000"]
```

**Issue: Three.js rendering errors**
- Clear browser cache
- Update graphics drivers
- Check WebGL support: visit `about://gpu` (Chrome)

**Issue: node_modules issues**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## Building for Production

### Backend
```bash
cd backend
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

### Frontend
```bash
cd frontend
npm run build
```

Output will be in `frontend/dist/`

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

## IDE Setup

### VS Code Recommended Extensions
- Python
- Pylance
- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)

### PyCharm Setup
1. Open `backend` directory as project
2. Configure Python interpreter (venv)
3. Install requirements from `requirements.txt`

## Docker Setup (Optional)

Coming soon...

## Next Steps

1. Read the [README.md](README.md) for feature overview
2. Check [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines
3. Explore the [API documentation](http://localhost:8000/api/docs) when backend is running
4. Try the example workflow in the README

## Need Help?

- Check [Troubleshooting Guide](TROUBLESHOOTING.md)
- Open an issue on GitHub
- Contact the maintainers

Happy coding! 🚀
