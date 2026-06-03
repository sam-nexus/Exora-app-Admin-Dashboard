export const getToken = () => localStorage.getItem('token');
export const getUserRole = () => localStorage.getItem('role');
export const getUserId = () => localStorage.getItem('userId');
export const getUserEmail = () => localStorage.getItem('email');
export const getUserFullName = () => localStorage.getItem('fullName');

export const setSession = ({ token, role, userId, email, fullName }) => {
  localStorage.setItem('token', token);
  localStorage.setItem('role', role);
  localStorage.setItem('userId', userId);
  localStorage.setItem('email', email);
  localStorage.setItem('fullName', fullName);
};

export const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('userId');
  localStorage.removeItem('email');
  localStorage.removeItem('fullName');
};
