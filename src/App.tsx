import { HashRouter, Route, Routes } from 'react-router-dom'
import { StyleProvider } from './context/StyleContext'
import { Navbar } from './components/Navbar'
import { StyleSelector } from './components/StyleSelector'
import { Home } from './pages/Home'
import { VideoDetail } from './pages/VideoDetail'
import { TrainingQueue } from './pages/TrainingQueue'
import { FlowMap } from './pages/FlowMap'

function App() {
  return (
    <HashRouter>
      <StyleProvider>
        <div className="min-h-screen" style={{ background: '#eef2ff', color: '#1a1d3b' }}>
          <Navbar />
          <StyleSelector />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/video/:id" element={<VideoDetail />} />
            <Route path="/training" element={<TrainingQueue />} />
            <Route path="/flow-map" element={<FlowMap />} />
          </Routes>
        </div>
      </StyleProvider>
    </HashRouter>
  )
}

export default App
