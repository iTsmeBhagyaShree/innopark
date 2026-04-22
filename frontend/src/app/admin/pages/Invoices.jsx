import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../context/LanguageContext";
import RightSideModal from "../../../components/ui/RightSideModal";
import Modal from "../../../components/ui/Modal";
import Badge from "../../../components/ui/Badge";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import CustomFieldsSection from "../../../components/ui/CustomFieldsSection";
import {
  invoicesAPI,
  projectsAPI,
  companiesAPI,
  paymentsAPI,
  customFieldsAPI,
} from "../../../api";
import { useSettings } from "../../../context/SettingsContext";
import { useAuth } from "../../../context/AuthContext";
import ColorPicker from "../../../components/ui/ColorPicker";
import {
  IoAdd,
  IoClose,
  IoSearch,
  IoFilter,
  IoDownload,
  IoChevronDown,
  IoChevronUp,
  IoEllipsisVertical,
  IoCheckmarkCircle,
  IoCloudUpload,
  IoTrash,
  IoCreate,
  IoEye,
  IoRefresh,
  IoTime,
  IoInformationCircle,
  IoHelpCircle,
  IoPrint,
  IoOpenOutline,
  IoPricetag,
  IoCash,
  IoAttach,
  IoMic,
  IoDocumentText,
  IoCheckmark,
  IoChevronBack,
  IoChevronForward,
  IoCopy,
  IoWarning,
  IoColorPalette,
} from "react-icons/io5";

