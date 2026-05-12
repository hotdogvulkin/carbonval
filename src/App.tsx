import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Methodology from './pages/Methodology'
import Valuation from './pages/Valuation'
import Compliance from './pages/Compliance'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/methodology" element={<Methodology />} />
        <Route path="/v/:id" element={<Valuation />} />
        <Route path="/compliance" element={<Compliance />} />
      </Routes>
    </BrowserRouter>
  )
}
