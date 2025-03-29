import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Navigation = () => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  // Function to generate avatar placeholder with user's initials
  const getUserInitials = () => {
    if (!currentUser || !currentUser.displayName) return '?';
    return currentUser.displayName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  return (
    <nav className="bg-dark-light py-4 px-4 sm:px-6 sticky top-0 z-50 shadow-md border-b border-dark-lighter">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center z-20">
          <span className="text-xl sm:text-2xl font-gaming font-bold gradient-text">GamesHub</span>
        </Link>
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden z-20 p-2 text-gray-300 hover:text-primary focus:outline-none" 
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-4 items-center">
          <Link to="/" className={location.pathname === "/" ? "nav-link-active" : "nav-link"}>
            Home
          </Link>
          <Link to="/games" className={location.pathname.includes("/games") ? "nav-link-active" : "nav-link"}>
            Games
          </Link>
          <Link to="/leaderboard" className={location.pathname === "/leaderboard" ? "nav-link-active" : "nav-link"}>
            Leaderboard
          </Link>
          <Link to="/profile" className={location.pathname === "/profile" ? "nav-link-active" : "nav-link"}>
            Profile
          </Link>
        </div>
        
        {/* Desktop Auth buttons */}
        <div className="hidden md:flex space-x-4 items-center">
          {currentUser ? (
            <div className="flex items-center space-x-3">
              <Link to="/profile" className="flex items-center group">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold group-hover:bg-primary-dark transition-all">
                  {getUserInitials()}
                </div>
                <span className="ml-2 text-gray-300 group-hover:text-white">
                  {currentUser.displayName}
                </span>
              </Link>
              <button 
                onClick={handleLogout}
                className="btn-secondary text-sm px-3 py-1"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">
                Login
              </Link>
              <Link to="/register" className="btn-primary">
                Sign Up
              </Link>
            </>
          )}
        </div>
        
        {/* Mobile menu overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/80 z-10 md:hidden"
              onClick={toggleMobileMenu}
            />
          )}
        </AnimatePresence>
        
        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 right-0 h-full w-3/4 bg-dark-light z-10 shadow-xl md:hidden flex flex-col"
            >
              <div className="px-6 py-6 border-b border-dark-lighter flex flex-col space-y-4">
                {currentUser ? (
                  <div className="flex flex-col items-center space-y-3">
                    <Link to="/profile" className="flex items-center group">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white text-lg font-bold group-hover:bg-primary-dark transition-all">
                        {getUserInitials()}
                      </div>
                      <span className="ml-2 text-gray-300 group-hover:text-white">
                        {currentUser.displayName}
                      </span>
                    </Link>
                    <button 
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="btn-secondary w-full text-center"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-3 w-full">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn-secondary w-full text-center">
                      Login
                    </Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn-primary w-full text-center">
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col py-6">
                <Link 
                  to="/" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-6 py-4 ${location.pathname === "/" ? "text-primary border-r-4 border-primary bg-dark-lighter/30" : "text-gray-300"}`}
                >
                  Home
                </Link>
                <Link 
                  to="/games" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-6 py-4 ${location.pathname.includes("/games") ? "text-primary border-r-4 border-primary bg-dark-lighter/30" : "text-gray-300"}`}
                >
                  Games
                </Link>
                <Link 
                  to="/leaderboard" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-6 py-4 ${location.pathname === "/leaderboard" ? "text-primary border-r-4 border-primary bg-dark-lighter/30" : "text-gray-300"}`}
                >
                  Leaderboard
                </Link>
                <Link 
                  to="/profile" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-6 py-4 ${location.pathname === "/profile" ? "text-primary border-r-4 border-primary bg-dark-lighter/30" : "text-gray-300"}`}
                >
                  Profile
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navigation; 