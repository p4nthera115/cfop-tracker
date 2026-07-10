import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { OllPage } from './pages/OllPage'
import { PllPage } from './pages/PllPage'

/**
 * HashRouter, not BrowserRouter: `vite.config.ts` keeps `base: './'` so `dist/`
 * works from any GitHub Pages subpath, and a basename that isn't known at build
 * time is exactly what BrowserRouter needs. The routes live in the fragment
 * instead — `/` still serves OLL, and PLL is `/#/pll`. No 404.html required.
 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<OllPage />} />
        <Route path="/pll" element={<PllPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
