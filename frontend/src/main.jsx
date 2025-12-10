import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { Providers } from './app/providers.jsx'
import './styles/App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <Providers>
    <App />
  </Providers>
)
