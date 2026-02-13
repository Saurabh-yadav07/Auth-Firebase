import { createContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext({
  token: '',
  isLoggedIn: false,
  login: (token, expiresIn) => {},
  logout: () => {},
});

let logoutTimer;

const calculateRemainingTime = (expirationTime) => {
  const currentTime = new Date().getTime();
  const adjExpirationTime = new Date(expirationTime).getTime();
  return adjExpirationTime - currentTime;
};

export const AuthContextProvider = (props) => {
  const API_KEY = process.env.REACT_APP_FIREBASE_API_KEY;

  const storedToken = localStorage.getItem('token');
  const storedExpiration = localStorage.getItem('expirationTime');

  const [token, setToken] = useState(storedToken);

  const logoutHandler = useCallback(() => {
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('expirationTime');
    if (logoutTimer) clearTimeout(logoutTimer);
  }, []);

  const loginHandler = (token, expiresIn) => {
    setToken(token);

    const expirationTime = new Date(
      new Date().getTime() + +expiresIn * 1000
    ).toISOString();

    localStorage.setItem('token', token);
    localStorage.setItem('expirationTime', expirationTime);

    const remainingTime = calculateRemainingTime(expirationTime);

    logoutTimer = setTimeout(logoutHandler, remainingTime);
  };

  //  FIREBASE VALIDATION
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) return;

      try {
        const response = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: token }),
          }
        );

        if (!response.ok) {
          logoutHandler();
        }
      } catch {
        logoutHandler();
      }
    };

    verifyToken();
  }, [token, logoutHandler, API_KEY]);

  // Restore timer on refresh
  useEffect(() => {
    if (storedToken && storedExpiration) {
      const remainingTime = calculateRemainingTime(storedExpiration);

      if (remainingTime <= 0) {
        logoutHandler();
      } else {
        logoutTimer = setTimeout(logoutHandler, remainingTime);
      }
    }
  }, [storedToken, storedExpiration, logoutHandler]);

  const contextValue = {
    token: token,
    isLoggedIn: !!token,
    login: loginHandler,
    logout: logoutHandler,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {props.children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
