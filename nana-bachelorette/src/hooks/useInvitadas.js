import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export function useInvitadas() {
  const [invitadas, setInvitadas] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "invitadas"), orderBy("fecha", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvitadas(lista);
    });
    return () => unsubscribe();
  }, []);

  return invitadas;
}
