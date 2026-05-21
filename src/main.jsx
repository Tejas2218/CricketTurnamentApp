import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { TournamentProvider } from './store/TournamentContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TournamentProvider>
      <App />
    </TournamentProvider>
  </StrictMode>,
)
