import { useOutletContext } from 'react-router-dom';
import CancionesAdminList from '../components/CancionesAdminList';

function DashboardCanciones() {
  const { invitadas, cancionesFiltradas, busqueda } = useOutletContext();

  return (
    <div className="kawaii-dash-panel-full">
      <CancionesAdminList canciones={cancionesFiltradas} busqueda={busqueda} invitadas={invitadas} />
    </div>
  );
}

export default DashboardCanciones;
