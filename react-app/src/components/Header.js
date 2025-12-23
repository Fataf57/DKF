import React, { useState, useEffect, useRef } from 'react';
import './Header.css';

function Header({ user, onLogout }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button className="menu-toggle">☰</button>
        <div className="header-search">
          <input type="text" placeholder="Rechercher..." className="search-input" />
        </div>
      </div>
      <div className="header-right">
        <button className="header-icon-btn">🔔</button>
        <div className="user-menu" ref={menuRef}>
          <button 
            className="user-profile-btn"
            onClick={() => setShowMenu(!showMenu)}
          >
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <span className="user-name">{user?.username}</span>
            <span className="dropdown-arrow">▼</span>
          </button>
          {showMenu && (
            <div className="user-dropdown">
              <button className="dropdown-item">Mon profil</button>
              <button className="dropdown-item">Hors stocks</button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item" onClick={onLogout}>
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;

