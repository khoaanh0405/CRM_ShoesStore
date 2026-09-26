import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import router from './routes';
import './index.css';

// Dọn dữ liệu đăng nhập cũ còn sót lại từ trước khi chuyển sang sessionStorage
// (tránh token cũ trong localStorage bị các axios instance cũ vô tình đọc lại).
localStorage.removeItem('token');
localStorage.removeItem('user');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);