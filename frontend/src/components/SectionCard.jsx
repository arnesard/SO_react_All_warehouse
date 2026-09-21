function SectionCard({ icon: Icon, title, actions, children, bodyStyle }) {
  return (
    <div className="surface-card">
      {(title || actions) && (
        <div className="surface-card-header">
          <div className="surface-card-title">
            {Icon && <Icon size={15} />}
            {title}
          </div>
          {actions && <div className="page-actions">{actions}</div>}
        </div>
      )}
      <div className="surface-card-body" style={bodyStyle}>
        {children}
      </div>
    </div>
  );
}

export default SectionCard;
