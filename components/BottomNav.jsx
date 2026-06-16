const NAV_ITEMS = [
  { id: 'home',     label: 'Home',     icon: '⌂' },
  { id: 'talk',     label: 'Talk',     icon: '🎤' },
  { id: 'insights', label: 'Insights', icon: '◈' },
  { id: 'leverage', label: 'Leverage', icon: '🚀' },
];

export default function BottomNav({ active, onNav }) {
  return (
    <nav className="bnav" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => (
        <div
          key={item.id}
          className={`ni${active === item.id ? ' on' : ''}`}
          onClick={() => onNav(item.id)}
          role="button"
          tabIndex={0}
          aria-label={item.label}
          onKeyDown={(e) => e.key === 'Enter' && onNav(item.id)}
        >
          <span style={{ fontSize: 22 }}>{item.icon}</span>
          <span className="ni-lb">{item.label}</span>
        </div>
      ))}
    </nav>
  );
}
