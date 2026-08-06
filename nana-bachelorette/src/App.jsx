import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import RegistroPage from './pages/RegistroPage';
import LineupPage from './pages/LineupPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<RegistroPage />} />
      <Route path="/lineup" element={<Layout />}>
        <Route index element={<LineupPage />} />
      </Route>
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  );
}

export default App;
