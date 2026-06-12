import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import Layout from './components/Layout'
import CreateEvent from './components/CreateEvent'
import EventPage from './components/EventPage'

export default function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<CreateEvent />} />
          <Route path="/event/:id" element={<EventPage />} />
        </Routes>
      </Layout>
    </AuthProvider>
  )
}
