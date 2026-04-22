import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import {
  paymentsAPI,
  invoicesAPI,
  projectsAPI,
} from "../../../api";
import {
  IoAdd,
  IoClose,
  IoSearch,
  IoChevronDown,
  IoTrash,
  IoCreate,
  IoPrint,
  IoGrid,
  IoCheckmark,
  IoChevronBack,
  IoChevronForward,
  IoList,
  IoBarChart,
  IoDownloadOutline,
} from "react-icons/io5";
import { useTheme } from "../../../context/ThemeContext";

const Payments = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const primaryColor = theme?.primaryAccent || "#217E45";

  const companyId = parseInt(localStorage.getItem("companyId") || 1, 10);
  const userId = parseInt(localStorage.getItem("userId") || 1, 10);

  // View state (list or chart)
  const [activeView, setActiveView] = useState("list");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Data states
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("All");
  const [currencyFilter, setCurrencyFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [periodFilter, setPeriodFilter] = useState("monthly");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [customDateStart, setCustomDateStart] = useState("");
  const [customDateEnd, setCustomDateEnd] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Form state
  const [formData, setFormData] = useState({
    invoice_id: "",
    payment_method: "",
    payment_date: new Date().toISOString().split("T")[0],
    amount: "",
    note: "",
  });

  // Payment methods list
  const paymentMethods = [
    "Cash",
    "Bank Transfer",
    "PayPal Payments Standard",
    "Paytm",
    "Stripe",
    "Credit Card",
    "Debit Card",
    "UPI",
    "Cheque",
  ];

  // Currency options
  const currencies = ["USD", "EUR", "GBP", "INR", "AUD", "CAD"];

  // Month names
  const monthNames = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ];

  // Short month names for chart
  const shortMonthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

  // Fetch functions
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const params = { company_id: companyId };
      const response = await paymentsAPI.getAll(params);
      if (response.data.success) {
        setPayments(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const fetchInvoices = useCallback(async () => {
    try {
      const response = await invoicesAPI.getAll({ company_id: companyId });
      if (response.data.success) {
        setInvoices(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  }, [companyId]);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await projectsAPI.getAll({ company_id: companyId });
      if (response.data.success) {
        setProjects(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  }, [companyId]);



  useEffect(() => {
    fetchPayments();
    fetchInvoices();
    fetchProjects();
  }, [fetchPayments, fetchInvoices, fetchProjects]);

  // Reset form
  const resetForm = () => {
    setFormData({
      invoice_id: "",
      payment_method: "",
      payment_date: new Date().toISOString().split("T")[0],
      amount: "",
      note: "",
    });
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.invoice_id) {
      alert("Bitte wählen Sie eine Rechnung aus");
      return;
    }
    if (!formData.payment_method) {
      alert("Bitte wählen Sie eine Zahlungsmethode aus");
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert("Bitte geben Sie einen gültigen Betrag ein");
      return;
    }

    try {
      const paymentData = {
        company_id: companyId,
        user_id: userId,
        invoice_id: parseInt(formData.invoice_id),
        payment_method: formData.payment_method,
        payment_date: formData.payment_date,
        amount: parseFloat(formData.amount),
        note: formData.note || null,
      };

      if (isEditModalOpen && selectedPayment) {
        const response = await paymentsAPI.update(selectedPayment.id, paymentData, { company_id: companyId });
        if (response.data.success) {
          alert("Zahlung erfolgreich aktualisiert!");
          await fetchPayments();
          await fetchInvoices();
          setIsEditModalOpen(false);
          setSelectedPayment(null);
          resetForm();
        }
      } else {
        const response = await paymentsAPI.create(paymentData);
        if (response.data.success) {
          alert("Zahlung erfolgreich hinzugefügt!");
          await fetchPayments();
          await fetchInvoices();
          setIsAddModalOpen(false);
          resetForm();
        }
      }
    } catch (error) {
      console.error("Error saving payment:", error);
      alert(error.response?.data?.error || "Zahlung konnte nicht gespeichert werden");
    }
  };

  // Handle edit
  const handleEdit = (payment) => {
    setSelectedPayment(payment);
    setFormData({
      invoice_id: payment.invoice_id?.toString() || "",
      payment_method: payment.payment_method || "",
      payment_date: payment.payment_date ? payment.payment_date.split("T")[0] : new Date().toISOString().split("T")[0],
      amount: payment.amount?.toString() || "",
      note: payment.note || "",
    });
    setIsEditModalOpen(true);
  };

  // Handle delete
  const handleDelete = async (payment) => {
    if (window.confirm(`Möchten Sie diese Zahlung über €${payment.amount} wirklich löschen?`)) {
      try {
        const response = await paymentsAPI.delete(payment.id, { company_id: companyId });
        if (response.data.success) {
          alert("Zahlung erfolgreich gelöscht!");
          await fetchPayments();
          await fetchInvoices();
        }
      } catch (error) {
        console.error("Error deleting payment:", error);
        alert(error.response?.data?.error || "Zahlung konnte nicht gelöscht werden");
      }
    }
  };

  // Handle view invoice
  const handleViewInvoice = (invoiceId) => {
    if (invoiceId) {
      navigate(`/app/admin/invoices/${invoiceId}`);
    }
  };

  // Handle print
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const tableHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Zahlungseingangsliste</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            tr:nth-child(even) { background-color: #fafafa; }
            .total-row { font-weight: bold; background-color: #f0f0f0; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <h1>Zahlungseingangsliste</h1>
          <table>
            <thead>
              <tr>
                <th>Rechnungs-ID</th>
                <th>Zahlungsdatum</th>
                <th>Zahlungsmethode</th>
                <th>Notiz</th>
                <th>Betrag</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPayments.map((payment) => `
                <tr>
                  <td>INV #${payment.invoice_id || payment.id}</td>
                  <td>${formatDate(payment.payment_date)}</td>
                  <td>${payment.payment_method || "-"}</td>
                  <td>${payment.note || "-"}</td>
                  <td>€${parseFloat(payment.amount || 0).toFixed(2)}</td>
                </tr>
              `).join("")}
              <tr class="total-row">
                <td colspan="4" style="text-align: right;">Gesamt:</td>
                <td>€${totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(tableHTML);
    printWindow.document.close();
  };

  // Handle export Excel
  const handleExportExcel = () => {
    const csvData = filteredPayments.map((payment) => ({
      "Invoice ID": `INV #${payment.invoice_id || payment.id}`,
      "Payment date": formatDate(payment.payment_date),
      "Payment method": payment.payment_method || "-",
      "Note": payment.note || "-",
      "Amount": payment.amount,
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => headers.map((h) => `"${row[h] || ""}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `payments_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // Filter handlers
  const handleResetFilters = () => {
    setPaymentMethodFilter("All");
    setCurrencyFilter("All");
    setProjectFilter("All");
    setPeriodFilter("monthly");
    setSelectedYear(new Date().getFullYear());
    setSelectedMonth(new Date().getMonth() + 1);
    setCustomDateStart("");
    setCustomDateEnd("");
    setSearchQuery("");
    setShowFilterPanel(false);
  };

  // Format helpers
  const formatDate = (dateString) => {
    if (!dateString) return "--";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).replace(/\//g, "-");
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Get invoice display with due amount
  const getInvoiceDisplay = (invoice) => {
    const invoiceNum = invoice.invoice_number || `INV #${invoice.id}`;
    const dueAmount = parseFloat(invoice.due_amount || invoice.total || 0) - parseFloat(invoice.paid_amount || 0);
    return `${invoiceNum} (Due: €${dueAmount.toFixed(2)})`;
  };

  // Handle invoice selection - auto-fill amount
  const handleInvoiceSelect = (invoiceId) => {
    setFormData({ ...formData, invoice_id: invoiceId });
    if (invoiceId) {
      const selectedInvoice = invoices.find(inv => inv.id === parseInt(invoiceId));
      if (selectedInvoice) {
        const dueAmount = parseFloat(selectedInvoice.due_amount || selectedInvoice.total || 0) - parseFloat(selectedInvoice.paid_amount || 0);
        setFormData(prev => ({ ...prev, invoice_id: invoiceId, amount: dueAmount > 0 ? dueAmount.toFixed(2) : "" }));
      }
    }
  };

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      if (!payment) return false;

      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const invoiceId = `INV #${payment.invoice_id || payment.id}`.toLowerCase();
        const note = (payment.note || "").toLowerCase();
        const method = (payment.payment_method || "").toLowerCase();
        if (!invoiceId.includes(searchLower) && !note.includes(searchLower) && !method.includes(searchLower)) {
          return false;
        }
      }

      // Payment method filter
      if (paymentMethodFilter !== "All" && payment.payment_method !== paymentMethodFilter) {
        return false;
      }

      // Project filter
      if (projectFilter !== "All") {
        const projectId = parseInt(projectFilter);
        if (payment.project_id !== projectId) {
          return false;
        }
      }



      // Date filters
      const paymentDate = payment.payment_date ? new Date(payment.payment_date) : null;

      if (periodFilter === "monthly" && paymentDate) {
        if (paymentDate.getFullYear() !== selectedYear || paymentDate.getMonth() + 1 !== selectedMonth) {
          return false;
        }
      }

      if (periodFilter === "yearly" && paymentDate) {
        if (paymentDate.getFullYear() !== selectedYear) {
          return false;
        }
      }

      if (periodFilter === "custom" && paymentDate) {
        if (customDateStart && paymentDate < new Date(customDateStart)) return false;
        if (customDateEnd) {
          const endDate = new Date(customDateEnd);
          endDate.setHours(23, 59, 59, 999);
          if (paymentDate > endDate) return false;
        }
      }

      return true;
    });
  }, [payments, searchQuery, paymentMethodFilter, projectFilter, periodFilter, selectedYear, selectedMonth, customDateStart, customDateEnd]);

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

  // Total amount
  const totalAmount = filteredPayments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);

  // Get invoices with pending due amounts
  const invoicesWithDue = invoices.filter(inv => {
    const dueAmount = parseFloat(inv.due_amount || inv.total || 0) - parseFloat(inv.paid_amount || 0);
    return dueAmount > 0;
  });

  // Chart data - monthly totals for selected year
  const chartData = useMemo(() => {
    const monthlyTotals = Array(12).fill(0);

    payments.forEach((payment) => {
      if (!payment.payment_date) return;
      const date = new Date(payment.payment_date);
      if (date.getFullYear() === selectedYear) {
        const month = date.getMonth();
        monthlyTotals[month] += parseFloat(payment.amount) || 0;
      }
    });

    const maxValue = Math.max(...monthlyTotals, 1);

    return {
      months: shortMonthNames,
      values: monthlyTotals,
      maxValue: Math.ceil(maxValue / 1000) * 1000 || 6000,
    };
  }, [payments, selectedYear]);

  // Chart Y-axis labels
  const getYAxisLabels = (maxValue) => {
    const labels = [];
    const step = maxValue / 5;
    for (let i = 5; i >= 0; i--) {
      labels.push(Math.round(step * i));
    }
    return labels;
  };

  return (
    <div className="space-y-4 bg-main-bg min-h-screen p-4">
      {/* Top Navigation Bar */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {/* Left Side - Title and Tabs */}
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold text-primary-accent">Zahlungseingang</h1>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveView("list")}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeView === "list"
                  ? "text-primary-text border-primary-accent"
                  : "text-secondary-text border-transparent hover:text-primary-text"
                  }`}
              >
                Liste
              </button>
              <button
                onClick={() => setActiveView("chart")}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeView === "chart"
                  ? "text-primary-text border-primary-accent"
                  : "text-secondary-text border-transparent hover:text-primary-text"
                  }`}
              >
                Diagramm
              </button>
            </div>
          </div>

          {/* Right Side - Add Button */}
          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm active:scale-95"
          >
            <IoAdd size={16} />
            Zahlung hinzufügen
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4">
          {/* Left Side */}
          <div className="flex items-center gap-3">
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <IoGrid size={18} className="text-gray-500" />
            </button>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs border rounded-lg transition-colors shadow-sm ${showFilterPanel ? "border-primary-accent bg-primary-accent/5 text-primary-accent" : "border-gray-300 hover:bg-gray-50 text-gray-600"
                }`}
            >
              <IoAdd size={14} />
              Neuer Filter
            </button>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 shadow-sm"
            >
              Excel
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 shadow-sm"
            >
              Drucken
            </button>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Suchen"
                className="pl-3 pr-8 py-1.5 text-xs border border-gray-300 rounded-lg w-40 outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent shadow-sm"
              />
              <IoSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Payment Method Dropdown */}
            <div className="relative">
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="appearance-none px-3 py-1.5 pr-8 text-xs border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent shadow-sm"
              >
                <option value="All">- Zahlungsmethode -</option>
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
              <IoChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>

            {/* Currency Dropdown */}
            <div className="relative">
              <select
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value)}
                className="appearance-none px-3 py-1.5 pr-8 text-xs border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent shadow-sm"
              >
                <option value="All">- Währung -</option>
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
              <IoChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>

            {/* Project Dropdown */}
            <div className="relative">
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="appearance-none px-3 py-1.5 pr-8 text-xs border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent shadow-sm"
              >
                <option value="All">- Projekt -</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.project_name || project.name}</option>
                ))}
              </select>
              <IoChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>

            {/* Period Buttons */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 shadow-inner">
              {["monthly", "yearly", "custom", "dynamic"].map((period) => (
                <button
                  key={period}
                  onClick={() => setPeriodFilter(period)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${periodFilter === period
                    ? "bg-white shadow text-primary-text font-medium"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>

            {/* Month/Year Navigation */}
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => {
                  if (periodFilter === "yearly") {
                    setSelectedYear(y => y - 1);
                  } else if (selectedMonth === 1) {
                    setSelectedMonth(12);
                    setSelectedYear(y => y - 1);
                  } else {
                    setSelectedMonth(m => m - 1);
                  }
                }}
                className="px-2 py-2 hover:bg-gray-100 border-r border-gray-300"
              >
                <IoChevronBack size={14} />
              </button>
              <span className="px-3 py-1.5 text-xs font-medium min-w-[120px] text-center">
                {periodFilter === "yearly" ? selectedYear : `${monthNames[selectedMonth - 1]} ${selectedYear}`}
              </span>
              <button
                onClick={() => {
                  if (periodFilter === "yearly") {
                    setSelectedYear(y => y + 1);
                  } else if (selectedMonth === 12) {
                    setSelectedMonth(1);
                    setSelectedYear(y => y + 1);
                  } else {
                    setSelectedMonth(m => m + 1);
                  }
                }}
                className="px-2 py-1.5 hover:bg-gray-100 border-l border-gray-300"
              >
                <IoChevronForward size={14} />
              </button>
            </div>

            {/* Apply & Reset Buttons */}
            <button
              className="p-2 text-white rounded-lg hover:opacity-90 transition-colors"
              style={{ backgroundColor: primaryColor }}
              title="Filter anwenden"
            >
              <IoCheckmark size={18} />
            </button>
            <button
              onClick={handleResetFilters}
              className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
              title="Filter zurücksetzen"
            >
              <IoClose size={18} />
            </button>
          </div>

          {/* Custom Date Range (visible when custom is selected) */}
          {periodFilter === "custom" && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Von Datum</label>
                <input
                  type="date"
                  value={customDateStart}
                  onChange={(e) => setCustomDateStart(e.target.value)}
                  className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent shadow-sm"
                />
              </div>
              <span className="text-gray-400 mt-5">-</span>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Bis Datum</label>
                <input
                  type="date"
                  value={customDateEnd}
                  onChange={(e) => setCustomDateEnd(e.target.value)}
                  className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent shadow-sm"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content Area */}
      {activeView === "list" ? (
        /* List View */
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      Rechnungs-ID
                      <IoChevronDown size={12} className="text-gray-400" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      Zahlungsdatum
                      <IoChevronDown size={12} className="text-gray-400" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Zahlungsmethode</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Notiz</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Betrag</th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Zahlungen werden geladen...</td>
                  </tr>
                ) : paginatedPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Keine Zahlungen gefunden</td>
                  </tr>
                ) : (
                  paginatedPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewInvoice(payment.invoice_id)}
                          className="font-medium hover:underline"
                          style={{ color: primaryColor }}
                        >
                          INV #{payment.invoice_id || payment.id}
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-600 text-sm">
                        {formatDate(payment.payment_date)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-700 text-sm">
                        {payment.payment_method || "-"}
                      </td>
                      <td className="px-4 py-4 text-gray-600 text-sm max-w-xs truncate" title={payment.note || ""}>
                        {payment.note || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-gray-800 font-medium text-sm">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(payment)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                            title="Bearbeiten"
                          >
                            <IoCreate size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(payment)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                            title="Löschen"
                          >
                            <IoTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer with Pagination */}
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-4">
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                className="px-2 py-1 text-sm border border-gray-300 rounded"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-600">
                {filteredPayments.length > 0 ? `${startIndex + 1}-${Math.min(endIndex, filteredPayments.length)}` : "0"} / {filteredPayments.length}
              </span>
            </div>
            <div className="text-sm font-bold text-gray-700">
              Gesamt: {formatCurrency(totalAmount)}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`p-1.5 border border-gray-300 rounded ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}`}
              >
                <IoChevronBack size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`p-1.5 border border-gray-300 rounded ${currentPage === totalPages || totalPages === 0 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}`}
              >
                <IoChevronForward size={16} />
              </button>
            </div>
          </div>
        </Card>
      ) : (
        /* Chart View */
        <Card className="p-6">
          {/* Chart Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <IoBarChart className="text-gray-400" size={18} />
              <span className="text-sm font-medium text-gray-600">Diagramm</span>
            </div>
            <div className="flex items-center gap-4">
              {/* Currency Selector */}
              <div className="relative">
                <select
                  value={currencyFilter}
                  onChange={(e) => setCurrencyFilter(e.target.value)}
                  className="appearance-none px-4 py-2 pr-8 text-sm border border-gray-300 rounded-lg outline-none bg-white"
                >
                  <option value="All">Währung</option>
                  {currencies.map((currency) => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
                <IoChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>

              {/* Year Navigation */}
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setSelectedYear(y => y - 1)}
                  className="px-2 py-2 hover:bg-gray-100 border-r border-gray-300"
                >
                  <IoChevronBack size={16} />
                </button>
                <span className="px-4 py-2 text-sm font-medium min-w-[80px] text-center">
                  {selectedYear}
                </span>
                <button
                  onClick={() => setSelectedYear(y => y + 1)}
                  className="px-2 py-2 hover:bg-gray-100 border-l border-gray-300"
                >
                  <IoChevronForward size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="relative h-80">
            {/* Y-Axis */}
            <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-500">
              {getYAxisLabels(chartData.maxValue).map((label, idx) => (
                <span key={idx} className="text-right pr-2">{label}</span>
              ))}
            </div>

            {/* Grid Lines */}
            <div className="absolute left-14 right-0 top-0 bottom-8">
              {[0, 1, 2, 3, 4, 5].map((_, idx) => (
                <div
                  key={idx}
                  className="absolute w-full border-t border-gray-100"
                  style={{ top: `${(idx * 100) / 5}%` }}
                />
              ))}
            </div>

            {/* Bars */}
            <div className="absolute left-14 right-0 top-0 bottom-8 flex items-end justify-around gap-2 px-2">
              {chartData.values.map((value, idx) => {
                const heightPercent = chartData.maxValue > 0 ? (value / chartData.maxValue) * 100 : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full max-w-12 rounded-t transition-all duration-300 hover:opacity-80 cursor-pointer relative group"
                      style={{
                        height: `${Math.max(heightPercent, 0)}%`,
                        backgroundColor: `${primaryColor}40`,
                        minHeight: value > 0 ? '4px' : '0',
                      }}
                    >
                      {/* Tooltip */}
                      {value > 0 && (
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {formatCurrency(value)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-Axis Labels */}
            <div className="absolute left-14 right-0 bottom-0 h-8 flex items-center justify-around text-xs text-gray-500">
              {chartData.months.map((month, idx) => (
                <span key={idx} className="flex-1 text-center">{month}</span>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-3 rounded"
                style={{ backgroundColor: `${primaryColor}40` }}
              />
              <span className="text-xs text-gray-500">Monatliche Zahlungen ({selectedYear})</span>
            </div>
          </div>
        </Card>
      )}

      {/* Mobile Card View (visible on small screens) */}
      <div className="md:hidden space-y-3">
        {activeView === "list" && paginatedPayments.map((payment) => (
          <Card key={payment.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <button
                onClick={() => handleViewInvoice(payment.invoice_id)}
                className="font-medium text-sm"
                style={{ color: primaryColor }}
              >
                INV #{payment.invoice_id || payment.id}
              </button>
              <span className="font-bold text-gray-800">{formatCurrency(payment.amount)}</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Datum:</span>
                <span className="text-gray-700">{formatDate(payment.payment_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Methode:</span>
                <span className="text-gray-700">{payment.payment_method || "-"}</span>
              </div>
              {payment.note && (
                <div className="text-gray-600 text-xs mt-2 pt-2 border-t border-gray-100">
                  {payment.note}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => handleEdit(payment)}
                className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                <IoCreate size={16} /> Bearbeiten
              </button>
              <button
                onClick={() => handleDelete(payment)}
                className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-red-500 hover:bg-red-50 rounded"
              >
                <IoTrash size={16} /> Löschen
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Add/Edit Payment Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedPayment(null); resetForm(); }}
        title={isEditModalOpen ? "Zahlung bearbeiten" : "Zahlung hinzufügen"}
      >
        <div className="space-y-4">
          {/* Invoice */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="w-36 text-sm font-medium text-gray-700">Rechnung</label>
            <select
              value={formData.invoice_id}
              onChange={(e) => handleInvoiceSelect(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent"
            >
              <option value="">Rechnung auswählen</option>
              {invoicesWithDue.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {getInvoiceDisplay(invoice)}
                </option>
              ))}
              {/* Also show all invoices if editing */}
              {isEditModalOpen && invoices.filter(inv => !invoicesWithDue.find(i => i.id === inv.id)).map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.invoice_number || `INV #${invoice.id}`} (Bezahlt)
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="w-36 text-sm font-medium text-gray-700">Zahlungsmethode</label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent"
            >
              <option value="">Zahlungsmethode auswählen</option>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          {/* Payment Date */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="w-36 text-sm font-medium text-gray-700">Payment date</label>
            <Input
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              className="flex-1"
            />
          </div>

          {/* Amount */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="w-36 text-sm font-medium text-gray-700">Amount</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Enter amount"
              className="flex-1"
            />
          </div>

          {/* Note */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2">
            <label className="w-36 text-sm font-medium text-gray-700 sm:pt-2">Note</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Add a note (optional)..."
              rows={3}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent"
            />
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedPayment(null); resetForm(); }}
            >
              <IoClose size={16} className="mr-1" /> Close
            </Button>
            <Button
              onClick={handleSave}
              className="text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <IoCheckmark size={18} className="mr-1" /> Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Payments;
