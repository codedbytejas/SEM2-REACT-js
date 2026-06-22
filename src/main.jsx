/*
=================================================
FILE: src/main.jsx

Purpose:
Yeh file React app ko browser mein mount karne ke liye hai.

Is file mein:
1. React aur createRoot import hote hain
2. Global CSS import hoti hai
3. `<App />` ko DOM ke `#root` element pe render karte hain

Viva Explanation:
Examiner ko bata sakte ho ki yeh entry point hai jo React ko DOM se bind karta hai. Agar yeh hata do app browser mein nahi dikhega.
React concept: Root rendering, StrictMode (development checks), Virtual DOM mount
=================================================
*/

// React ke core imports
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Global stylesheet jo poore app pe apply hoti hai
import './index.css'

// Top level App component
import App from './App.jsx'

// Root element pe React app mount kar raha hai
// Agar yeh line hata di toh React app render hi nahi hoga
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
