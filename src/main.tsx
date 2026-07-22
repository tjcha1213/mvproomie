import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { MockLoginGate } from './components/MockSession'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
    <MockLoginGate variant="tenant" mvpRoute="Tenant MVP 1">
      <App />
    </MockLoginGate>
    </StrictMode>,
)
