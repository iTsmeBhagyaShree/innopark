import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Layouts
import WebsiteLayout from '../layouts/WebsiteLayout'
import AuthLayout from '../layouts/AuthLayout'
import AppLayout from '../layouts/AppLayout'
import CRMLayout from '../layouts/CRMLayout'

// Website Pages
import HomePage from '../website/pages/HomePage'
import PricingPage from '../website/pages/PricingPage'
import ContactPage from '../website/pages/ContactPage'
import AboutPage from '../website/pages/AboutPage'
import PrivacyPolicyPage from '../website/pages/PrivacyPolicyPage'
import TermsPage from '../website/pages/TermsPage'
import RefundPolicyPage from '../website/pages/RefundPolicyPage'

// Auth Pages
import LoginPage from '../auth/pages/LoginPage'
import ForgotPasswordPage from '../auth/pages/ForgotPasswordPage'
import ResetPasswordPage from '../auth/pages/ResetPasswordPage'

// Admin Pages
import AdminDashboard from '../app/admin/pages/AdminDashboard'
import Leads from '../app/admin/pages/Leads'
import LeadDetail from '../app/admin/pages/LeadDetailNew'
import Deals from '../app/admin/pages/Deals'
import DealDetail from '../app/admin/pages/DealDetail'
import ContactsPage from '../app/admin/pages/Contacts'
import ContactDetail from '../app/admin/pages/ContactDetail'
import Companies from '../app/admin/pages/Companies'
import CompanyDetail from '../app/admin/pages/CompanyDetail'
import Projects from '../app/admin/pages/Projects'
import ProjectDetail from '../app/admin/pages/ProjectDetail'
import ProjectTemplates from '../app/admin/pages/ProjectTemplates'
import ProjectTemplateForm from '../app/admin/pages/ProjectTemplateForm'
import Tasks from '../app/admin/pages/Tasks'
import AdminCalendar from '../app/admin/pages/Calendar'
import Messages from '../app/admin/pages/Messages'
import Tickets from '../app/admin/pages/Tickets'
import TimeTracking from '../app/admin/pages/TimeTracking'
import Proposals from '../app/admin/pages/ProposalsNew'
import ProposalDetail from '../app/admin/pages/ProposalDetailNew'
import Estimates from '../app/admin/pages/Estimates'
import EstimateDetail from '../app/admin/pages/EstimateDetail'
import Offers from '../app/admin/pages/Offers'
import OfferDetail from '../app/admin/pages/OfferDetail'
import Invoices from '../app/admin/pages/Invoices'
import InvoiceDetail from '../app/admin/pages/InvoiceDetail'
import Expenses from '../app/admin/pages/Expenses'
import AdminStore from '../app/admin/pages/Store'
import Items from '../app/admin/pages/Items'
import TestItemPage from '../app/admin/pages/TestItemPage'
import AdminPayments from '../app/admin/pages/Payments'
import AdminCreditNotes from '../app/admin/pages/CreditNotes'
import BankAccounts from '../app/admin/pages/BankAccounts'
import AdminContracts from '../app/admin/pages/Contracts'
import ContractDetail from '../app/admin/pages/ContractDetail'
import Orders from '../app/admin/pages/Orders'
import OrderDetail from '../app/admin/pages/OrderDetail'
import Integrations from '../app/admin/pages/Integrations'
import Employees from '../app/admin/pages/Employees'
import EmployeeDetail from '../app/admin/pages/EmployeeDetail'
import Attendance from '../app/admin/pages/Attendance'
import AdminLeaveRequests from '../app/admin/pages/LeaveRequests'
import Departments from '../app/admin/pages/Departments'
import Positions from '../app/admin/pages/Positions'
import Documents from '../app/admin/pages/Documents'
import Reports from '../app/admin/pages/Reports'
import RolesPermissions from '../app/admin/pages/RolesPermissions'
import AuditLogs from '../app/admin/pages/AuditLogs'
import EmailTemplates from '../app/admin/pages/EmailTemplates'
import FinanceTemplates from '../app/admin/pages/FinanceTemplates'
import CustomFields from '../app/admin/pages/CustomFields'
import TestCustomFieldsPage from '../app/admin/pages/TestCustomFieldsPage'
import SocialMediaLeads from '../app/admin/pages/SocialMediaLeads'
import SystemHealth from '../app/admin/pages/SystemHealth'
import Settings from '../app/admin/pages/Settings'
import NotificationSettings from '../app/admin/pages/NotificationSettings'
import AttendanceSettings from '../app/admin/pages/AttendanceSettings'
import EmailTemplatesSettings from '../app/admin/pages/EmailTemplatesSettings'
import CompanyPackages from '../app/admin/pages/CompanyPackages'
import LicenseManagement from '../app/admin/pages/LicenseManagement'
import ZohoBooks from '../app/admin/pages/ZohoBooks'
import QuickBooks from '../app/admin/pages/QuickBooks'
import PaymentGateways from '../app/admin/pages/PaymentGateways'
import SystemUpdates from '../app/admin/pages/SystemUpdates'
import DatabaseBackup from '../app/admin/pages/DatabaseBackup'
import TourGuide from '../app/admin/pages/TourGuide'
import Documentation from '../app/admin/pages/Documentation'
import AdminUsers from '../app/admin/pages/Users'
import PipelineSettings from '../app/admin/pages/PipelineSettings'

