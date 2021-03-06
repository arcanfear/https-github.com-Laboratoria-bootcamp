import { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import createClient from './client';
import Loading from '../components/Loading';


const {
  REACT_APP_LABORATORIA_API_URL,
  REACT_APP_FIREBASE_API_KEY,
  REACT_APP_FIREBASE_PROJECT,
} = process.env;


const AppContext = createContext();


const firebaseApp = initializeApp({
  apiKey: REACT_APP_FIREBASE_API_KEY,
  authDomain: `${REACT_APP_FIREBASE_PROJECT}.firebaseapp.com`,
  databaseURL: `https://${REACT_APP_FIREBASE_PROJECT}.firebaseio.com`,
  projectId: REACT_APP_FIREBASE_PROJECT,
});


//
// Custom hook for usage in functional components.
//
export const useApp = () => useContext(AppContext);

//
// App Context Provider to be wrapped around the whole App.
//
export const AppProvider = ({ children }) => {
  const auth = getAuth(firebaseApp);
  const [user, setUser] = useState();
  const [profile, setProfile] = useState();

  useEffect(() => onAuthStateChanged(auth, (user) => {
    if (!user) {
      setUser(null);
      setProfile(null);
      return;
    }
    setUser(user);
  }), [auth]);

  useEffect(() => {
    if (!user) {
      return;
    }

    createClient(REACT_APP_LABORATORIA_API_URL, user)('/me')
      .then((profile) => {
        setProfile(profile);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [user]);

  const app = {
    auth: {
      user,
      profile,
      signIn: ({ email, password }) => signInWithEmailAndPassword(auth, email, password),
      signOut: () => signOut(auth),
    },
    client: createClient(REACT_APP_LABORATORIA_API_URL, user),
  };

  // If auth not ready...
  if (typeof user === 'undefined') {
    return <Loading />;
  }

  return (
    <AppContext.Provider value={app}>
      {children}
    </AppContext.Provider>
  );
};
