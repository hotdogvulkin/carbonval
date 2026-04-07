import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Methodology from './pages/Methodology'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/methodology" element={<Methodology />} />
      </Routes>
    </BrowserRouter>
  )
}
