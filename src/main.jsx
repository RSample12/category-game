import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/big-shoulders-display/600';
import '@fontsource/big-shoulders-display/800';
import '@fontsource/big-shoulders-display/900';
import '@fontsource-variable/instrument-sans';
import '@fontsource/ibm-plex-mono/500';
import '@fontsource/ibm-plex-mono/600';
import './styles/app.css';
import './styles/extras.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
