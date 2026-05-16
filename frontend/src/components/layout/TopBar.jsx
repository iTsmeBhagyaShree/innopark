import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useSettings } from "../../context/SettingsContext";
import { useNavigate } from "react-router-dom";
import {
  IoMenu,
  IoSearch,
  IoTime,
  IoNotifications,
  IoChevronDown,
  IoLogOut,
  IoChatbubblesOutline,
  IoPerson,
} from "react-icons/io5";
import innoparkLogo from "../../assets/innopark.jpeg";
import { useLanguage } from "../../context/LanguageContext";
import NotificationDropdown from "./NotificationDropdown";
import LanguageDropdown from "./LanguageDropdown";
import { notificationsAPI } from "../../api";
import GlobalSearch from "./GlobalSearch";

const TopBar = ({ onMenuClick, isSidebarCollapsed, onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { getCompanyInfo, getCompanyLogoUrl, settings, logoVersion } = useSettings();
  const { t, language } = useLanguage();
  const isDark = theme.mode === "dark";
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [showLanguage, setShowLanguage] = useState(false);

  const profileMenuRef = useRef(null);

  // Synchronize logo and company info with settings
  const companyInfo = getCompanyInfo();
  const rawLogoUrl = getCompanyLogoUrl();
  const hasCustomLogo = rawLogoUrl && 
    !rawLogoUrl.includes('undefined') && 
    !rawLogoUrl.includes('null');
    
  // Use settings logo if available, otherwise default to innopark.jpeg
  const companyLogoUrl = hasCustomLogo ? rawLogoUrl : innoparkLogo;
  const systemName = settings?.system_name || companyInfo?.name || 'Innopark';
  
  // Consume logoVersion to trigger re-renders on update
  useEffect(() => {
    // This effect ensures we sync with any changes to the logoVersion
  }, [logoVersion, companyLogoUrl]);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadMessages();
    const notificationInterval = setInterval(fetchNotifications, 60000); 
    const messagesInterval = setInterval(fetchUnreadMessages, 30000);
    return () => {
      clearInterval(notificationInterval);
      clearInterval(messagesInterval);
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const companyId = parseInt(localStorage.getItem("companyId") || 1);
      const response = await notificationsAPI.getAll({
        company_id: companyId,
        limit: 10,
      });
      if (response.data.success) {
        setNotifications(response.data.data);
        const unread = (response.data.data || []).filter((n) => !n.read_at).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const fetchUnreadMessages = async () => {
    if (!user) return;
    try {
      const { messagesAPI } = await import("../../api");
      const companyId = parseInt(localStorage.getItem("companyId") || 1);
      const userId = parseInt(localStorage.getItem("userId") || user.id);
      const response = await messagesAPI.getAll({
        user_id: userId,
        company_id: companyId,
      });
      if (response.data.success) {
        const totalUnread = (response.data.data || []).reduce(
          (sum, conv) => sum + (conv.unread_count || 0),
          0
        );
        setUnreadMessagesCount(totalUnread);
      }
    } catch (error) {
      console.error("Error fetching unread messages:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    navigate("/login", { replace: true });
  };

  const navigateToDashboard = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    const role = user.role?.toLowerCase() || 'admin';
    navigate(`/app/${role}/dashboard`);
  };

  const navigateToMessages = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    const role = user.role?.toLowerCase() || 'admin';
    navigate(`/app/${role}/messages`);
  };

  const getProfilePath = () => {
    if (!user) return "/app/superadmin/settings";
    switch (user.role) {
      case "SUPERADMIN":
        return "/app/superadmin/settings";
      case "ADMIN":
        return "/app/admin/settings";
      case "EMPLOYEE":
        return "/app/employee/my-profile";

      default:
        return "/app/superadmin/settings";
    }
  };

  const getRoleDisplayName = () => {
    if (!user) return t('auth.roles.user') || "USER";
    switch (user.role) {
      case "SUPERADMIN":
        return t('auth.roles.superadmin');
      case "ADMIN":
        return t('auth.roles.admin');
      case "EMPLOYEE":
        return t('auth.roles.employee');

      default:
        return user.role || t('auth.roles.user') || "USER";
    }
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 flex h-14 w-full items-center overflow-visible border-b shadow-sm"
        style={{
          zIndex: 1000,
          backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
          borderColor: isDark ? "#404040" : "#e5e7eb",
        }}
      >
        <div className="flex h-full w-full items-center justify-between gap-1 overflow-visible px-2 py-2 sm:gap-3 sm:px-3 lg:px-4">
          {/* LEFT SIDE */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
            {/* Logo - Dynamic from Settings */}
            <div
              className="flex items-center gap-1 sm:gap-3 cursor-pointer flex-shrink-0 group"
              onClick={navigateToDashboard}
            >
              <img
                src={companyLogoUrl}
                alt={systemName}
                className="h-7 sm:h-9 lg:h-10 w-auto max-w-[100px] sm:max-w-[160px] object-contain flex-shrink-0"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = innoparkLogo;
                }}
              />
            </div>

            {/* Sidebar Toggle */}
            <button
              id="sidebar-toggle"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.innerWidth < 1024) {
                  onMenuClick();
                } else {
                  onToggleSidebar();
                }
              }}
              className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 text-secondary-text hover:text-primary-text hover:bg-sidebar-hover rounded-xl transition-all duration-200 flex-shrink-0"
            >
              <IoMenu
                size={22}
                className={`transition-transform duration-200 ${isSidebarCollapsed ? "rotate-180" : ""
                  }`}
              />
            </button>
          </div>

          {/* CENTER - Desktop global search (always visible from md+) */}
          <div className="hidden min-w-0 flex-1 justify-center overflow-visible px-2 md:flex lg:px-4">
            <GlobalSearch
              mode="inline"
              isOpen
              dismissOnClickOutside={false}
              onClose={() => {}}
            />
          </div>

          {/* RIGHT SIDE */}
          <div className="flex flex-shrink-0 items-center gap-0.5 sm:gap-1.5 lg:gap-2">
            {/* Mobile: icon opens full-screen search */}
            <div className="relative md:hidden">
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                className="flex-shrink-0 rounded-lg p-1.5 text-secondary-text transition-all duration-200 hover:bg-sidebar-hover hover:text-primary-text lg:p-2"
                title={t('common.search')}
              >
                <IoSearch size={18} />
              </button>
            </div>

            {/* Clock Icon - Time Tracker */}
            <button
              type="button"
              onClick={() => {
                if (!user) return;
                const role = user.role?.toLowerCase() || 'admin';
                navigate(`/app/${role}/time-tracking`);
              }}
              className="hidden sm:flex items-center justify-center p-1.5 lg:p-2 text-secondary-text hover:text-primary-text hover:bg-sidebar-hover rounded-lg transition-all duration-200 flex-shrink-0"
              title={t('common.time_tracker')}
            >
              <IoTime size={18} />
            </button>

            {/* Notification Bell */}
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 lg:p-2 text-secondary-text hover:text-primary-text hover:bg-sidebar-hover rounded-lg transition-all duration-200 relative"
              >
                <IoNotifications size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-soft animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <NotificationDropdown
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                notifications={notifications}
              />
            </div>

            {/* Chat Icon - Hidden for SuperAdmin */}
            {user?.role !== "SUPERADMIN" && (
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={navigateToMessages}
                  className="p-1.5 lg:p-2 text-secondary-text hover:text-primary-text hover:bg-sidebar-hover rounded-lg transition-all duration-200"
                  title={t('sidebar.messages')}
                >
                  <IoChatbubblesOutline size={18} />
                </button>
              </div>
            )}

            {/* Language Switcher */}
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowLanguage(!showLanguage)}
                className="p-1.5 lg:p-2 text-secondary-text hover:text-primary-text hover:bg-sidebar-hover rounded-lg transition-all duration-200 flex items-center gap-1"
                title={t('common.change_language')}
              >
                <span className="text-sm font-bold uppercase">{language}</span>
                <IoChevronDown size={14} className={`transition-transform duration-200 ${showLanguage ? 'rotate-180' : ''}`} />
              </button>
              <LanguageDropdown
                isOpen={showLanguage}
                onClose={() => setShowLanguage(false)}
              />
            </div>

            {/* User Profile */}
            <div className="relative flex-shrink-0 ml-0.5" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-1.5 px-0.5 lg:px-1.5 py-1 text-primary-text hover:bg-sidebar-hover rounded-lg transition-all duration-200"
              >
                <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-gradient-to-br from-primary-accent to-info flex items-center justify-center flex-shrink-0 shadow-card">
                  <span className="text-white text-[10px] lg:text-xs font-semibold">
                    {user?.role === "SUPERADMIN"
                      ? "SA"
                      : user?.role === "ADMIN"
                        ? "AD"
                        : user?.role === "EMPLOYEE"
                          ? "EM"
                          : user?.name
                            ? user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                            : "U"}
                  </span>
                </div>
                <span className="hidden md:block text-sm font-medium text-primary-text max-w-[100px] lg:max-w-[140px] truncate">
                  {getRoleDisplayName()}
                </span>
                <IoChevronDown
                  size={16}
                  className="hidden md:block text-secondary-text"
                />
              </button>

              {showProfileMenu && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-elevated border border-gray-200 overflow-hidden animate-fadeIn"
                  style={{
                    position: "fixed",
                    top: "3.75rem",
                    right: "0.75rem",
                    zIndex: 10000,
                  }}
                >
                  <div className="p-3 border-b border-border-light bg-gradient-to-r from-primary-accent/5 to-info/5">
                    <p className="text-sm font-semibold text-primary-text truncate">
                      {user?.name || t('users')}
                    </p>
                    <p className="text-xs text-secondary-text truncate mt-0.5">
                      {user?.email || ""}
                    </p>
                    <p className="text-xs font-semibold text-primary-accent mt-0.5">
                      {getRoleDisplayName()}
                    </p>
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        navigate(getProfilePath());
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary-text hover:bg-sidebar-hover rounded-lg transition-all duration-200"
                    >
                      <IoPerson size={16} />
                      {t('common.profile')}
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    >
                      <IoLogOut size={16} />
                      {t('logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global Search Overlay (Mobile Only) */}
        <div className="md:hidden">
          <GlobalSearch
            isOpen={showSearch}
            onClose={() => setShowSearch(false)}
            mode="modal"
          />
        </div>
      </header>
    </>
  );
};

export default TopBar;
