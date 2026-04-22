import { Link, useLocation, useNavigate } from "react-router-dom";

const WebsiteFooter = () => {
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
  };

  // Scroll to top when any navigation link is clicked
  const handleNavClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative z-10 bg-slate-950/95 backdrop-blur-lg text-white py-12 sm:py-16 md:py-20 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 md:gap-12">
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <h3 className="text-xl sm:text-2xl font-black tracking-tighter">
              Developo
            </h3>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
              Empowering modern businesses with intelligent workflows and
              seamless collaboration.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-base sm:text-lg mb-4 sm:mb-6 text-white">
              Product
            </h4>
            <ul className="space-y-3 sm:space-y-4 text-gray-400 text-sm sm:text-base">
              <li>
                <a
                  href="/"
                  onClick={handleFeaturesClick}
                  className="hover:text-primary-accent transition-colors cursor-pointer inline-block"
                >
                  Features
                </a>
              </li>
              <li>
                <Link
                  to="/pricing"
                  onClick={handleNavClick}
                  className="hover:text-primary-accent transition-colors inline-block"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-base sm:text-lg mb-4 sm:mb-6 text-white">
              Company
            </h4>
            <ul className="space-y-3 sm:space-y-4 text-gray-400 text-sm sm:text-base">
              <li>
                <Link
                  to="/contact"
                  onClick={handleNavClick}
                  className="hover:text-primary-accent transition-colors inline-block"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  onClick={handleNavClick}
                  className="hover:text-primary-accent transition-colors inline-block"
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-base sm:text-lg mb-4 sm:mb-6 text-white">
              Legal
            </h4>
            <ul className="space-y-3 sm:space-y-4 text-gray-400 text-sm sm:text-base">
              <li>
                <Link
                  to="/privacy-policy"
                  onClick={handleNavClick}
                  className="hover:text-primary-accent transition-colors inline-block"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  onClick={handleNavClick}
                  className="hover:text-primary-accent transition-colors inline-block"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-xs sm:text-sm">
          <p className="text-center md:text-left">
            &copy; 2024 Developo. Crafted for excellence.
          </p>
          <div className="flex gap-4 sm:gap-6">
            <span className="hover:text-white cursor-pointer transition-colors">
              Twitter
            </span>
            <span className="hover:text-white cursor-pointer transition-colors">
              LinkedIn
            </span>
            <span className="hover:text-white cursor-pointer transition-colors">
              GitHub
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default WebsiteFooter;
