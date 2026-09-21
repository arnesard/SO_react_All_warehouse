const TONES = {
  accent: { "--tone": "var(--accent)", "--tone-soft": "var(--accent-soft)" },
  cyan: { "--tone": "var(--cyan)", "--tone-soft": "var(--cyan-soft)" },
  ok: { "--tone": "var(--ok)", "--tone-soft": "var(--ok-soft)" },
  warn: { "--tone": "var(--warn)", "--tone-soft": "var(--warn-soft)" },
  danger: { "--tone": "var(--danger)", "--tone-soft": "var(--danger-soft)" },
};

function StatCard({ icon: Icon, label, value, sub, subDirection, tone = "accent" }) {
  return (
    <div className="stat-card" style={TONES[tone]}>
      <div className="stat-card-top">
        <span className="stat-card-label">{label}</span>
        {Icon && (
          <span className="stat-card-icon">
            <Icon size={15} />
          </span>
        )}
      </div>
      <div className="stat-card-value">{value}</div>
      {sub && <div className={`stat-card-sub ${subDirection || ""}`}>{sub}</div>}
    </div>
  );
}

export default StatCard;
