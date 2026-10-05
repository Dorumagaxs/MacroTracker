import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)

// Registo do Service Worker para suporte PWA e Offline
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('Service Worker registado com sucesso:', reg.scope);
      })
      .catch((err) => {
        console.log('Falha ao registar o Service Worker:', err);
      });
  });
}