// Employee Pages
import EmployeeDashboard from '../app/employee/pages/EmployeeDashboard'
import MyTasks from '../app/employee/pages/MyTasks'
import MyProjects from '../app/employee/pages/MyProjects'
import MyProfile from '../app/employee/pages/MyProfile'
import MyDocuments from '../app/employee/pages/MyDocuments'
import EmployeeAttendance from '../app/employee/pages/Attendance'
import LeaveRequests from '../app/employee/pages/LeaveRequests'
import EmployeeCalendarPage from '../app/employee/pages/Calendar'
import EmployeeMessages from '../app/employee/pages/Messages'
import EmployeeTimeTracking from '../app/employee/pages/TimeTracking'
import Notifications from '../app/employee/pages/Notifications'
import EmployeeSettings from '../app/employee/pages/Settings'
import EmployeeTickets from '../app/employee/pages/Tickets'

// Super Admin Pages
import SuperAdminDashboard from '../app/superadmin/pages/SuperAdminDashboard'
import Packages from '../app/superadmin/pages/Packages'
import SuperAdminCompanies from '../app/superadmin/pages/Companies'
import Billing from '../app/superadmin/pages/Billing'
import AdminFAQ from '../app/superadmin/pages/AdminFAQ'
import Users from '../app/superadmin/pages/Users'
import OfflineRequests from '../app/superadmin/pages/OfflineRequests'
import SupportTickets from '../app/superadmin/pages/SupportTickets'
import FrontSettings from '../app/superadmin/pages/FrontSettings'
import SuperAdminSettings from '../app/superadmin/pages/Settings'
import UpdateManager from '../app/superadmin/pages/UpdateManager'
import PwaSettings from '../app/superadmin/pages/PwaSettings'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  try {
    const { user, loading } = useAuth()

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-primary-text">Loading...</div>
        </div>
      )
    }

    if (!user) {
      return <Navigate to="/login" replace />
    }

    return children
  } catch (error) {
    console.error('ProtectedRoute error:', error)
    return <Navigate to="/login" replace />
  }
}

// Role guard - redirects users who try to access unauthorized sections
const RoleGuard = ({ allowedRoles, children }) => {
  try {
    const { user, loading } = useAuth()

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-primary-text">Loading...</div>
        </div>
      )
    }

    if (!user) return <Navigate to="/login" replace />

    const role = user.role?.toUpperCase()
    if (!allowedRoles.map(r => r.toUpperCase()).includes(role)) {
      // Redirect to their own home
      switch (role) {
        case 'SUPERADMIN': return <Navigate to="/app/superadmin/dashboard" replace />
        case 'ADMIN': return <Navigate to="/app/admin/dashboard" replace />
        case 'EMPLOYEE': return <Navigate to="/app/employee/dashboard" replace />
        default: return <Navigate to="/login" replace />
      }
    }

    return children
  } catch (error) {
    console.error('RoleGuard error:', error)
    return <Navigate to="/login" replace />
  }
}

