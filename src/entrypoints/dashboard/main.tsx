import '@/dashboard/styles.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/dashboard/App';

const container = document.getElementById('root');
if (!container) {
  throw new Error('historia: #root element missing from dashboard.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
