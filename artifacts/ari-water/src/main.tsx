import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { initAnalytics } from './lib/analytics';

// Boot Google Analytics 4 (requires VITE_GA_MEASUREMENT_ID env var)
initAnalytics();

createRoot(document.getElementById('root')!).render(<App />);
