function StatusBadge({ tone = "neutral", children }) {
  return <span className={`badge-pill ${tone}`}>{children}</span>;
}

export default StatusBadge;
