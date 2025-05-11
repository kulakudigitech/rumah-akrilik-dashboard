import api from '../utils/api';

export const login = (data) => api.post('auth/login/', data);
export const logout = () => api.post('auth/logout/');
