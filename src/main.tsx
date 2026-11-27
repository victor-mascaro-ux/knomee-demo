import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import Toaster from './components/Toaster.tsx'
import './index.css'
import { initReviewBridge } from './reviewBridge.ts'

initReviewBridge()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>,
)
