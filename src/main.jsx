import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,     
   <footer className="mt-5 text-center text-muted small">
        <div>Data provided by USGS</div>
        <div>ZEhlert Software 2025</div>
        <div><a href="https://zachehlert.com">zachehlert.com</a></div>
      </footer>
)
