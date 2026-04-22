import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import Button from "../../components/ui/Button";
import { FaBars, FaTimes } from "react-icons/fa";

const WebsiteHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleFeaturesClick = (e) => {
    e.preventDefault();

    // If we're not on the home page, navigate to it first
    if (location.pathname !== "/") {
      navigate("/");
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        const featuresSection = document.getElementById("Features");
        if (featuresSection) {
          featuresSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    } else {
      // If we're already on home page, just scroll
      const featuresSection = document.getElementById("Features");
      if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    setMobileMenuOpen(false);
  };

  // Scroll to top when any navigation link is clicked
  const handleNavClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  const navItems = [
    { name: "Home", path: "/", onClick: handleNavClick },
    { name: "Features", path: "/", onClick: handleFeaturesClick },
    { name: "Pricing", path: "/pricing", onClick: handleNavClick },
    { name: "Contact", path: "/contact", onClick: handleNavClick },
    { name: "About Us", path: "/about", onClick: handleNavClick },
  ];

  return (
    <header className="bg-slate-900/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            onClick={handleNavClick}
            className="text-xl sm:text-2xl font-black text-white tracking-tighter flex items-center gap-2"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-accent rounded-lg flex items-center justify-center text-white text-xs sm:text-sm shadow-[0_0_15px_rgba(33,126,69,0.5)]">
              D
            </div>
            <span className="hidden xs:inline">Developo</span>
            <span className="xs:hidden">Developo</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navItems.map((item) =>
              item.name === "Features" ? (
                <a
                  key={item.name}
                  href={item.path}
                  onClick={item.onClick}
                  className="text-white font-semibold hover:text-white transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(33,126,69,1)] relative group cursor-pointer text-sm lg:text-base"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-accent transition-all duration-300 group-hover:w-full shadow-[0_0_10px_rgba(33,126,69,1)]" />
                </a>
              ) : (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={item.onClick}
                  className="text-white font-semibold hover:text-white transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(33,126,69,1)] relative group text-sm lg:text-base"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-accent transition-all duration-300 group-hover:w-full shadow-[0_0_10px_rgba(33,126,69,1)]" />
                </Link>
              )
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            <Link to="/login">
              <Button
                variant="ghost"
                size="sm"
                className="font-bold text-white hover:text-primary-accent hover:bg-white/10 transition-all duration-300 text-sm lg:text-base px-3 lg:px-4"
              >
                Login
              </Button>
            </Link>
            <Link to="/login">
              <Button
                variant="primary"
                size="sm"
                className="shadow-lg rounded-xl text-sm lg:text-base px-4 lg:px-6"
              >
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4 animate-fadeIn">
            <nav className="flex flex-col gap-4">
              {navItems.map((item) =>
                item.name === "Features" ? (
                  <a
                    key={item.name}
                    href={item.path}
                    onClick={item.onClick}
                    className="text-white font-semibold hover:text-primary-accent transition-all duration-300 py-2 px-4 hover:bg-white/5 rounded-lg cursor-pointer"
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={item.onClick}
                    className="text-white font-semibold hover:text-primary-accent transition-all duration-300 py-2 px-4 hover:bg-white/5 rounded-lg"
                  >
                    {item.name}
                  </Link>
                )
              )}
              <div className="flex flex-col gap-3 mt-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full font-bold text-white hover:text-primary-accent hover:bg-white/10 transition-all duration-300"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full shadow-lg rounded-xl"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default WebsiteHeader;
