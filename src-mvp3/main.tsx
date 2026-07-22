import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { MockLoginGate } from '../src/components/MockSession'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
    <MockLoginGate variant="tenant" mvpRoute="Tenant MVP 3">
      <App />
    </MockLoginGate>
    </StrictMode>,
)
