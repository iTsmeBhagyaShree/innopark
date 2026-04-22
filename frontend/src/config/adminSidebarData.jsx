import {
  IoHome,
  IoBriefcase,
  IoCheckboxOutline,
  IoBarChart,
  IoChatbubbles,
  IoShieldCheckmark,
  IoSettings,
  IoLayers,
  IoList,
  IoPeople,
  IoTrendingUp,
  IoDocumentText,
  IoReceipt,
  IoBusiness
} from 'react-icons/io5'

/**
 * Simplified Admin Sidebar
 * Focus on Lead Management Oversight
 */

const adminSidebarData = [
  {
    label: 'sidebar.dashboard',
    icon: IoHome,
    path: '/app/admin/dashboard',
    section: null,
  },

  {
    label: 'sidebar.crm',
    icon: IoBriefcase,
    path: '/app/admin/crm',
    section: 'sidebar.teamOperations',
    children: [
      { label: 'sidebar.leads', icon: IoPeople, path: '/app/admin/leads' },
      { label: 'sidebar.deals', icon: IoTrendingUp, path: '/app/admin/deals' },
      { label: 'sidebar.contacts', icon: IoChatbubbles, path: '/app/admin/contacts' },
      { label: 'sidebar.companies', icon: IoBusiness, path: '/app/admin/companies' },
      { label: 'sidebar.offers', icon: IoDocumentText, path: '/app/admin/offers' },
      { label: 'sidebar.invoices', icon: IoReceipt, path: '/app/admin/invoices' },
    ]
  },

  {
    label: 'sidebar.projects',
    icon: IoLayers,
    path: '/app/admin/projects',
    section: 'sidebar.teamOperations',
  },

  {
    label: 'sidebar.tasks',
    icon: IoCheckboxOutline,
    path: '/app/admin/tasks',
    section: 'sidebar.teamOperations',
  },

  {
    label: 'sidebar.reports',
    icon: IoBarChart,
    path: '/app/admin/reports',
    section: 'sidebar.toolsUtilities',
  },

  {
    label: 'sidebar.employees',
    icon: IoShieldCheckmark,
    path: '/app/admin/employees',
    section: 'sidebar.teamOperations',
  },

  {
    label: 'sidebar.messages',
    icon: IoChatbubbles,
    path: '/app/admin/messages',
    section: 'sidebar.communication',
    moduleKey: 'messages',
  },

  {
    label: 'sidebar.settings',
    icon: IoSettings,
    path: '/app/admin/settings',
    section: 'sidebar.toolsUtilities',
    children: [
      { label: 'sidebar.general_settings', icon: IoSettings, path: '/app/admin/settings' },
      { label: 'sidebar.pipeline_settings', icon: IoLayers, path: '/app/admin/settings/pipelines' },
      { label: 'sidebar.custom_fields', icon: IoList, path: '/app/admin/custom-fields' },
    ]
  },
]

export default adminSidebarData
