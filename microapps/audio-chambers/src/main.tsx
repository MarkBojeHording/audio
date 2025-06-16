import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AudioChambers from './AudioChambers';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AudioChambers />
  </StrictMode>
);