// Role-based redirect component
const RoleRedirect = () => {
  try {
    const { user, loading } = useAuth()

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-primary-text">Loading...</div>
        </div>
      )
    }

    if (!user) return <Navigate to="/login" replace />

    const role = user.role?.toUpperCase();
    switch (role) {
      case 'SUPERADMIN':
        return <Navigate to="/app/superadmin/dashboard" replace />
      case 'ADMIN':
        return <Navigate to="/app/admin/dashboard" replace />
      case 'EMPLOYEE':
        return <Navigate to="/app/employee/dashboard" replace />
      default:
        return <Navigate to="/login" replace />
    }
  } catch (error) {
    console.error('RoleRedirect error:', error)
    return <Navigate to="/login" replace />
  }
}

function AppRoutes() {
  return (
    <Routes>
      {/* Redirect Root to Login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth Routes */}
      <Route path="/login" element={<AuthLayout />}>
        <Route index element={<LoginPage />} />
      </Route>
      <Route path="/forgot-password" element={<AuthLayout />}>
        <Route index element={<ForgotPasswordPage />} />
      </Route>
      <Route path="/reset-password" element={<AuthLayout />}>
        <Route index element={<ResetPasswordPage />} />
      </Route>

      {/* Public Legal Pages */}
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/refund-policy" element={<RefundPolicyPage />} />

      {/* Protected App Routes */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleRedirect />} />

        {/* Super Admin Routes – only SUPERADMIN */}
        <Route path="superadmin/dashboard" element={<RoleGuard allowedRoles={['SUPERADMIN']}><SuperAdminDashboard /></RoleGuard>} />
        <Route path="superadmin/packages" element={<RoleGuard allowedRoles={['SUPERADMIN']}><Packages /></RoleGuard>} />
        <Route path="superadmin/companies" element={<RoleGuard allowedRoles={['SUPERADMIN']}><SuperAdminCompanies /></RoleGuard>} />
        <Route path="superadmin/billing" element={<RoleGuard allowedRoles={['SUPERADMIN']}><Billing /></RoleGuard>} />
        <Route path="superadmin/admin-faq" element={<RoleGuard allowedRoles={['SUPERADMIN']}><AdminFAQ /></RoleGuard>} />
        <Route path="superadmin/users" element={<RoleGuard allowedRoles={['SUPERADMIN']}><Users /></RoleGuard>} />
        <Route path="superadmin/offline-requests" element={<RoleGuard allowedRoles={['SUPERADMIN']}><OfflineRequests /></RoleGuard>} />
        <Route path="superadmin/support-tickets" element={<RoleGuard allowedRoles={['SUPERADMIN']}><SupportTickets /></RoleGuard>} />
        <Route path="superadmin/settings" element={<RoleGuard allowedRoles={['SUPERADMIN']}><SuperAdminSettings /></RoleGuard>} />
        <Route path="superadmin/pwa-settings" element={<RoleGuard allowedRoles={['SUPERADMIN']}><PwaSettings /></RoleGuard>} />
        <Route path="superadmin/updates" element={<RoleGuard allowedRoles={['SUPERADMIN']}><UpdateManager /></RoleGuard>} />

        {/* Admin Routes – SUPERADMIN + ADMIN */}
        <Route path="admin/dashboard" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><AdminDashboard /></RoleGuard>} />

        <Route path="admin/crm" element={<Navigate to="/app/admin/leads" replace />} />

        <Route element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><CRMLayout /></RoleGuard>}>
          <Route path="admin/leads" element={<Leads />} />
          <Route path="admin/leads/:id" element={<LeadDetail />} />
          <Route path="admin/contacts" element={<ContactsPage />} />
          <Route path="admin/contacts/:id" element={<ContactDetail />} />
          <Route path="admin/deals" element={<Deals />} />
          <Route path="admin/deals/:id" element={<DealDetail />} />
          <Route path="admin/companies" element={<Companies />} />
          <Route path="admin/companies/:id" element={<CompanyDetail />} />
          <Route path="admin/revenue" element={<Invoices />} />
          <Route path="admin/offers" element={<Offers />} />
          <Route path="admin/offers/:id" element={<OfferDetail />} />
          <Route path="admin/offers/:id/edit" element={<OfferDetail />} />
          <Route path="admin/invoices" element={<Invoices />} />
          <Route path="admin/invoices/:id" element={<InvoiceDetail />} />
        </Route>


        <Route path="admin/company-packages" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><CompanyPackages /></RoleGuard>} />
        <Route path="admin/license-management" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><LicenseManagement /></RoleGuard>} />
        <Route path="admin/projects" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><Projects /></RoleGuard>} />
        <Route path="admin/projects/:id" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><ProjectDetail /></RoleGuard>} />
        <Route path="admin/project-templates" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><ProjectTemplates /></RoleGuard>} />
        <Route path="admin/project-templates/add" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><ProjectTemplateForm /></RoleGuard>} />
        <Route path="admin/project-templates/:id" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><ProjectTemplateForm /></RoleGuard>} />
        <Route path="admin/project-templates/:id/edit" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><ProjectTemplateForm /></RoleGuard>} />
        <Route path="admin/tasks" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><Tasks /></RoleGuard>} />
        <Route path="admin/calendar" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><AdminCalendar /></RoleGuard>} />
        <Route path="admin/messages" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><Messages /></RoleGuard>} />

        <Route path="admin/time-tracking" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><TimeTracking /></RoleGuard>} />
        <Route path="admin/proposals" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><Proposals /></RoleGuard>} />
        <Route path="admin/proposals/:id" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><ProposalDetail /></RoleGuard>} />
        <Route path="admin/estimates" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><Estimates /></RoleGuard>} />
        <Route path="admin/estimates/:id" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><EstimateDetail /></RoleGuard>} />
        <Route path="admin/expenses" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><Expenses /></RoleGuard>} />
        <Route path="admin/items" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><Items /></RoleGuard>} />
        <Route path="admin/test-items" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><TestItemPage /></RoleGuard>} />
        <Route path="admin/store" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><AdminStore /></RoleGuard>} />
        <Route path="admin/payments" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><AdminPayments /></RoleGuard>} />
        <Route path="admin/credit-notes" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><AdminCreditNotes /></RoleGuard>} />
        <Route path="admin/bank-accounts" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><BankAccounts /></RoleGuard>} />
        <Route path="admin/contracts" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><AdminContracts /></RoleGuard>} />
        <Route path="admin/contracts/:id" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><ContractDetail /></RoleGuard>} />
        <Route path="admin/orders" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><Orders /></RoleGuard>} />
        <Route path="admin/orders/:id" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><OrderDetail /></RoleGuard>} />

        <Route path="admin/integrations" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><Integrations /></RoleGuard>} />
        <Route path="admin/integrations/zoho-books" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><ZohoBooks /></RoleGuard>} />
        <Route path="admin/integrations/quickbooks" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><QuickBooks /></RoleGuard>} />
        <Route path="admin/integrations/payment-gateways" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><PaymentGateways /></RoleGuard>} />
        <Route path="admin/system-updates" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><SystemUpdates /></RoleGuard>} />
        <Route path="admin/database-backup" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><DatabaseBackup /></RoleGuard>} />
        <Route path="admin/tour-guide" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><TourGuide /></RoleGuard>} />
        <Route path="admin/documentation" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><Documentation /></RoleGuard>} />
        <Route path="admin/employees" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><Employees /></RoleGuard>} />
        <Route path="admin/employees/:id" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><EmployeeDetail /></RoleGuard>} />
        <Route path="admin/attendance" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><Attendance /></RoleGuard>} />
        <Route path="admin/leave-requests" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><AdminLeaveRequests /></RoleGuard>} />
        <Route path="admin/departments" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><Departments /></RoleGuard>} />
        <Route path="admin/positions" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><Positions /></RoleGuard>} />
        <Route path="admin/documents" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><Documents /></RoleGuard>} />
        <Route path="admin/reports" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><Reports /></RoleGuard>} />
        <Route path="admin/roles-permissions" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><RolesPermissions /></RoleGuard>} />
        <Route path="admin/audit-logs" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><AuditLogs /></RoleGuard>} />
        <Route path="admin/email-templates" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><EmailTemplates /></RoleGuard>} />
        <Route path="admin/finance-templates" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><FinanceTemplates /></RoleGuard>} />
        <Route path="admin/custom-fields" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><CustomFields /></RoleGuard>} />
        <Route path="admin/test-custom-fields" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><TestCustomFieldsPage /></RoleGuard>} />
        <Route path="admin/social-media-leads" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><SocialMediaLeads /></RoleGuard>} />
        <Route path="admin/system-health" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><SystemHealth /></RoleGuard>} />
        <Route path="admin/settings" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><Settings /></RoleGuard>} />

        <Route path="admin/settings/email-templates" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><EmailTemplatesSettings /></RoleGuard>} />
        <Route path="admin/settings/notifications" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><NotificationSettings /></RoleGuard>} />
        <Route path="admin/settings/attendance" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><AttendanceSettings /></RoleGuard>} />
        <Route path="admin/settings/pipelines" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><PipelineSettings /></RoleGuard>} />
        <Route path="admin/users" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN']}><AdminUsers /></RoleGuard>} />

        {/* Employee Routes – EMPLOYEE only */}
        <Route path="employee/dashboard" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN', 'EMPLOYEE']}><EmployeeDashboard /></RoleGuard>} />
        <Route path="employee/my-tasks" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN', 'EMPLOYEE']}><MyTasks /></RoleGuard>} />
        <Route path="employee/my-projects" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN', 'EMPLOYEE']}><MyProjects /></RoleGuard>} />
        <Route path="employee/my-projects/:id" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN', 'EMPLOYEE']}><ProjectDetail /></RoleGuard>} />
        <Route path="employee/my-profile" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN', 'EMPLOYEE']}><MyProfile /></RoleGuard>} />
        <Route path="employee/my-documents" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN', 'EMPLOYEE']}><MyDocuments /></RoleGuard>} />
        <Route path="employee/attendance" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN', 'EMPLOYEE']}><EmployeeAttendance /></RoleGuard>} />
        <Route path="employee/leave-requests" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN', 'EMPLOYEE']}><LeaveRequests /></RoleGuard>} />
        <Route path="employee/calendar" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN', 'EMPLOYEE']}><EmployeeCalendarPage /></RoleGuard>} />
        <Route path="employee/messages" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN', 'EMPLOYEE']}><EmployeeMessages /></RoleGuard>} />
        <Route path="employee/time-tracking" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN', 'EMPLOYEE']}><EmployeeTimeTracking /></RoleGuard>} />
        <Route path="employee/notifications" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN', 'EMPLOYEE']}><Notifications /></RoleGuard>} />
        <Route path="employee/settings" element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN', 'EMPLOYEE']}><EmployeeSettings /></RoleGuard>} />
        <Route path="employee/crm" element={<Navigate to="/app/employee/leads" replace />} />
        <Route element={<RoleGuard allowedRoles={['SUPERADMIN', 'ADMIN', 'EMPLOYEE']}><CRMLayout /></RoleGuard>}>
          <Route path="employee/leads" element={<Leads />} />
          <Route path="employee/leads/:id" element={<LeadDetail />} />
          <Route path="employee/contacts" element={<ContactsPage />} />
          <Route path="employee/contacts/:id" element={<ContactDetail />} />
          <Route path="employee/companies" element={<Companies />} />
          <Route path="employee/companies/:id" element={<CompanyDetail />} />
          <Route path="employee/deals" element={<Deals />} />
          <Route path="employee/deals/:id" element={<DealDetail />} />
          <Route path="employee/offers" element={<Offers />} />
          <Route path="employee/offers/:id" element={<OfferDetail />} />
          <Route path="employee/offers/:id/edit" element={<OfferDetail />} />
          <Route path="employee/invoices" element={<Invoices />} />
          <Route path="employee/invoices/:id" element={<InvoiceDetail />} />
        </Route>
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default AppRoutes
