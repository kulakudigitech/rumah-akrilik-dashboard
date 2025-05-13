import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch user information when component mounts
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
          setLoading(false);
          return;
        }

        // Decode token to get user role
        const role = localStorage.getItem('role') || '';
        const username = localStorage.getItem('username') || '';
        let userRoles = [];

        try {
          const userRolesStr = localStorage.getItem('userRoles');
          if (userRolesStr) {
            userRoles = JSON.parse(userRolesStr);
            if (!Array.isArray(userRoles)) {
              userRoles = [userRoles];
            }
          } else if (role) {
            userRoles = [role];
          }
        } catch (e) {
          console.error('Error parsing user roles:', e);
          if (role) userRoles = [role];
        }

        setUser({
          username,
          role: role.toLowerCase(),
          roles: userRoles.map(r => typeof r === 'string' ? r.toLowerCase() : 
                 (r && r.name ? r.name.toLowerCase() : 'unknown')),
          token
        });
        
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const login = async (username, password) => {
    try {
      setLoading(true);
      const response = await axios.post('https://rumahakrilik.id/api/auth/login/', {
        username,
        password
      });

      const { token, role, roles } = response.data;
      
      localStorage.setItem('jwtToken', token);
      localStorage.setItem('username', username);
      localStorage.setItem('role', role || '');
      localStorage.setItem('userRoles', JSON.stringify(roles || []));
      
      setUser({
        username,
        role: (role || '').toLowerCase(),
        roles: (roles || []).map(r => typeof r === 'string' ? r.toLowerCase() : 
               (r && r.name ? r.name.toLowerCase() : 'unknown')),
        token
      });
      
      return response.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('userRoles');
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};