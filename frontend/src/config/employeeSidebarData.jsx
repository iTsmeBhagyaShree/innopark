import {
  IoHome,
  IoCheckboxOutline,
  IoChatbubbles,
  IoBriefcase,
  IoFolderOpen,
  IoPeople,
  IoTrendingUp,
  IoDocumentText,
  IoReceipt,
  IoBusiness
} from 'react-icons/io5'

const employeeSidebarData = [
  {
    label: 'sidebar.dashboard',
    icon: IoHome,
    path: '/app/employee/dashboard',
    section: null,
    moduleKey: 'dashboard',
  },
  {
    label: 'sidebar.crm',
    icon: IoBriefcase,
    path: '/app/employee/crm',
    section: 'sidebar.crmSales',
    moduleKey: 'leads',
    children: [
      { label: 'sidebar.leads', icon: IoPeople, path: '/app/employee/leads', moduleKey: 'leads' },
      { label: 'sidebar.deals', icon: IoTrendingUp, path: '/app/employee/deals', moduleKey: 'deals' },
      { label: 'sidebar.contacts', icon: IoChatbubbles, path: '/app/employee/contacts', moduleKey: 'contacts' },
      { label: 'sidebar.companies', icon: IoBusiness, path: '/app/employee/companies', moduleKey: 'companies' },
      { label: 'sidebar.offers', icon: IoDocumentText, path: '/app/employee/offers', moduleKey: 'offers' },
      { label: 'sidebar.invoices', icon: IoReceipt, path: '/app/employee/invoices', moduleKey: 'invoices' },
    ]
  },
  {
    label: 'sidebar.projects',
    icon: IoFolderOpen,
    path: '/app/employee/my-projects',
    section: 'sidebar.teamOperations',
    moduleKey: 'projects',
  },
  {
    label: 'sidebar.tasks',
    icon: IoCheckboxOutline,
    path: '/app/employee/my-tasks',
    section: 'sidebar.teamOperations',
    moduleKey: 'tasks',
  },
  {
    label: 'sidebar.messages',
    icon: IoChatbubbles,
    path: '/app/employee/messages',
    section: 'sidebar.communication',
    moduleKey: 'messages',
  },
]

export default employeeSidebarData
