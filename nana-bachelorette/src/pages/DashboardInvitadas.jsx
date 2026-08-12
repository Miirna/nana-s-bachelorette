import { useOutletContext } from 'react-router-dom';
import InvitadasList from '../components/InvitadasList';

function DashboardInvitadas() {
  const { invitadas } = useOutletContext();

  return (
    <div className="kawaii-dash-panel-full">
      <InvitadasList invitadas={invitadas} />
    </div>
  );
}

export default DashboardInvitadas;
