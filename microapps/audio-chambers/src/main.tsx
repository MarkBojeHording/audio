import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AudioChambers from './AudioChambers';
import './index.css';

// Ensure fonts are loaded before rendering
document.fonts.ready.then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AudioChambers />
    </StrictMode>
  );
}).catch(() => {
  // Fallback if font loading fails
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AudioChambers />
    </StrictMode>
  );
});