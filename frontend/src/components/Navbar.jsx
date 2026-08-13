import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();

  return (
    <nav className="bg-surface border-b border-border shadow-card font-sans">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          {/* App name/logo left-aligned */}
          <Link to="/" className="text-2xl font-extrabold tracking-widest text-primary select-none uppercase">
          Early Warning Systems-DDoS
              </Link>
          {/* Prevention link right-aligned */}
          <div className="flex items-center gap-2">
            <Link
              to="/prevention"
              className={`relative px-5 py-2 text-base font-semibold tracking-widest uppercase rounded-none transition-colors duration-200
                ${location.pathname === '/prevention' ? 'text-primary border-b-2 border-primary' : 'text-textSecondary hover:text-primary'}`}
            >
              Prevention
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 