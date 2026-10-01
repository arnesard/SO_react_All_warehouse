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

// ===== Akses Gudang =====
// Daftar gudang yang dikenal sistem (dipakai dropdown super user)
export const WAREHOUSE_LIST = ["APW", "BPW", "DPW", "RPW", "JMW"];

export const isSuperUser = (user = getUserSession()) =>
  user?.role === "super_user";

// Gudang yang dikunci untuk akun biasa. Super user / belum login -> "" (bebas pilih)
export const getLockedWarehouse = () => {
  const user = getUserSession();
  if (!user || isSuperUser(user)) return "";
  return String(user.warehouse || "").trim().toUpperCase();
};
