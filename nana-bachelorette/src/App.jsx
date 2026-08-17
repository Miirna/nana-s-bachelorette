import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import RegistroPage from './pages/RegistroPage';
import LineupPage from './pages/LineupPage';
import DashboardPage from './pages/DashboardPage';
import DashboardResumen from './pages/DashboardResumen';
import DashboardInvitadas from './pages/DashboardInvitadas';
import DashboardCanciones from './pages/DashboardCanciones';
import DashboardMensajes from './pages/DashboardMensajes';
import RuletaPage from './pages/RuletaPage';
import MiCancionPage from './pages/MiCancionPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<RegistroPage />} />
      <Route path="/ruleta" element={<RuletaPage />} />
      <Route path="/mi-cancion" element={<MiCancionPage />} />
      <Route path="/lineup" element={<Layout />}>
        <Route index element={<LineupPage />} />
      </Route>
      <Route path="/dashboard" element={<DashboardPage />}>
        <Route index element={<DashboardResumen />} />
        <Route path="invitadas" element={<DashboardInvitadas />} />
        <Route path="canciones" element={<DashboardCanciones />} />
        <Route path="mensajes" element={<DashboardMensajes />} />
      </Route>
    </Routes>
  );
}

export default App;
