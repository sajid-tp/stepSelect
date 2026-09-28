import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../features/user/authSlice';

function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  console.log(user)

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navLinkClass = ({ isActive }) =>
    `text-[13px] ${isActive ? 'font-semibold text-ink' : 'text-muted'}`;

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initial = user?.name?.charAt(0).toUpperCase() || 'U';

  const handleLogout = async () => {
    setDropdownOpen(false);
    setMobileOpen(false);
    await dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <header className="border-b border-line w-full">
      <div className="w-full flex h-[72px] items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link to="/" className="text-[15px] font-bold tracking-wide shrink-0">
          STEP SELECT
        </Link>

        {/* Desktop nav */}
        <nav className="hidden gap-8 md:flex">
          <NavLink to="/" end className={navLinkClass}>Home</NavLink>
          <NavLink to="/shop" className={navLinkClass}>Shop</NavLink>
          {user && <NavLink to="/orders" className={navLinkClass}>Orders</NavLink>}
          <NavLink to="/about" className={navLinkClass}>About</NavLink>
          <NavLink to="/contact" className={navLinkClass}>Contact</NavLink>
        </nav>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-[18px]">
          <button className="flex text-ink" aria-label="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {user && (
            <Link to="/wishlist" className="flex text-ink" aria-label="Wishlist">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 21s-7.5-4.6-10-9.1C.5 8.6 2 5 5.5 5c2 0 3.4 1.1 4.5 2.6C11.1 6.1 12.5 5 14.5 5 18 5 19.5 8.6 18 11.9 15.5 16.4 12 21 12 21z" />
              </svg>
            </Link>
          )}

          <Link to="/cart" className="relative flex text-ink" aria-label="Cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
            </svg>
          </Link>

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4511e] text-[13px] font-semibold text-white"
                aria-label="Account menu"
              >
                {initial}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-44 rounded-md border border-line bg-white py-1 shadow-lg z-50">
                  <Link to="/profile" className="block px-4 py-2 text-[13px] text-ink hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>
                    Profile
                  </Link>
                  <Link to="/orders" className="block px-4 py-2 text-[13px] text-ink hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>
                    Orders
                  </Link>
                  <button onClick={handleLogout} className="block w-full px-4 py-2 text-left text-[13px] text-red-600 hover:bg-gray-50">
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="rounded-md border border-ink px-5 py-[9px] text-[13px] font-semibold text-ink">
                Login
              </Link>
              <Link to="/signup" className="rounded-md bg-[#f4511e] px-5 py-[9px] text-[13px] font-semibold text-white">
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex md:hidden text-ink"
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((o) => !o)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            {mobileOpen ? (
              <path d="M18 6 6 18M6 6l12 12" />
            ) : (
              <path d="M3 6h18M3 12h18M3 18h18" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className="md:hidden border-t border-line px-4 py-4 flex flex-col gap-4">
          <NavLink to="/" end className={navLinkClass} onClick={() => setMobileOpen(false)}>Home</NavLink>
          <NavLink to="/shop" className={navLinkClass} onClick={() => setMobileOpen(false)}>Shop</NavLink>
          {user && <NavLink to="/orders" className={navLinkClass} onClick={() => setMobileOpen(false)}>Orders</NavLink>}
          <NavLink to="/about" className={navLinkClass} onClick={() => setMobileOpen(false)}>About</NavLink>
          <NavLink to="/contact" className={navLinkClass} onClick={() => setMobileOpen(false)}>Contact</NavLink>
          {user && <Link to="/wishlist" className={navLinkClass} onClick={() => setMobileOpen(false)}>Wishlist</Link>}
          <Link to="/cart" className={navLinkClass} onClick={() => setMobileOpen(false)}>Cart</Link>

          {user ? (
            <>
              <Link to="/profile" className={navLinkClass} onClick={() => setMobileOpen(false)}>Profile</Link>
              <button onClick={handleLogout} className="text-left text-[13px] text-red-600">
                Logout
              </button>
            </>
          ) : (
            <div className="flex gap-3 pt-2">
              <Link
                to="/login"
                className="flex-1 text-center rounded-md border border-ink px-5 py-[9px] text-[13px] font-semibold text-ink"
                onClick={() => setMobileOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="flex-1 text-center rounded-md bg-[#f4511e] px-5 py-[9px] text-[13px] font-semibold text-white"
                onClick={() => setMobileOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default Navbar;