const Invoices = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { settings, formatDate, formatCurrency } = useSettings();
  const companyId = parseInt(user?.company_id || localStorage.getItem("companyId") || 1, 10);
  const userId = parseInt(user?.id || localStorage.getItem("userId") || 1, 10);

  // Tab state
  const [activeTab, setActiveTab] = useState("invoices");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManageLabelsModalOpen, setIsManageLabelsModalOpen] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);

  // Labels state
  const [labels, setLabels] = useState(() => {
    try {
      const stored = localStorage.getItem("invoiceLabels");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (error) {
      console.warn("Failed to load labels from storage", error);
    }
    return [
      { name: "Urgent", color: "#ef4444" },
      { name: "Pending Review", color: "#eab308" },
      { name: "Approved", color: "#22c55e" },
      { name: "In Bearbeitung", color: "#3b82f6" },
      { name: "Taxable", color: "#8b5cf6" },
    ];
  });
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("");

  // Data states
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [invoiceFilter, setInvoiceFilter] = useState("All");
  const [currencyFilter, setCurrencyFilter] = useState("All");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [periodFilter, setPeriodFilter] = useState("yearly");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [customDateStart, setCustomDateStart] = useState("");
  const [customDateEnd, setCustomDateEnd] = useState("");
  const [dynamicRange, setDynamicRange] = useState("30");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Invoice items state
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [customFields, setCustomFields] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    billDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    project: "",
    currency: "USD",
    tax: "",
    taxRate: 0,
    secondTax: "",
    secondTaxRate: 0,
    tds: "",
    note: "",
    labels: [],
    isRecurring: true,
    repeatEvery: 1,
    repeatType: "Month",
    cycles: "",
    discount: 0,
    discountType: "%",
    custom_fields: {},
  });

  const [paymentForm, setPaymentForm] = useState({
    invoiceId: "",
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    method: "Cash",
    note: "",
  });

  // Fetch functions
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params = { company_id: companyId };
      if (statusFilter !== "All") {
        params.status = statusFilter;
      }
      const response = await invoicesAPI.getAll(params);
      if (response.data.success) {
        const fetchedInvoices = response.data.data || [];
        const transformedInvoices = fetchedInvoices.map((invoice) => {
          let invNumber = String(invoice.invoice_number || "");
          const numMatch = invNumber.match(/\d+/);
          const numPart = numMatch ? numMatch[0] : String(invoice.id);
          const formattedInvoiceNumber = `INV #${numPart}`;
          const totalValue = parseFloat(invoice.total || 0);
          const paidValue = parseFloat(invoice.paid_amount || 0);
          const dueValue = parseFloat(invoice.due_amount || Math.max(totalValue - paidValue, 0));
          const statusValue = calculateInvoiceStatus({
            ...invoice,
            total: totalValue,
            paid_amount: paidValue,
            due_amount: dueValue,
          });

          return {
            id: invoice.id,
            invoiceNumber: formattedInvoiceNumber,
            name: "External Billing", // Placeholder or from project if available
            project: invoice.project_name || "-",
            invoiceDate: invoice.bill_date || invoice.invoice_date || "",
            dueDate: invoice.due_date || "",
            total: totalValue,
            paid: paidValue,
            unpaid: dueValue,
            status: statusValue,
            labels: parseLabels(invoice.labels),
            items: invoice.items || [],
            currency: invoice.currency || settings?.default_currency || "USD",
            custom_fields: invoice.custom_fields || {},
          };
        });
        setInvoices(transformedInvoices);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  }, [companyId, statusFilter, settings?.default_currency]);

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
    fetchInvoices();
    fetchProjects();
    fetchCustomFields();
  }, [fetchInvoices, fetchProjects]);

  const fetchCustomFields = async () => {
    try {
      const response = await customFieldsAPI.getAll({ company_id: companyId, module: "Invoices" });
      if (response.data.success) {
        setCustomFields(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching custom fields:", error);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem("invoiceLabels", JSON.stringify(labels));
    } catch (error) {
      console.warn("Failed to persist labels", error);
    }
  }, [labels]);

  useEffect(() => {
    setFilteredProjects(projects);
  }, [projects]);

  const generateInvoiceNumber = () => {
    const nextNum = invoices.length + 1;
    return `INV#${String(nextNum).padStart(3, "0")}`;
  };

  const resetForm = () => {
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 30);

    setFormData({
      invoiceNumber: generateInvoiceNumber(),
      billDate: today.toISOString().split("T")[0],
      dueDate: dueDate.toISOString().split("T")[0],
      project: "",
      currency: "USD",
      tax: "",
      taxRate: 0,
      secondTax: "",
      secondTaxRate: 0,
      tds: "",
      note: "",
      labels: [],
      isRecurring: true,
      repeatEvery: 1,
      repeatType: "Month",
      cycles: "",
      discount: 0,
      discountType: "%",
    });
    setInvoiceItems([]);
    setUploadedFile(null);
  };

  const handleSave = async () => {
    if (!formData.dueDate) {
      alert(t('common.due_date_required'));
      return;
    }

    try {
      const invoiceData = {
        company_id: companyId,
        user_id: userId,
        created_by: userId,
        invoice_number: formData.invoiceNumber || generateInvoiceNumber(),
        bill_date: formData.billDate,
        invoice_date: formData.billDate,
        due_date: formData.dueDate,

        project_id: formData.project ? parseInt(formData.project) : null,
        status: "Unpaid",
        currency: formData.currency,
        discount: formData.discount || 0,
        discount_type: formData.discountType || "%",
        note: formData.note || null,
        labels: formData.labels?.length ? formData.labels.join(", ") : null,
        tax: formData.tax || null,
        tax_rate: formData.taxRate || 0,
        second_tax: formData.secondTax || null,
        second_tax_rate: formData.secondTaxRate || 0,
        tds: formData.tds || null,
        is_recurring: formData.isRecurring ? 1 : 0,
        repeat_every: formData.isRecurring ? formData.repeatEvery : null,
        repeat_type: formData.isRecurring ? formData.repeatType : null,
        cycles: formData.isRecurring ? formData.cycles || null : null,
        items: invoiceItems.map((item) => ({
          item_name: item.itemName,
          description: item.description || null,
          quantity: item.quantity || 1,
          unit: item.unit || "Pcs",
          unit_price: item.unitPrice || 0,
          amount: item.amount || item.unitPrice * item.quantity,
        })),
        custom_fields: formData.custom_fields || {},
      };

      if (isEditModalOpen && selectedInvoice) {
        const response = await invoicesAPI.update(selectedInvoice.id, invoiceData);
        if (response.data.success) {
          alert(t('messages.saveSuccess'));
          await fetchInvoices();
          setIsEditModalOpen(false);
          setSelectedInvoice(null);
          resetForm();
        }
      } else {
        const response = await invoicesAPI.create(invoiceData);
        if (response.data.success) {
          alert(t('messages.saveSuccess'));
          await fetchInvoices();
          setIsAddModalOpen(false);
          resetForm();
          const createdId = response.data.data?.id || response.data.data?.invoice_id;
          if (createdId) {
            const path = user?.role === 'EMPLOYEE' ? `/app/employee/invoices/${createdId}` : `/app/admin/invoices/${createdId}`;
            navigate(path);
          }
        }
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert(error.response?.data?.error || "Rechnung konnte nicht gespeichert werden");
    }
  };

  const handleEdit = async (invoice) => {
    try {
      const response = await invoicesAPI.getById(invoice.id);
      if (response.data.success) {
        const data = response.data.data;
        setSelectedInvoice(invoice);
        setFormData({
          invoiceNumber: data.invoice_number || invoice.invoiceNumber,
          billDate: data.bill_date ? data.bill_date.split("T")[0] : "",
          dueDate: data.due_date ? data.due_date.split("T")[0] : "",
          project: data.project_id?.toString() || "",
          currency: data.currency || "USD",
          tax: data.tax || "",
          taxRate: data.tax_rate || 0,
          secondTax: data.second_tax || "",
          secondTaxRate: data.second_tax_rate || 0,
          tds: data.tds || "",
          note: data.note || "",
          labels: parseLabels(data.labels),
          isRecurring: data.is_recurring || false,
          repeatEvery: data.repeat_every || 1,
          repeatType: data.repeat_type || "Month",
          cycles: data.cycles || "",
          discount: data.discount || 0,
          discountType: data.discount_type || "%",
          custom_fields: data.custom_fields || {},
        });
        setInvoiceItems(data.items || []);
        setIsEditModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      alert("Rechnungsdetails konnten nicht geladen werden");
    }
  };

  const handleDelete = async (invoice) => {
    if (window.confirm(t('messages.confirmDelete', { item: invoice.invoiceNumber }))) {
      try {
        const response = await invoicesAPI.delete(invoice.id);
        if (response.data.success) {
          alert(t('messages.deleteSuccess'));
          await fetchInvoices();
        }
      } catch (error) {
        console.error("Error deleting invoice:", error);
        alert(error.response?.data?.error || "Rechnung konnte nicht gelöscht werden");
      }
    }
  };

  const handleView = (invoice) => {
    const path = user?.role === 'EMPLOYEE' ? `/app/employee/invoices/${invoice.id}` : `/app/admin/invoices/${invoice.id}`;
    navigate(path);
  };

  const handleCopy = async (invoice) => {
    try {
      const response = await invoicesAPI.getById(invoice.id);
      if (response.data.success) {
        const data = response.data.data;
        const copyData = {
          ...data,
          invoice_number: generateInvoiceNumber(),
          status: "Unpaid",
        };
        delete copyData.id;
        delete copyData.created_at;
        delete copyData.updated_at;

        const createResponse = await invoicesAPI.create(copyData);
        if (createResponse.data.success) {
          alert("Rechnung erfolgreich kopiert!");
          await fetchInvoices();
        }
      }
    } catch (error) {
      console.error("Error copying invoice:", error);
      alert("Rechnung konnte nicht kopiert werden");
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const tableHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>{t('auto.auto_ff11c641') || 'Invoices List'}</title>
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
          <h1>{t('Invoices')} ${t('common.list')}</h1>
          <table>
            <thead>
              <tr>
                 <th>{t('Invoices')}</th>
                 <th>{t('common.project')}</th>
                <th>{t('common.bill_date')}</th>
                <th>{t('common.due_date')}</th>
                <th>{t('common.total')}</th>
                <th>{t('common.payment_date')}</th>
                <th>{t('common.due_date')}</th>
                <th>{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredInvoices.map((inv) => `
                <tr>
                   <td>${inv.invoiceNumber}</td>
                   <td>${inv.project || ""}</td>
                  <td>${formatDate(inv.invoiceDate)}</td>
                  <td>${formatDate(inv.dueDate)}</td>
                  <td>${formatCurrency(inv.total, inv.currency)}</td>
                  <td>${formatCurrency(inv.paid, inv.currency)}</td>
                  <td>${formatCurrency(inv.unpaid, inv.currency)}</td>
                  <td>${inv.status}</td>
                </tr>
              `).join("")}
              <tr class="total-row">
                <td colspan="5" style="text-align: right;">{t('auto.auto_d8a0f53b') || 'Gesamt:'}</td>
                <td>${formatCurrency(filteredInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0), settings?.default_currency)}</td>
                <td colspan="3"></td>
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

  const handleExportExcel = () => {
    const csvData = filteredInvoices.map((inv) => ({
       "Invoice": inv.invoiceNumber,
       "Project": inv.project || "",
      "Bill date": formatDate(inv.invoiceDate),
      "Due date": formatDate(inv.dueDate),
      "Total invoiced": inv.total,
      "Payment received": inv.paid,
      "Due": inv.unpaid,
      "Status": inv.status,
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => headers.map((h) => `"${row[h] || ""}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `invoices_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const handleApplyFilters = () => {
    fetchInvoices();
  };

  const handleResetFilters = () => {
    setStatusFilter("All");
    setInvoiceFilter("All");
    setCurrencyFilter("All");
    setPeriodFilter("yearly");
    setSelectedYear(new Date().getFullYear());
    setSelectedMonth(new Date().getMonth() + 1);
    setCustomDateStart("");
    setCustomDateEnd("");
    setDynamicRange("30");
    setSearchQuery("");
    setShowFilterPanel(false);
    fetchInvoices();
  };

  const handleAddLabel = () => {
    if (!newLabelName.trim()) return;
    if (labels.some((l) => l.name.toLowerCase() === newLabelName.trim().toLowerCase())) {
      alert("Label existiert bereits");
      return;
    }
    setLabels([...labels, { name: newLabelName.trim(), color: newLabelColor }]);
    setNewLabelName("");
    setNewLabelColor(primaryColor);
  };

  const handleDeleteLabel = (labelName) => {
    if (!window.confirm(`Label "${labelName}" löschen?`)) return;
    setLabels(labels.filter((l) => l.name !== labelName));
  };

  const updateLabelAt = (index, updates) => {
    setLabels((prev) =>
      prev.map((label, idx) => (idx === index ? { ...label, ...updates } : label))
    );
  };

  const toggleLabelSelection = (labelName) => {
    setFormData((prev) => {
      const existing = prev.labels || [];
      if (existing.includes(labelName)) {
        return { ...prev, labels: existing.filter((label) => label !== labelName) };
      }
      return { ...prev, labels: [...existing, labelName] };
    });
  };

  const handleSavePayment = async () => {
    if (!paymentForm.invoiceId) {
      alert("Bitte wählen Sie eine Rechnung aus");
      return;
    }
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      alert("Zahlungsbetrag ist erforderlich");
      return;
    }
    try {
      const response = await paymentsAPI.create({
        company_id: companyId,
        invoice_id: parseInt(paymentForm.invoiceId),
        amount: parseFloat(paymentForm.amount),
        payment_date: paymentForm.paymentDate,
        payment_method: paymentForm.method,
        reference_note: paymentForm.note || null,
      });
      if (response.data.success) {
        alert("Zahlung erfolgreich hinzugefügt!");
        await fetchInvoices();
        setIsAddPaymentModalOpen(false);
        setPaymentForm({
          invoiceId: "",
          amount: "",
          paymentDate: new Date().toISOString().split("T")[0],
          method: "Cash",
          note: "",
        });
      }
    } catch (error) {
      console.error("Error saving payment:", error);
      alert(error.response?.data?.error || "Zahlung konnte nicht gespeichert werden");
    }
  };

  const parseLabels = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const hexToHsl = (hex) => {
    if (!hex) return { h: 210, s: 100, l: 45 };
    let clean = hex.replace("#", "").trim();
    if (clean.length === 3) {
      clean = clean.split("").map((c) => c + c).join("");
    }
    const num = parseInt(clean, 16);
    if (Number.isNaN(num)) return { h: 210, s: 100, l: 45 };
    const r = ((num >> 16) & 255) / 255;
    const g = ((num >> 8) & 255) / 255;
    const b = (num & 255) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    const d = max - min;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case r:
          h = ((g - b) / d) % 6;
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        default:
          h = (r - g) / d + 4;
      }
      h = Math.round(h * 60);
      if (h < 0) h += 360;
    }
    return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const hexToRgb = (hex) => {
    if (!hex) return { r: 33, g: 126, b: 69 };
    let clean = hex.replace("#", "").trim();
    if (clean.length === 3) {
      clean = clean.split("").map((c) => c + c).join("");
    }
    const num = parseInt(clean, 16);
    if (Number.isNaN(num)) return { r: 33, g: 126, b: 69 };
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  };

  const primaryColor = useMemo(() => {
    const fromSettings = settings?.primary_color;
    if (fromSettings) return fromSettings;
    if (typeof window !== "undefined") {
      const cssVar = getComputedStyle(document.documentElement)
        .getPropertyValue("--color-primary-accent")
        .trim();
      if (cssVar) return cssVar;
    }
    return "#217E45";
  }, [settings?.primary_color]);

  useEffect(() => {
    if (!newLabelColor) {
      setNewLabelColor(primaryColor);
    }
  }, [primaryColor, newLabelColor]);

  const getStatusStyle = (status) => {
    const base = hexToHsl(primaryColor);
    const s = status?.toLowerCase() || "";
    const hueOffsets = {
      paid: 0,
      "fully paid": 0,
      "partially paid": 25,
      unpaid: 55,
      "not paid": 55,
      overdue: 145,
    };
    if (s === "draft") {
      return {
        backgroundColor: `hsl(${base.h} 10% 92%)`,
        color: `hsl(${base.h} 20% 35%)`,
        borderColor: `hsl(${base.h} 15% 85%)`,
      };
    }
    const hue = (base.h + (hueOffsets[s] || 0)) % 360;
    return {
      backgroundColor: `hsl(${hue} ${Math.max(45, base.s)}% 90%)`,
      color: `hsl(${hue} ${Math.max(55, base.s)}% 35%)`,
      borderColor: `hsl(${hue} ${Math.max(45, base.s)}% 80%)`,
    };
  };

  const labelColorMap = useMemo(() => {
    const map = new Map();
    labels.forEach((label) => {
      map.set(label.name, label.color);
    });
    return map;
  }, [labels]);

  const getLabelStyle = (labelName) => {
    const color = labelColorMap.get(labelName) || primaryColor;
    const { r, g, b } = hexToRgb(color);
    return {
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.12)`,
      color,
      borderColor: `rgba(${r}, ${g}, ${b}, 0.35)`,
    };
  };

  const calculateInvoiceStatus = (invoice) => {
    const total = parseFloat(invoice.total || invoice.total_amount || 0);
    const paid = parseFloat(invoice.paid_amount || invoice.paid || 0);
    const due = Math.max(total - paid, 0);
    const dueDate = invoice.due_date || invoice.dueDate;
    if (!total) return "Draft";
    if (paid >= total) return "Paid";
    if (paid > 0 && paid < total) return "Partially Paid";
    if (dueDate) {
      const dueTime = new Date(dueDate).getTime();
      if (!Number.isNaN(dueTime) && dueTime < new Date().setHours(0, 0, 0, 0)) {
        return "Overdue";
      }
    }
    return "Not Paid";
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter((invoice) => {
    if (!invoice) return false;

    if (searchQuery && !invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    if (statusFilter !== "All" && invoice.status?.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }

    if (invoiceFilter !== "All") {
      if (String(invoice.id) !== String(invoiceFilter) && invoice.invoiceNumber !== invoiceFilter) {
        return false;
      }
    }

    if (currencyFilter !== "All" && invoice.currency !== currencyFilter) {
      return false;
    }



    const invoiceDate = invoice.invoiceDate ? new Date(invoice.invoiceDate) : null;

    if (periodFilter === "yearly" && invoiceDate) {
      if (invoiceDate.getFullYear() !== selectedYear) return false;
    }

    if (periodFilter === "monthly" && invoiceDate) {
      if (invoiceDate.getFullYear() !== selectedYear || invoiceDate.getMonth() + 1 !== selectedMonth) return false;
    }

    if (periodFilter === "custom" && invoiceDate) {
      if (customDateStart && invoiceDate < new Date(customDateStart)) return false;
      if (customDateEnd) {
        const endDate = new Date(customDateEnd);
        endDate.setHours(23, 59, 59, 999);
        if (invoiceDate > endDate) return false;
      }
    }

    if (periodFilter === "dynamic" && invoiceDate) {
      const days = parseInt(dynamicRange) || 30;
      const start = new Date();
      start.setDate(start.getDate() - days);
      if (invoiceDate < start) return false;
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  // Tax options
  const taxOptions = [
    { value: "", label: "-" },
    { value: "GST: 10%", label: "GST: 10%", rate: 10 },
    { value: "CGST: 18%", label: "CGST: 18%", rate: 18 },
    { value: "VAT: 10%", label: "VAT: 10%", rate: 10 },
  ];

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

  return (
    <div className="space-y-3 sm:space-y-4 bg-main-bg min-h-screen p-2 sm:p-4 text-primary-text">
      {/* Top Bar */}
      <div className="bg-card-bg rounded-lg shadow-soft border border-border-light overflow-visible">
        {/* Header with tabs and action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab("invoices")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${activeTab === "invoices"
                ? "bg-primary-accent text-white"
                : "text-secondary-text hover:bg-main-bg border border-border-light"
                }`}
            >
              {t('Invoices')}
            </button>
            <button
              onClick={() => setActiveTab("recurring")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${activeTab === "recurring"
                ? "bg-primary-accent text-white"
                : "text-secondary-text hover:bg-main-bg border border-border-light"
                }`}
            >
              {t('Recurring')}
            </button>
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setIsManageLabelsModalOpen(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs border border-border-light rounded-lg hover:bg-main-bg text-secondary-text whitespace-nowrap"
            >
              <IoPricetag size={13} /> <span className="hidden xs:inline">{t('common.labels')}</span>
            </button>
            <button
              onClick={() => setIsAddPaymentModalOpen(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs border border-border-light rounded-lg hover:bg-main-bg text-secondary-text whitespace-nowrap"
            >
              <IoCash size={13} /> <span className="hidden xs:inline">{t('common.add_payment')}</span>
            </button>
            <button
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary-accent text-white rounded-lg hover:opacity-90 whitespace-nowrap shadow-sm"
            >
              <IoAdd size={14} /> <span className="hidden xs:inline">{t('common.add')}</span> {t('Invoices')}
            </button>
          </div>
        </div>
        {/* Filter bar */}
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 sm:gap-3 border-t border-border-light px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilterPanel((prev) => !prev)}
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs border border-border-light rounded-lg hover:bg-main-bg text-secondary-text"
            >
              <IoFilter size={13} /> {t('common.filter')}
              {showFilterPanel ? <IoChevronUp size={13} /> : <IoChevronDown size={13} />}
            </button>
          </div>
          <div className="flex items-center gap-2 flex-1 xs:flex-initial justify-end">
            <button
              onClick={handleExportExcel}
              className="px-2 py-1.5 text-xs border border-border-light rounded-lg hover:bg-main-bg text-secondary-text hidden xs:block"
            >
              {t('common.export')}
            </button>
            <button
              onClick={handlePrint}
              className="px-2 py-1.5 text-xs border border-border-light rounded-lg hover:bg-main-bg text-secondary-text hidden xs:block"
            >
              {t('common.print')}
            </button>
            <div className="relative flex-1 xs:flex-initial max-w-[160px] sm:max-w-[180px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('common.search')}
                className="pl-8 pr-3 py-1.5 text-xs border border-border-light rounded-lg w-full focus:ring-2 focus:ring-primary-accent outline-none bg-input-bg text-primary-text"
              />
              <IoSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-text" size={13} />
            </div>
          </div>
        </div>
        {/* Filter Panel */}
        {showFilterPanel && (
          <div className="border-t border-border-light px-3 sm:px-4 py-3 sm:py-4 bg-main-bg/40 overflow-visible relative z-20">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              <div className="col-span-1">
                <label className="text-[10px] sm:text-xs font-semibold text-secondary-text uppercase tracking-wider">{t('Invoices')}</label>
                <select
                  value={invoiceFilter}
                  onChange={(e) => setInvoiceFilter(e.target.value)}
                  className="mt-1 w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-border-light rounded-lg bg-input-bg"
                >
                  <option value="All">{t('common.all')}</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>{inv.invoiceNumber}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-1">
                <label className="text-[10px] sm:text-xs font-semibold text-secondary-text uppercase tracking-wider">{t('common.status')}</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="mt-1 w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-border-light rounded-lg bg-input-bg"
                >
                  <option value="All">{t('common.all')}</option>
                  <option value="Paid">{t('invoices.paid')}</option>
                  <option value="Partially Paid">{t('invoices.partiallyPaid')}</option>
                  <option value="Not Paid">{t('invoices.notPaid')}</option>
                  <option value="Overdue">{t('invoices.overdue')}</option>
                  <option value="Draft">{t('invoices.draft')}</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="text-[10px] sm:text-xs font-semibold text-secondary-text uppercase tracking-wider">Währung</label>
                <select
                  value={currencyFilter}
                  onChange={(e) => setCurrencyFilter(e.target.value)}
                  className="mt-1 w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-border-light rounded-lg bg-input-bg"
                >
                  <option value="All">{t('auto.auto_2bca6161') || 'Alle'}</option>
                  {[...new Set(invoices.map((inv) => inv.currency))].map((code) => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[10px] sm:text-xs font-semibold text-secondary-text uppercase tracking-wider">{t('invoices.period') || 'Zeitraum'}</label>
                <div className="mt-1 flex flex-wrap gap-1 sm:gap-2">
                  {["monthly", "yearly", "custom", "dynamic"].map((period) => (
                    <button
                      key={period}
                      onClick={() => setPeriodFilter(period)}
                      className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded-md border ${periodFilter === period
                        ? "bg-primary-accent text-white border-transparent"
                        : "border-border-light text-secondary-text hover:bg-main-bg"
                        }`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1, 3)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-2 lg:col-span-2">
                <label className="text-[10px] sm:text-xs font-semibold text-secondary-text uppercase tracking-wider">{t('auto.auto_7d385bb3') || 'Datumsbereich'}</label>
                {periodFilter === "monthly" && (
                  <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-border-light rounded-lg bg-input-bg"
                    >
                      {Array.from({ length: 6 }, (_, idx) => new Date().getFullYear() - idx).map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-border-light rounded-lg bg-input-bg"
                    >
                      {Array.from({ length: 12 }, (_, idx) => idx + 1).map((month) => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>
                )}
                {periodFilter === "yearly" && (
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="mt-1 w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-border-light rounded-lg bg-input-bg"
                  >
                    {Array.from({ length: 6 }, (_, idx) => new Date().getFullYear() - idx).map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                )}
                {periodFilter === "custom" && (
                  <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={customDateStart}
                      onChange={(e) => setCustomDateStart(e.target.value)}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-border-light rounded-lg bg-input-bg"
                    />
                    <input
                      type="date"
                      value={customDateEnd}
                      onChange={(e) => setCustomDateEnd(e.target.value)}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-border-light rounded-lg bg-input-bg"
                    />
                  </div>
                )}
                {periodFilter === "dynamic" && (
                  <select
                    value={dynamicRange}
                    onChange={(e) => setDynamicRange(e.target.value)}
                    className="mt-1 w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-border-light rounded-lg bg-input-bg"
                  >
                    <option value="7">Letzte 7 Tage</option>
                    <option value="30">Letzte 30 Tage</option>
                    <option value="90">Letzte 90 Tage</option>
                  </select>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3 sm:mt-4">
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 text-xs border border-border-light rounded-lg text-secondary-text hover:bg-main-bg"
              >
                {t('common.reset')}
              </button>
              <button
                onClick={() => { handleApplyFilters(); setShowFilterPanel(false); }}
                className="px-3 py-1.5 text-xs bg-primary-accent text-white rounded-lg hover:opacity-90 shadow-sm"
              >
                {t('common.apply')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invoices Table */}
      <Card className="p-0 overflow-hidden bg-card-bg border border-border-light">
        {/* Desktop Table - hidden on mobile */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[900px] text-xs sm:text-sm">
            <thead className="bg-main-bg border-b border-border-light">
              <tr>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-secondary-text uppercase">{t('Invoices')}</th>

                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-secondary-text uppercase hidden lg:table-cell">{t('common.project')}</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-secondary-text uppercase">{t('common.bill_date')}</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-secondary-text uppercase">{t('common.due_date')}</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-secondary-text uppercase">{t('common.total')}</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-secondary-text uppercase hidden xl:table-cell">{t('invoices.paid')}</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-secondary-text uppercase">{t('common.balance')}</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-secondary-text uppercase">{t('common.status')}</th>
                {customFields.map((field) => (
                  <th key={field.id} className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-secondary-text uppercase min-w-[120px]">
                    {field.label}
                  </th>
                ))}
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-semibold text-secondary-text uppercase sticky right-0 bg-main-bg">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-card-bg divide-y divide-border-light">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-6 sm:py-8 text-center text-secondary-text text-sm">{t('common.loading')}</td>
                </tr>
              ) : paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-6 sm:py-8 text-center text-secondary-text text-sm">{t('common.no_data')}</td>
                </tr>
              ) : (
                paginatedInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-main-bg">
                    <td className="px-2 sm:px-4 py-2 sm:py-3 align-top">
                      <button onClick={() => handleView(invoice)} className="text-primary-accent hover:underline font-semibold text-xs sm:text-sm">
                        {invoice.invoiceNumber}
                      </button>
                      {invoice.labels?.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-0.5">
                          {invoice.labels.slice(0, 2).map((label) => (
                            <span
                              key={`${invoice.id}-${label}`}
                              className="px-1.5 py-0.5 text-[8px] sm:text-[10px] font-semibold rounded-full border"
                              style={getLabelStyle(label)}
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-secondary-text text-xs sm:text-sm hidden lg:table-cell truncate max-w-[100px]">{invoice.project || "-"}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-secondary-text text-xs sm:text-sm whitespace-nowrap">{formatDate(invoice.invoiceDate)}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-secondary-text text-xs sm:text-sm whitespace-nowrap">{formatDate(invoice.dueDate)}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-primary-text font-semibold text-xs sm:text-sm whitespace-nowrap">{formatCurrency(invoice.total, invoice.currency)}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-secondary-text text-xs sm:text-sm whitespace-nowrap hidden xl:table-cell">{formatCurrency(invoice.paid, invoice.currency)}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-secondary-text text-xs sm:text-sm whitespace-nowrap">{formatCurrency(invoice.unpaid, invoice.currency)}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border whitespace-nowrap" style={getStatusStyle(invoice.status)}>
                        {t('invoices.' + (() => {
                          const s = invoice.status?.toLowerCase().replace(/\s+/g, '') || 'unpaid';
                          const map = { partiallypaid: 'partiallyPaid', notpaid: 'unpaid', fullypaid: 'paid', unpaid: 'unpaid', paid: 'paid', overdue: 'overdue' };
                          return map[s] || s;
                        })())}
                      </span>
                    </td>
                    {customFields.map((field) => (
                      <td key={field.id} className="px-2 sm:px-4 py-2 sm:py-3 text-secondary-text text-xs sm:text-sm whitespace-nowrap">
                        {invoice.custom_fields?.[field.name] || '-'}
                      </td>
                    ))}
                    <td className="px-2 sm:px-4 py-2 sm:py-3 sticky right-0 bg-card-bg">
                      <div className="flex items-center justify-end gap-0.5">
                        <button onClick={() => handleCopy(invoice)} className="p-1 sm:p-1.5 text-secondary-text hover:bg-main-bg rounded" title={t('common.copy')}>
                          <IoCopy size={14} />
                        </button>
                        <button onClick={() => handleEdit(invoice)} className="p-1 sm:p-1.5 text-secondary-text hover:bg-main-bg rounded" title={t('common.edit')}>
                          <IoCreate size={14} />
                        </button>
                        <button onClick={() => handleDelete(invoice)} className="p-1 sm:p-1.5 text-secondary-text hover:bg-main-bg rounded" title={t('common.delete')}>
                          <IoClose size={14} />
                        </button>
                        <button onClick={() => handleView(invoice)} className="p-1 sm:p-1.5 text-secondary-text hover:bg-main-bg rounded" title={t('common.view')}>
                          <IoEllipsisVertical size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards - visible only on mobile */}
        <div className="md:hidden divide-y divide-border-light">
          {loading ? (
            <div className="p-6 text-center text-secondary-text">{t('common.loading')}</div>
          ) : paginatedInvoices.length === 0 ? (
            <div className="p-6 text-center text-secondary-text">{t('common.no_data')}</div>
          ) : (
            paginatedInvoices.map((invoice) => (
              <div
                key={`card-${invoice.id}`}
                className="p-3 space-y-2 active:bg-main-bg/50"
                onClick={() => handleView(invoice)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <button onClick={(e) => { e.stopPropagation(); handleView(invoice); }} className="text-primary-accent font-semibold text-sm">
                      {invoice.invoiceNumber}
                    </button>
                    <div className="text-xs text-secondary-text truncate mt-0.5">{invoice.client?.name}</div>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0" style={getStatusStyle(invoice.status)}>
                    {t('invoices.' + (() => {
                      const s = invoice.status?.toLowerCase().replace(/\s+/g, '') || 'draft';
                      const map = { partiallypaid: 'partiallyPaid', notpaid: 'notPaid', fullypaid: 'paid' };
                      return map[s] || s;
                    })())}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-secondary-text">
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-muted-text">{t('common.bill_date')}</span>
                    <span className="text-primary-text">{formatDate(invoice.invoiceDate)}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-muted-text">{t('common.due_date')}</span>
                    <span className="text-primary-text">{formatDate(invoice.dueDate)}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-muted-text">{t('common.total')}</span>
                    <span className="text-primary-text font-semibold">{formatCurrency(invoice.total, invoice.currency)}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-muted-text">{t('common.balance')}</span>
                    <span className="text-primary-text">{formatCurrency(invoice.unpaid, invoice.currency)}</span>
                  </div>
                </div>
                {/* Mobile action buttons */}
                <div className="flex items-center justify-end gap-1 pt-1 border-t border-border-light" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleCopy(invoice)} className="p-1.5 text-secondary-text hover:bg-main-bg rounded" title={t('common.copy')}>
                    <IoCopy size={14} />
                  </button>
                  <button onClick={() => handleEdit(invoice)} className="p-1.5 text-secondary-text hover:bg-main-bg rounded" title={t('common.edit')}>
                    <IoCreate size={14} />
                  </button>
                  <button onClick={() => handleDelete(invoice)} className="p-1.5 text-secondary-text hover:bg-main-bg rounded" title={t('common.delete')}>
                    <IoClose size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Pagination and Total */}
        <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-border-light flex flex-wrap items-center justify-between gap-2 sm:gap-3 bg-main-bg">
          <div className="flex items-center gap-2 sm:gap-4">
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
              className="px-1.5 sm:px-2 py-1 text-xs sm:text-sm border border-border-light rounded bg-input-bg"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-xs sm:text-sm text-secondary-text">
              {startIndex + 1}-{Math.min(endIndex, filteredInvoices.length)}/{filteredInvoices.length}
            </span>
          </div>
          <div className="text-xs sm:text-sm font-semibold text-primary-text hidden xs:block">
            Gesamt: {formatCurrency(totalAmount, settings?.default_currency)}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-1 sm:p-1.5 border border-border-light rounded ${currentPage === 1 ? 'text-muted-text cursor-not-allowed' : 'hover:bg-main-bg'}`}
            >
              <IoChevronBack size={14} />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`p-1 sm:p-1.5 border border-border-light rounded ${currentPage === totalPages || totalPages === 0 ? 'text-muted-text cursor-not-allowed' : 'hover:bg-main-bg'}`}
            >
              <IoChevronForward size={14} />
            </button>
          </div>
        </div>
      </Card>

      {/* Add/Edit Invoice Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedInvoice(null); resetForm(); }}
        title={isEditModalOpen ? t('invoices.editInvoice') : t('invoices.addInvoice')}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Bill date & Due date */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">{t('common.bill_date')}</label>
            <Input
              type="date"
              value={formData.billDate}
              onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
              className="flex-1"
            />
          </div>

          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">{t('common.due_date')}</label>
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="flex-1"
            />
          </div>



          {/* Project */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">{t('common.project')}</label>
            <select
              value={formData.project}
              onChange={(e) => setFormData({ ...formData, project: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
            >
              <option value="">{t('common.select_project')}</option>
              {filteredProjects.map((project) => (
                <option key={project.id} value={project.id}>{project.project_name || project.name}</option>
              ))}
            </select>
          </div>

          {/* TAX */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">{t('common.tax')}</label>
            <select
              value={formData.tax}
              onChange={(e) => {
                const t = taxOptions.find((o) => o.value === e.target.value);
                setFormData({ ...formData, tax: e.target.value, taxRate: t?.rate || 0 });
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
            >
              {taxOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
          </div>

          {/* Second TAX */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">{t('common.second_tax')}</label>
            <select
              value={formData.secondTax}
              onChange={(e) => {
                const tOpt = taxOptions.find((o) => o.value === e.target.value);
                setFormData({ ...formData, secondTax: e.target.value, secondTaxRate: tOpt?.rate || 0 });
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
            >
              {taxOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
          </div>

          {/* TDS */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">{t('common.tds')}</label>
            <select
              value={formData.tds}
              onChange={(e) => setFormData({ ...formData, tds: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
            >
              <option value="">-</option>
              <option value="TDS 1%">TDS 1%</option>
              <option value="TDS 2%">TDS 2%</option>
              <option value="TDS 5%">TDS 5%</option>
            </select>
          </div>

          {/* Recurring Section */}
          <div className="flex items-start">
            <label className="w-32 text-sm font-medium text-gray-700 pt-2">{t('common.recurring')}</label>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-600">{t('common.enable_recurring')}</span>
              </div>
              {formData.isRecurring && (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-gray-600">{t('common.repeat_every')}:</span>
                  <input
                    type="number"
                    min="1"
                    value={formData.repeatEvery}
                    onChange={(e) => setFormData({ ...formData, repeatEvery: parseInt(e.target.value) || 1 })}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <select
                    value={formData.repeatType}
                    onChange={(e) => setFormData({ ...formData, repeatType: e.target.value })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="Day">{t('common.days')}</option>
                    <option value="Week">{t('common.weeks')}</option>
                    <option value="Month">{t('common.months')}</option>
                    <option value="Year">{t('common.years')}</option>
                  </select>
                  <span className="text-sm text-gray-600">{t('common.cycles')}:</span>
                  <input
                    type="number"
                    placeholder="∞"
                    value={formData.cycles}
                    onChange={(e) => setFormData({ ...formData, cycles: e.target.value })}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <IoHelpCircle className="text-gray-400" size={16} title="Leer lassen für unbegrenzte Zyklen" />
                </div>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="flex items-start">
            <label className="w-32 text-sm font-medium text-gray-700 pt-2">{t('common.note')}</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder={t('common.add_note')}
              rows={3}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none resize-none"
            />
          </div>

          {/* Labels */}
          <div className="flex items-start">
            <label className="w-32 text-sm font-medium text-secondary-text pt-2">{t('common.labels')}</label>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => {
                  const selected = formData.labels.includes(label.name);
                  return (
                    <button
                      key={label.name}
                      type="button"
                      onClick={() => toggleLabelSelection(label.name)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${selected ? "shadow-sm" : "opacity-70 hover:opacity-100"
                        }`}
                      style={getLabelStyle(label.name)}
                    >
                      {label.name}
                    </button>
                  );
                })}
              </div>
              {formData.labels.length === 0 && (
                <p className="text-xs text-muted-text mt-2">{t('common.select_labels_hint')}</p>
              )}
            </div>
          </div>

          {/* File Upload */}
          <div className="flex items-start">
            <label className="w-32 text-sm font-medium text-secondary-text pt-2">{t('common.file_upload')}</label>
            <div className="flex-1">
              <input
                type="file"
                onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-border-light rounded-lg bg-input-bg text-sm"
              />
              {uploadedFile && (
                <p className="text-xs text-secondary-text mt-2">Ausgewählt: {uploadedFile.name}</p>
              )}
            </div>
          </div>

          {/* Custom Fields Section */}
          <div className="mt-4">
            <CustomFieldsSection
              module="Invoices"
              companyId={companyId}
              values={formData.custom_fields || {}}
              onChange={(name, value) => setFormData(prev => ({ ...prev, custom_fields: { ...prev.custom_fields, [name]: value } }))}
            />
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end pt-4 border-t border-border-light gap-3">
            <Button
              variant="outline"
              onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedInvoice(null); resetForm(); }}
            >
              {t('common.close')}
            </Button>
            <Button onClick={handleSave} className="bg-primary-accent hover:opacity-90 text-white">
              <IoCheckmark size={18} className="mr-1" /> {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Payment Modal */}
      <Modal
        isOpen={isAddPaymentModalOpen}
        onClose={() => setIsAddPaymentModalOpen(false)}
        title={t('common.add_payment')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.select_invoice')}</label>
            <select
              value={paymentForm.invoiceId}
              onChange={(e) => setPaymentForm({ ...paymentForm, invoiceId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
            >
              <option value="">{t('common.select_invoice')}</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>{inv.invoiceNumber}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.amount')}</label>
            <Input
              type="number"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.payment_date')}</label>
            <Input
              type="date"
              value={paymentForm.paymentDate}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.method')}</label>
            <select
              value={paymentForm.method}
              onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
            >
              <option value="Cash">{t('auto.auto_ddc35f88') || 'Bar'}</option>
              <option value="Bank Transfer">Banküberweisung</option>
              <option value="Check">{t('invoices.method.check') || 'Scheck'}</option>
              <option value="Online">{t('invoices.method.online') || 'Online'}</option>
              <option value="Other">{t('common.other') || 'Sonstiges'}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.note')}</label>
            <textarea
              value={paymentForm.note}
              onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm"
              placeholder={t('common.add_note')}
            />
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button variant="outline" onClick={() => setIsAddPaymentModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSavePayment}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Manage Labels Modal */}
      <Modal isOpen={isManageLabelsModalOpen} onClose={() => setIsManageLabelsModalOpen(false)} title={t('common.manage_labels')}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input value={newLabelName} onChange={(e) => setNewLabelName(e.target.value)} placeholder={t('common.label_name')} />
            </div>
            <ColorPicker value={newLabelColor} onChange={setNewLabelColor} />
            <Button onClick={handleAddLabel} className="bg-primary-accent hover:opacity-90 text-white">
              <IoAdd size={18} /> {t('common.add')}
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {labels.map((label, index) => (
              <div key={`${label.name}-${index}`} className="flex items-center gap-3 p-3 bg-main-bg rounded-lg border border-border-light">
                <input
                  value={label.name}
                  onChange={(e) => updateLabelAt(index, { name: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border border-border-light rounded-lg bg-input-bg"
                />
                <ColorPicker
                  value={label.color}
                  onChange={(color) => updateLabelAt(index, { color })}
                />
                <button onClick={() => handleDeleteLabel(label.name)} className="p-2 text-secondary-text hover:bg-main-bg rounded">
                  <IoTrash size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-border-light">
            <Button variant="outline" onClick={() => setIsManageLabelsModalOpen(false)}>{t('common.close')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Invoices;
