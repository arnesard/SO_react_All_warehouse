import Swal from "sweetalert2";

export const swal = Swal.mixin({
  background: "var(--surface)",
  color: "var(--text-primary)",
  buttonsStyling: false,
  customClass: {
    popup: "swal-theme-popup",
    confirmButton: "btn-ctrl primary",
    cancelButton: "btn-ctrl",
  },
});
