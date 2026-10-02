import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/big-shoulders-display/600.css';
import '@fontsource/big-shoulders-display/800.css';
import '@fontsource/big-shoulders-display/900.css';
import '@fontsource-variable/instrument-sans';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import './styles/app.css';
import './styles/extras.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
