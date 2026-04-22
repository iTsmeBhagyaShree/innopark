import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import AddButton from "../../../components/ui/AddButton";
import CustomFieldsSection from "../../../components/ui/CustomFieldsSection";
import {
  contractsAPI,
  projectsAPI,
  leadsAPI,
  itemsAPI,
  customFieldsAPI,
} from "../../../api";
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
  IoTrash,
  IoCreate,
  IoEye,
  IoPrint,
  IoGrid,
  IoCheckmark,
  IoChevronBack,
  IoChevronForward,
  IoDocumentText,
  IoCopy,
  IoAttach,
  IoMic,
} from "react-icons/io5";
import { useLanguage } from "../../../context/LanguageContext.jsx";

const Contracts = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const companyId = parseInt(localStorage.getItem("companyId") || 1, 10);
  const userId = parseInt(localStorage.getItem("userId") || 1, 10);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Data states
  const [contracts, setContracts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState(null);
  const [catalogItems, setCatalogItems] = useState([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [periodFilter, setPeriodFilter] = useState("yearly");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [customDateStart, setCustomDateStart] = useState("");
  const [customDateEnd, setCustomDateEnd] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    contract_date: new Date().toISOString().split("T")[0],
    valid_until: "",
    project_id: "",
    tax: "",
    second_tax: "",
    note: "",
    amount: 0,
    status: "Draft",
    items: [],
    custom_fields: {},
  });

  // Calculate totals helper
  const calculateTotals = (items) => {
    return items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  const handleAddItem = () => {
    const newItem = {
      item_name: "",
      description: "",
      quantity: 1,
      unit: "Pcs",
      unit_price: 0,
      amount: 0,
    };
    setFormData((prev) => {
      const updatedItems = [...(prev.items || []), newItem];
      return {
        ...prev,
        items: updatedItems,
        amount: calculateTotals(updatedItems),
      };
    });
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => {
      const updatedItems = [...prev.items];
      updatedItems.splice(index, 1);
      return {
        ...prev,
        items: updatedItems,
        amount: calculateTotals(updatedItems),
      };
    });
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedItems = [...prev.items];
      const item = { ...updatedItems[index], [field]: value };

      // Auto-calculate amount
      if (field === "quantity" || field === "unit_price") {
        const qty = parseFloat(field === "quantity" ? value : item.quantity) || 0;
        const price = parseFloat(field === "unit_price" ? value : item.unit_price) || 0;
        item.amount = qty * price;
      }

      updatedItems[index] = item;
      return {
        ...prev,
        items: updatedItems,
        amount: calculateTotals(updatedItems),
      };
    });
  };

  // Status options
  const statusOptions = ["Draft", "Sent", "Accepted", "Declined", "Expired"];

  // Tax options
  const taxOptions = [
    { value: "", label: "-" },
    { value: "GST: 10%", label: "GST: 10%", rate: 10 },
    { value: "CGST: 18%", label: "CGST: 18%", rate: 18 },
    { value: "VAT: 10%", label: "VAT: 10%", rate: 10 },
  ];

  // Month names
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Fetch functions
  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      const params = { company_id: companyId };
      const response = await contractsAPI.getAll(params);
      if (response.data.success) {
        const fetchedContracts = response.data.data || [];
        const transformedContracts = fetchedContracts.map((contract) => {
          const contractNum = contract.contract_number || `CONTRACT #${contract.id}`;
          return {
            id: contract.id,
            contractNumber: contractNum,
            title: contract.title || contract.subject || "-",
            project_name: contract.project_name || "-",
            contract_date: contract.contract_date || contract.start_date || "",
            valid_until: contract.valid_until || contract.end_date || "",
            amount: parseFloat(contract.amount || contract.total || 0),
            status: contract.status || "Draft",
            note: contract.note || contract.description || "",
            items: contract.items || [],
          };
        });
        setContracts(transformedContracts);
      }
    } catch (error) {
      console.error("Error fetching contracts:", error);
    } finally {
      setLoading(false);
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

  const fetchCatalogItems = useCallback(async () => {
    try {
      const response = await itemsAPI.getAll({ company_id: companyId });
      if (response.data.success) {
        setCatalogItems(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching catalog items:", error);
      setCatalogItems([]);
    }
  }, [companyId]);

  useEffect(() => {
    fetchContracts();
    fetchProjects();
    fetchCatalogItems();
  }, [fetchContracts, fetchProjects, fetchCatalogItems]);

  useEffect(() => {
    setFilteredProjects(projects);
  }, [projects]);

  // Reset form
  const resetForm = () => {
    const today = new Date();
    const validUntil = new Date(today);
    validUntil.setMonth(validUntil.getMonth() + 1);

    setFormData({
      title: "",
      contract_date: today.toISOString().split("T")[0],
      valid_until: validUntil.toISOString().split("T")[0],
      project_id: "",
      tax: "",
      second_tax: "",
      note: "",
      amount: 0,
      status: "Draft",
      items: [],
    });
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.title) {
      alert("Titel ist erforderlich");
      return;
    }
    // Validations (e.g., project_id if needed)

    try {
      const contractData = {
        company_id: companyId,
        user_id: userId,
        created_by: userId,
        title: formData.title,
        subject: formData.title,
        contract_date: formData.contract_date,
        start_date: formData.contract_date,
        valid_until: formData.valid_until,
        end_date: formData.valid_until,

        lead_id: 0,
        project_id: formData.project_id ? parseInt(formData.project_id) : null,
        tax: formData.tax || null,
        second_tax: formData.second_tax || null,
        note: formData.note || null,
        description: formData.note || null,
        amount: formData.amount || 0,
        status: formData.status || "Draft",
        items: formData.items || [],
      };

      if (isEditModalOpen && selectedContract) {
        const response = await contractsAPI.update(selectedContract.id, contractData, { company_id: companyId });
        if (response.data.success) {
          alert("Vertrag erfolgreich aktualisiert!");
          await fetchContracts();
          setIsEditModalOpen(false);
          setSelectedContract(null);
          resetForm();
        }
      } else {
        const response = await contractsAPI.create(contractData);
        if (response.data.success) {
          alert("Vertrag erfolgreich erstellt!");
          await fetchContracts();
          setIsAddModalOpen(false);
          resetForm();
        }
      }
    } catch (error) {
      console.error("Error saving contract:", error);
      alert(error.response?.data?.error || "Vertrag konnte nicht gespeichert werden");
    }
  };

  // Handle edit
  const handleEdit = async (contract) => {
    try {
      const response = await contractsAPI.getById(contract.id, { company_id: companyId });
      if (response.data.success) {
        const data = response.data.data;
        setSelectedContract(contract);
        setFormData({
          title: data.title || data.subject || "",
          contract_date: data.contract_date ? data.contract_date.split("T")[0] : "",
          valid_until: data.valid_until ? data.valid_until.split("T")[0] : "",
          project_id: data.project_id?.toString() || "",
          tax: data.tax || "",
          second_tax: data.second_tax || "",
          note: data.note || data.description || "",
          amount: data.amount || data.total || 0,
          status: data.status || "Draft",
          items: data.items || [],
        });
        setIsEditModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching contract:", error);
      alert("Vertragsdetails konnten nicht geladen werden");
    }
  };

  // Handle delete
  const handleDelete = async (contract) => {
    if (window.confirm(`Are you sure you want to delete ${contract.contractNumber}?`)) {
      try {
        const response = await contractsAPI.delete(contract.id, { company_id: companyId });
        if (response.data.success) {
          alert("Vertrag erfolgreich gelöscht!");
          await fetchContracts();
        }
      } catch (error) {
        console.error("Error deleting contract:", error);
        alert(error.response?.data?.error || "Vertrag konnte nicht gelöscht werden");
      }
    }
  };

  // Handle view
  const handleView = (contract) => {
    navigate(`/app/admin/contracts/${contract.id}`);
  };

  // Handle copy
  const handleCopy = async (contract) => {
    try {
      const response = await contractsAPI.getById(contract.id, { company_id: companyId });
      if (response.data.success) {
        const data = response.data.data;
        const copyData = {
          ...data,
          title: `${data.title || data.subject} (Copy)`,
          status: "Draft",
        };
        delete copyData.id;
        delete copyData.created_at;
        delete copyData.updated_at;
        copyData.company_id = companyId;

        const createResponse = await contractsAPI.create(copyData);
        if (createResponse.data.success) {
          alert("Vertrag erfolgreich kopiert!");
          await fetchContracts();
        }
      }
    } catch (error) {
      console.error("Error copying contract:", error);
      alert("Vertrag konnte nicht kopiert werden");
    }
  };

  // Handle print
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const tableHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>$$" + (t('auto.auto_142948a0') || "Contracts List") + "</title>
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
          <h1>{t('') || ''}</h1>
          <table>
            <thead>
              <tr>
                <th>{t('auto.auto_f4949814') || 'Contract'}</th>
                <th>{t('') || ''}</th>

                <th>{t('auto.auto_9e727fdd') || 'Project'}</th>
                <th>{t('') || ''}</th>
                <th>{t('auto.auto_b2844b8e') || 'Valid until'}</th>
                <th>{t('') || ''}</th>
                <th>{t('auto.auto_ec53a8c4') || 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredContracts.map((contract) => `
                <tr>
                  <td>${contract.contractNumber}</td>
                  <td>${contract.title}</td>

                  <td>${contract.project_name || "-"}</td>
                  <td>${formatDate(contract.contract_date)}</td>
                  <td>${formatDate(contract.valid_until)}</td>
                  <td>€${parseFloat(contract.amount || 0).toFixed(2)}</td>
                  <td>${contract.status}</td>
                </tr>
              `).join("")}
              <tr class="total-row">
                <td colspan="6" style="text-align: right;">{t('auto.auto_66c4c511') || 'Total:'}</td>
                <td>€${totalAmount.toFixed(2)}</td>
                <td></td>
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
    const csvData = filteredContracts.map((contract) => ({
      "Contract": contract.contractNumber,
      "Title": contract.title,

      "Project": contract.project_name || "-",
      "Contract date": formatDate(contract.contract_date),
      "Valid until": formatDate(contract.valid_until),
      "Amount": contract.amount,
      "Status": contract.status,
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => headers.map((h) => `"${row[h] || ""}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `contracts_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // Filter handlers
  const handleApplyFilters = () => {
    fetchContracts();
  };

  const handleResetFilters = () => {
    setStatusFilter("All");
    setPeriodFilter("yearly");
    setSelectedYear(new Date().getFullYear());
    setSelectedMonth(new Date().getMonth() + 1);
    setCustomDateStart("");
    setCustomDateEnd("");
    setSearchQuery("");
    setShowFilterPanel(false);
    fetchContracts();
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

  // Status styles
  const getStatusStyle = (status) => {
    const s = status?.toLowerCase() || "";
    switch (s) {
      case "accepted":
        return "bg-blue-500 text-white";
      case "sent":
        return "bg-sky-400 text-white";
      case "draft":
        return "bg-gray-500 text-white";
      case "declined":
        return "bg-red-500 text-white";
      case "expired":
        return "bg-orange-500 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  // Filtered contracts
  const filteredContracts = contracts.filter((contract) => {
    if (!contract) return false;

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      if (
        !contract.contractNumber?.toLowerCase().includes(searchLower) &&
        !contract.title?.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== "All" && contract.status?.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }

    // Date filters
    const contractDate = contract.contract_date ? new Date(contract.contract_date) : null;

    if (periodFilter === "monthly" && contractDate) {
      if (contractDate.getFullYear() !== selectedYear || contractDate.getMonth() + 1 !== selectedMonth) {
        return false;
      }
    }

    if (periodFilter === "yearly" && contractDate) {
      if (contractDate.getFullYear() !== selectedYear) {
        return false;
      }
    }

    if (customDateStart && contractDate) {
      if (contractDate < new Date(customDateStart)) return false;
    }

    if (customDateEnd && contractDate) {
      const endDate = new Date(customDateEnd);
      endDate.setHours(23, 59, 59, 999);
      if (contractDate > endDate) return false;
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContracts = filteredContracts.slice(startIndex, endIndex);

  // Total amount
  const totalAmount = filteredContracts.reduce((sum, contract) => sum + (parseFloat(contract.amount) || 0), 0);

  return (
    <div className="space-y-4 bg-gray-100 min-h-screen p-4">
      {/* Top Navigation */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between p-4">
          {/* Left Side - Title */}
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <IoDocumentText className="text-gray-600" size={24} />
            Verträge
          </h1>

          {/* Right Side - Add Button */}
          <AddButton
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            label="+ Vertrag hinzufügen"
            className="bg-green-500 hover:bg-green-600"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left Side */}
          <div className="flex items-center gap-3">
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <IoGrid size={18} className="text-gray-500" />
            </button>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs border rounded-lg transition-colors ${showFilterPanel ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-300 hover:bg-gray-50 text-gray-600"
                }`}
            >
              <IoAdd size={14} />
              + Neuen Filter hinzufügen
            </button>
          </div>

          {/* Right Side - Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Dropdown */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none px-3 py-1.5 pr-8 text-xs border border-gray-300 rounded-lg outline-none bg-white"
              >
                <option value="All">- Status -</option>

                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <IoChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>

            {/* Period Buttons */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {["monthly", "yearly", "custom", "dynamic"].map((period) => (
                <button
                  key={period}
                  onClick={() => setPeriodFilter(period)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${periodFilter === period ? "bg-white shadow text-gray-800" : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>

            {/* Year Selector */}
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden h-8">
              <button
                onClick={() => setSelectedYear(y => y - 1)}
                className="px-2 py-1.5 hover:bg-gray-100 border-r border-gray-300"
              >
                <IoChevronBack size={14} />
              </button>
              <span className="px-3 py-1.5 text-xs font-medium min-w-[60px] text-center">
                {selectedYear}
              </span>
              <button
                onClick={() => setSelectedYear(y => y + 1)}
                className="px-2 py-1.5 hover:bg-gray-100 border-l border-gray-300"
              >
                <IoChevronForward size={14} />
              </button>
            </div>

            {/* Apply & Reset Buttons */}
            <button onClick={handleApplyFilters} className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600" title={t('common.apply_filters')}>
              <IoCheckmark size={16} />
            </button>
            <button onClick={handleResetFilters} className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600" title={t('common.reset_filters')}>
              <IoClose size={16} />
            </button>
          </div>
        </div>

        {/* Expandable Filter Panel */}
        {showFilterPanel && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auto.auto_4474fbc0') || 'Suchen'}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={t('common.search') || 'Suchen...'}
                  />
                  <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={() => { setCustomDateStart(""); setCustomDateEnd(""); setSearchQuery(""); }}
                  className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Löschen
                </button>
                <button
                  onClick={() => { handleApplyFilters(); setShowFilterPanel(false); }}
                  className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Anwenden
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contracts Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('') || ''}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('') || ''}</th>

                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('') || ''}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('') || ''}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Gültig bis</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('') || ''}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('') || ''}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">Verträge werden geladen...</td>
                </tr>
              ) : paginatedContracts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">Keine Verträge gefunden</td>
                </tr>
              ) : (
                paginatedContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleView(contract)}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        {contract.contractNumber}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-gray-700 max-w-xs truncate" title={contract.title}>
                      {contract.title}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                      {contract.project_name || "-"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                      {formatDate(contract.contract_date)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                      {formatDate(contract.valid_until)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-800 font-medium">
                      {formatCurrency(contract.amount)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(contract.status)}`}>
                        {contract.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleCopy(contract)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title={t('common.copy')}>
                          <IoCopy size={16} />
                        </button>
                        <button onClick={() => handleEdit(contract)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title={t('common.edit')}>
                          <IoCreate size={16} />
                        </button>
                        <button onClick={() => handleDelete(contract)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title={t('common.delete')}>
                          <IoClose size={16} />
                        </button>
                        <button onClick={() => handleView(contract)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title={t('common.more')}>
                          <IoEllipsisVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with Pagination and Total */}
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
              {filteredContracts.length > 0 ? `${startIndex + 1}-${Math.min(endIndex, filteredContracts.length)}` : "0"} / {filteredContracts.length}
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

      {/* Add/Edit Contract Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedContract(null); resetForm(); }}
        title={isEditModalOpen ? "Vertrag bearbeiten" : "Vertrag hinzufügen"}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Title */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">{t('auto.auto_18a80225') || 'Titel'}</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="flex-1"
            />
          </div>

          {/* Contract Date */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">{t('common.date') || 'Datum'}</label>
            <Input
              type="date"
              value={formData.contract_date}
              onChange={(e) => setFormData({ ...formData, contract_date: e.target.value })}
              className="flex-1"
            />
          </div>
          {/* Valid until */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">Gültig bis</label>
            <Input
              type="date"
              value={formData.valid_until}
              onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              className="flex-1"
            />
          </div>

          {/* Client/Lead */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">Kunde/Lead</label>
            <select
              value={formData.client_id || formData.lead_id}
              onChange={(e) => {
                const value = e.target.value;
                const isLead = value.startsWith("lead_");
                if (isLead) {
                  setFormData({ ...formData, lead_id: value.replace("lead_", ""), client_id: "", project_id: "" });
                } else {
                  setFormData({ ...formData, client_id: value, lead_id: "", project_id: "" });
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
            >
              <option value="">Kunde oder Lead auswählen</option>
              <optgroup label="Clients">
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.client_name || client.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Leads">
                {leads.map((lead) => (
                  <option key={`lead_${lead.id}`} value={`lead_${lead.id}`}>
                    {lead.name || lead.company_name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Project */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">{t('') || ''}</label>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
              disabled={!formData.client_id}
            >
              <option value="">Projekt auswählen</option>
              {filteredProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.project_name || project.name}
                </option>
              ))}
            </select>
          </div>

          {/* TAX */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">{t('') || ''}</label>
            <select
              value={formData.tax}
              onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
            >
              {taxOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Second TAX */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">{t('') || ''}</label>
            <select
              value={formData.second_tax}
              onChange={(e) => setFormData({ ...formData, second_tax: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
            >
              {taxOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div className="flex items-start">
            <label className="w-32 text-sm font-medium text-gray-700 pt-2">{t('') || ''}</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Notiz hinzufügen..."
              rows={3}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none resize-none"
            />
          </div>

          {/* Items Section */}
          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Vertragspositionen
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <IoAdd size={16} />
                Position hinzufügen
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg mb-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left w-1/4">{t('') || ''}</th>
                    <th className="px-3 py-2 text-left w-1/3">{t('') || ''}</th>
                    <th className="px-3 py-2 text-right w-20">{t('') || ''}</th>
                    <th className="px-3 py-2 text-right w-24">{t('') || ''}</th>
                    <th className="px-3 py-2 text-right w-24">{t('') || ''}</th>
                    <th className="px-3 py-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {formData.items && formData.items.map((item, index) => (
                    <tr key={index}>
                      <td className="p-2 align-top">
                        <select
                          value={item.item_name}
                          onChange={(e) => {
                            const selectedItem = catalogItems.find((ci) => ci.title === e.target.value);
                            if (selectedItem) {
                              const updatedItems = [...formData.items];
                              updatedItems[index] = {
                                ...updatedItems[index],
                                item_name: selectedItem.title,
                                description: selectedItem.description || "",
                                unit_price: parseFloat(selectedItem.rate) || 0,
                                unit: selectedItem.unit_type || "",
                                amount: (updatedItems[index].quantity || 1) * (parseFloat(selectedItem.rate) || 0),
                              };
                              setFormData({
                                ...formData,
                                items: updatedItems,
                                amount: calculateTotals(updatedItems),
                              });
                            } else {
                              handleItemChange(index, "item_name", e.target.value);
                            }
                          }}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                        >
                          <option value="">-- Artikel auswählen --</option>
                          {catalogItems.map((ci) => (
                            <option key={ci.id} value={ci.title}>{ci.title}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 align-top">
                        <textarea
                          value={item.description}
                          onChange={(e) => setItem({ ...item, description: e.target.value })}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none resize-y"
                        />
                      </td>
                      <td className="p-2 align-top">
                        <input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-right"
                        />
                      </td>
                      <td className="p-2 align-top">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, "unit_price", e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-right"
                        />
                      </td>
                      <td className="p-2 align-top text-right font-medium pt-3">
                        {parseFloat(item.amount || 0).toFixed(2)}
                      </td>
                      <td className="p-2 align-top text-center pt-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <IoTrash size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!formData.items || formData.items.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500 italic">
                        Noch keine Positionen hinzugefügt. Klicken Sie auf "Position hinzufügen".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mb-4">
              <div className="w-64 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center text-lg font-bold text-gray-800">
                  <span>" + (t('auto.auto_d8a0f53b') || "Gesamt:") + "</span>
                  <span>${formData.amount ? parseFloat(formData.amount).toFixed(2) : "0.00"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Fields Section */}
          <div className="mt-4">
            <CustomFieldsSection
              module="Contracts"
              companyId={companyId}
              values={formData.custom_fields || {}}
              onChange={(name, value) => setFormData(prev => ({ ...prev, custom_fields: { ...prev.custom_fields, [name]: value } }))}
            />
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                <IoAttach size={16} /> Datei hochladen
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                <IoMic size={16} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedContract(null); resetForm(); }}
              >
                Schließen
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                <IoCheckmark size={18} className="mr-1" /> Speichern
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Contracts;
