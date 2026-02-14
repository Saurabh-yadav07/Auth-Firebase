import { createContext, useState, useEffect } from 'react';

const AuthContext = createContext({
  token: '',
  isLoggedIn: false,
  login: (token) => {},
  logout: () => {},
});

const SESSION_DURATION = 5 * 60 * 1000; 

export const AuthContextProvider = (props) => {
  const storedToken = localStorage.getItem('token');
  const storedExpiration = localStorage.getItem('expirationTime');

  let initialToken = null;

  // Checking if stored token is expired
  if (storedToken && storedExpiration) {
    const remainingTime =
      new Date(storedExpiration).getTime() - new Date().getTime();

    if (remainingTime > 0) {
      initialToken = storedToken;
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('expirationTime');
    }
  }

  const [token, setToken] = useState(initialToken);

  const loginHandler = (token) => {
    setToken(token);

    const expirationTime = new Date(
      new Date().getTime() + SESSION_DURATION
    ).toISOString();

    localStorage.setItem('token', token);
    localStorage.setItem('expirationTime', expirationTime);
  };

  const logoutHandler = () => {
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('expirationTime');
  };

  useEffect(() => {
    if (token && storedExpiration) {
      const remainingTime =
        new Date(storedExpiration).getTime() - new Date().getTime();

      if (remainingTime <= 0) {
        logoutHandler();
      } else {
        const timer = setTimeout(logoutHandler, remainingTime);
        return () => clearTimeout(timer);
      }
    }
  }, [token, storedExpiration]);

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
