import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export function useCanciones() {
  const [listaCanciones, setListaCanciones] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "confirmaciones"), orderBy("fecha", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const canciones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setListaCanciones(canciones);
    });
    return () => unsubscribe();
  }, []);

  return listaCanciones;
}
