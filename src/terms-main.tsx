import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './site.css'
import './legal.css'
import { Terms } from './Legal.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Terms />
  </StrictMode>,
)
