// Logomark kustom: penampang ban (tire) dengan garis scan —
// merepresentasikan validasi Oracle vs Barcode vs Fisik.
function BrandMark({ size = 34 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="18" fill="var(--surface-3)" stroke="var(--accent-border)" />
      <circle cx="20" cy="20" r="18" stroke="var(--accent)" strokeOpacity="0.5" />
      <circle cx="20" cy="20" r="12.5" stroke="var(--accent)" strokeWidth="2" />
      <circle cx="20" cy="20" r="12.5" stroke="var(--border)" strokeWidth="6" strokeDasharray="1.4 3.4" />
      <circle cx="20" cy="20" r="4.2" fill="var(--cyan)" />
      <line x1="4" y1="20" x2="36" y2="20" stroke="var(--cyan)" strokeWidth="1.4" strokeOpacity="0.55" />
    </svg>
  );
}

export default BrandMark;
