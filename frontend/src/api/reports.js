import axiosInstance from './axiosInstance'

export const reportsAPI = {
  getSalesReport: (params) => axiosInstance.get('/reports/sales', { params }),
  getRevenueReport: (params) => axiosInstance.get('/reports/revenue', { params }),
  getProjectStatusReport: (params) => axiosInstance.get('/reports/projects', { params }),
  getEmployeePerformanceReport: (params) => axiosInstance.get('/reports/employees', { params }),
  getSummary: (params) => axiosInstance.get('/reports/summary', { params }),

  // New report endpoints
  getExpensesSummary: (params) => axiosInstance.get('/reports/expenses-summary', { params }),
  getInvoicesSummary: (params) => axiosInstance.get('/reports/invoices-summary', { params }),
  getInvoiceDetails: (params) => axiosInstance.get('/reports/invoice-details', { params }),
  getIncomeVsExpenses: (params) => axiosInstance.get('/reports/income-vs-expenses', { params }),
  getPaymentsSummary: (params) => axiosInstance.get('/reports/payments-summary', { params }),
  getTimesheetsReport: (params) => axiosInstance.get('/reports/timesheets', { params }),
  getProjectsReport: (params) => axiosInstance.get('/reports/projects-summary', { params }),
}

