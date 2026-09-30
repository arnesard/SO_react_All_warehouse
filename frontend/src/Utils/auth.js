export const getUserSession = () => {
  const data = localStorage.getItem("auth_user");
  try {
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const setUserSession = (user) => {
  localStorage.setItem("auth_user", JSON.stringify(user));
};

export const clearUserSession = () => {
  localStorage.removeItem("auth_user");
};
