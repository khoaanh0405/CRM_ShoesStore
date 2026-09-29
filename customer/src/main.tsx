import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import './overrides.css';

import logo from '../assets/icons/Logo.png';

// Đặt logo làm favicon
const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');

if (favicon) {
  favicon.href = logo;
} else {
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = logo;
  document.head.appendChild(link);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
