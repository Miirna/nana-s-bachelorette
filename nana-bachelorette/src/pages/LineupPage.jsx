import { useOutletContext } from 'react-router-dom';
import CancionesList from '../components/CancionesList';

function LineupPage() {
  const { listaCanciones } = useOutletContext();

  return (
    <>
      <div className="lineup-header">
        <h3>Line-up de la Noche</h3>
      </div>
      <CancionesList listaCanciones={listaCanciones} />
    </>
  );
}

export default LineupPage;
