import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import './theme-light.css'

const savedTheme = globalThis.localStorage?.getItem('geoguide-theme')
const initialTheme = savedTheme === 'light' || savedTheme === 'dark'
  ? savedTheme
  : (globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
document.documentElement.dataset.theme = initialTheme
if (globalThis.localStorage?.getItem('geoguide-accessibility') === 'true') {
  document.documentElement.dataset.accessibility = 'true'
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)
