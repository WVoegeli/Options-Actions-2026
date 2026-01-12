import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/common/Layout'
import Dashboard from './components/Dashboard/Dashboard'
import Positions from './components/Positions/Positions'
import Journal from './components/Journal/Journal'
import Strategies from './components/Strategies/Strategies'
import Education from './components/Education/Education'
import Analytics from './components/Analytics/Analytics'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/positions" element={<Positions />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/strategies" element={<Strategies />} />
        <Route path="/education" element={<Education />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Layout>
  )
}

export default App
