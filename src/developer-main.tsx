import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './site.css'
import './developer.css'
import Developer from './Developer.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Developer />
  </StrictMode>,
)
