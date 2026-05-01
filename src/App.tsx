import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { StyleProvider } from './context/StyleContext'
import { Navbar } from './components/Navbar'
import { StyleSelector } from './components/StyleSelector'
import { Home } from './pages/Home'
import { VideoDetail } from './pages/VideoDetail'
import { TrainingQueue } from './pages/TrainingQueue'
import { FlowMap } from './pages/FlowMap'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/video/:id" element={<VideoDetail />} />
          <Route path="/training" element={<TrainingQueue />} />
          <Route path="/flow-map" element={<FlowMap />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

function App() {
  return (
    <HashRouter>
      <StyleProvider>
        <div className="min-h-screen" style={{ background: '#eef2ff', color: '#1a1d3b' }}>
          <Navbar />
          <StyleSelector />
          <AnimatedRoutes />
        </div>
      </StyleProvider>
    </HashRouter>
  )
}

export default App
