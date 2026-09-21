import { NavLink } from "react-router-dom";

/**
 * items: [{ to, label, icon }]
 */
function TabStrip({ items }) {
  return (
    <div className="tab-strip">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `tab-btn${isActive ? " is-active" : ""}`}
        >
          {item.icon && <item.icon size={13} />}
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}

export default TabStrip;
