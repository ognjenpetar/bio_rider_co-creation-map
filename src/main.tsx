import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Import i18n configuration
import './lib/i18n';

// Import styles
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
