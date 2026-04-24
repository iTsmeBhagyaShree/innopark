import {
  IoHome,
  IoBusiness,
  IoPeople,
  IoStatsChart,
  IoSettings,
  IoShieldCheckmark,
  IoServer,
  IoDocumentText,
  IoBarChart,
  IoCube,
  IoReceipt,
  IoHelpCircle,
  IoBriefcase,
  IoTicket,
  IoGlobe,
  IoPhonePortrait,
  IoRefresh
} from 'react-icons/io5'

const superAdminSidebarData = [
  {
    label: 'sidebar.dashboard',
    icon: IoHome,
    path: '/app/superadmin/dashboard',
    section: null,
  },
  {
    label: 'sidebar.packages',
    icon: IoCube,
    path: '/app/superadmin/packages',
    section: 'sidebar.billing',
  },
  {
    label: 'sidebar.companies',
    icon: IoBusiness,
    path: '/app/superadmin/companies',
    section: 'sidebar.teamOperations',
  },
  {
    label: 'sidebar.billing',
    icon: IoReceipt,
    path: '/app/superadmin/billing',
    section: 'sidebar.billing',
  },
  {
    label: 'sidebar.users',
    icon: IoShieldCheckmark,
    path: '/app/superadmin/users',
    section: 'sidebar.teamOperations',
  },
  {
    label: 'sidebar.offlineRequests',
    icon: IoBriefcase,
    path: '/app/superadmin/offline-requests',
    section: 'sidebar.teamOperations',
  },
  {
    label: 'sidebar.settings',
    icon: IoSettings,
    path: '/app/superadmin/settings',
    section: 'sidebar.toolsUtilities',
  },
  {
    label: 'sidebar.pwaSettings',
    icon: IoPhonePortrait,
    path: '/app/superadmin/pwa-settings',
    section: 'sidebar.toolsUtilities',
  },
  {
    label: 'sidebar.updates',
    icon: IoRefresh,
    path: '/app/superadmin/updates',
    section: 'sidebar.toolsUtilities',
  },
]

export default superAdminSidebarData

