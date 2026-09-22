import Swal from "sweetalert2";

export const swal = Swal.mixin({
  background: "var(--surface-2)",
  color: "var(--text-primary)",
  buttonsStyling: false,
  customClass: {
    popup: "swal-theme-popup",
    confirmButton: "btn-ctrl primary",
    cancelButton: "btn-ctrl",
  },
});
