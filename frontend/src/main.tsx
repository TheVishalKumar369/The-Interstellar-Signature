import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Suppress Three.js linewidth console errors (unsupported in WebGL)
const originalError = console.error;
console.error = (...args: any[]) => {
  // Convert first argument to string to check for Three.js errors
  const firstArg = String(args[0] || '');

  // Filter out Three.js uniform errors related to linewidth (these are harmless)
  if (firstArg.includes('refreshUniformsCommon') ||
      firstArg.includes('refreshUniforms') ||
      firstArg.includes("Cannot read properties of undefined (reading 'value')") ||
      firstArg.includes('chunk-HXHWFBWS')) {
    return; // Suppress these specific errors
  }
  originalError.apply(console, args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
