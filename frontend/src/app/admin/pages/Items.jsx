import { useState, useEffect } from 'react'
import AddButton from '../../../components/ui/AddButton'
import Modal from '../../../components/ui/Modal'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import { itemsAPI } from '../../../api'
import { 
  IoAdd,
  IoClose,
  IoSearch,
  IoFilter,
  IoDownload,
  IoTrash,
  IoCreate,
  IoCloudUpload,
  IoCamera,
  IoCheckmark,
  IoPrint,
  IoDocumentText,
  IoEye,
} from 'react-icons/io5'

const Items = () => {
  const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [categories, setCategories] = useState([])
  const [imagePreview, setImagePreview] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    unit_type: '',
    rate: '',
    show_in_client_portal: false,
    image: null,
  })

  useEffect(() => {
    fetchItems()
  }, [categoryFilter])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const params = { company_id: companyId }
      if (categoryFilter !== 'All') {
        params.category = categoryFilter
      }
      const response = await itemsAPI.getAll(params)
      if (response.data.success) {
        setItems(response.data.data || [])
        // Extract unique categories
        const uniqueCategories = [...new Set((response.data.data || []).map(item => item.category).filter(Boolean))]
        setCategories(uniqueCategories)
      }
    } catch (error) {
      console.error('Error fetching items:', error)
      alert(error.response?.data?.error || 'Failed to fetch items')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const submitData = new FormData()
      submitData.append('company_id', companyId)
      submitData.append('title', formData.title)
      submitData.append('description', formData.description)
      submitData.append('category', formData.category)
      submitData.append('unit_type', formData.unit_type)
      submitData.append('rate', formData.rate)
      submitData.append('show_in_client_portal', formData.show_in_client_portal ? 1 : 0)
      if (formData.image) {
        submitData.append('image', formData.image)
      }

      let response
      if (isEditModalOpen && selectedItem) {
        response = await itemsAPI.update(selectedItem.id, submitData, { company_id: companyId })
      } else {
        response = await itemsAPI.create(submitData)
      }

      if (response.data.success) {
        alert(isEditModalOpen ? 'Item updated successfully!' : 'Item created successfully!')
        resetForm()
        setIsAddModalOpen(false)
        setIsEditModalOpen(false)
        fetchItems()
      } else {
        alert(response.data.error || 'Failed to save item')
      }
    } catch (error) {
      console.error('Error saving item:', error)
      alert(error.response?.data?.error || 'Failed to save item')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const response = await itemsAPI.delete(id, { company_id: companyId })
        if (response.data.success) {
          alert('Item deleted successfully!')
          fetchItems()
        } else {
          alert(response.data.error || 'Failed to delete item')
        }
      } catch (error) {
        console.error('Error deleting item:', error)
        alert(error.response?.data?.error || 'Failed to delete item')
      }
    }
  }

  const handleEdit = (item) => {
    setSelectedItem(item)
    setFormData({
      title: item.title || '',
      description: item.description || '',
      category: item.category || '',
      unit_type: item.unit_type || '',
      rate: item.rate || '',
      show_in_client_portal: item.show_in_client_portal || false,
      image: null,
    })
    setImagePreview(item.image_url || null)
    setIsEditModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      unit_type: '',
      rate: '',
      show_in_client_portal: false,
      image: null,
    })
    setImagePreview(null)
    setSelectedItem(null)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({ ...formData, image: file })
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  // Excel Export Function
  const handleExportExcel = () => {
    if (filteredItems.length === 0) {
      alert('No items to export')
      return
    }

    // Create CSV content
    const headers = ['ID', 'Title', 'Description', 'Category', 'Unit Type', 'Rate', 'Show in Client Portal']
    const csvContent = [
      headers.join(','),
      ...filteredItems.map(item => [
        item.id,
        `"${(item.title || '').replace(/"/g, '""')}"`,
        `"${(item.description || '').replace(/"/g, '""')}"`,
        `"${(item.category || '').replace(/"/g, '""')}"`,
        `"${(item.unit_type || '').replace(/"/g, '""')}"`,
        item.rate || 0,
        item.show_in_client_portal ? 'Yes' : 'No'
      ].join(','))
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `items_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Print Function
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Items - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #f5f5f5; font-weight: bold; }
            tr:hover { background: #f9f9f9; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <h1>Items List</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Category</th>
                <th>Unit Type</th>
                <th class="text-right">Rate</th>
              </tr>
            </thead>
            <tbody>
              ${filteredItems.map(item => `
                <tr>
                  <td>${item.title || '-'}</td>
                  <td>${item.description || '-'}</td>
                  <td>${item.category || '-'}</td>
                  <td>${item.unit_type || '-'}</td>
                  <td class="text-right">€${parseFloat(item.rate || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  // View Item Function
  const handleView = (item) => {
    setSelectedItem(item)
    setIsViewModalOpen(true)
  }

  // Import Items Function
  const handleImport = () => {
    setIsImportModalOpen(true)
  }

  const handleFileImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.name.match(/\.(csv|xls|xlsx)$/i)) {
      alert('Please select a valid file (CSV, XLS, or XLSX)')
      return
    }

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target.result
        const lines = text.split('\n').filter(line => line.trim())
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        
        // Expected headers: Title, Description, Category, Unit Type, Rate
        const titleIndex = headers.findIndex(h => h.toLowerCase().includes('title'))
        const descIndex = headers.findIndex(h => h.toLowerCase().includes('description'))
        const catIndex = headers.findIndex(h => h.toLowerCase().includes('category'))
        const unitIndex = headers.findIndex(h => h.toLowerCase().includes('unit'))
        const rateIndex = headers.findIndex(h => h.toLowerCase().includes('rate'))

        if (titleIndex === -1 || catIndex === -1 || unitIndex === -1 || rateIndex === -1) {
          alert('Invalid file format. Required columns: Title, Category, Unit Type, Rate')
          return
        }

        let successCount = 0
        let errorCount = 0

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
          if (values.length < headers.length) continue

          try {
            const itemData = {
              company_id: companyId,
              title: values[titleIndex] || '',
              description: descIndex >= 0 ? values[descIndex] || '' : '',
              category: values[catIndex] || '',
              unit_type: values[unitIndex] || '',
              rate: parseFloat(values[rateIndex]) || 0,
              show_in_client_portal: 0
            }

            if (itemData.title && itemData.category && itemData.unit_type) {
              await itemsAPI.create(itemData)
              successCount++
            } else {
              errorCount++
            }
          } catch (error) {
            console.error(`Error importing row ${i + 1}:`, error)
            errorCount++
          }
        }

        alert(`Import completed! ${successCount} items imported, ${errorCount} errors.`)
        setIsImportModalOpen(false)
        fetchItems()
      } catch (error) {
        console.error('Error importing file:', error)
        alert('Failed to import file. Please check the format.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-text">Items</h1>
          <p className="text-sm sm:text-base text-secondary-text mt-1">Manage your items and products</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleImport}
            className="flex items-center gap-2"
          >
            <IoDownload size={18} />
            Import items
          </Button>
          <AddButton onClick={() => setIsAddModalOpen(true)} label="Add item" />
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <IoFilter size={20} className="text-secondary-text" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none flex-1"
            >
              <option value="All">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-text" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <IoDocumentText size={16} />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <IoPrint size={16} />
              Print
            </Button>
          </div>
        </div>
      </Card>

      {/* Items Table */}
      <Card>
        {loading ? (
          <div className="text-center py-8 text-secondary-text">Loading items...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 text-secondary-text">No items found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-primary-text">Title</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-primary-text">Description</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-primary-text">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-primary-text">Unit type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-primary-text">Rate</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-primary-text">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-primary-text font-medium">{item.title}</td>
                    <td className="py-3 px-4 text-sm text-secondary-text">{item.description || '-'}</td>
                    <td className="py-3 px-4 text-sm text-secondary-text">{item.category || '-'}</td>
                    <td className="py-3 px-4 text-sm text-secondary-text">{item.unit_type || '-'}</td>
                    <td className="py-3 px-4 text-sm text-primary-text font-semibold">
                      ${parseFloat(item.rate || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleView(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View"
                        >
                          <IoEye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-primary-accent hover:bg-primary-accent/10 rounded transition-colors"
                          title="Edit"
                        >
                          <IoCreate size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <IoTrash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add/Edit Item Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setIsEditModalOpen(false)
          resetForm()
        }}
        title={isEditModalOpen ? "Edit item" : "Add item"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description"
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Design">Design</option>
                  <option value="Development">Development</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Services">Services</option>
                  <option value="Products">Products</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Unit type <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.unit_type}
                  onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
                  placeholder="Unit type (Ex: hours, pc, etc.)"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Rate <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  placeholder="Rate"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="show_in_client_portal"
                  checked={formData.show_in_client_portal}
                  onChange={(e) => setFormData({ ...formData, show_in_client_portal: e.target.checked })}
                  className="w-4 h-4 text-primary-accent rounded focus:ring-primary-accent"
                />
                <label htmlFor="show_in_client_portal" className="text-sm font-medium text-primary-text">
                  Show in client portal
                </label>
              </div>
            </div>

            {/* Right Column - Image Upload */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Item Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-accent transition-colors">
                  {imagePreview ? (
                    <div className="space-y-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full h-48 object-contain mx-auto rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null)
                          setFormData({ ...formData, image: null })
                        }}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <IoCamera className="mx-auto text-gray-400" size={48} />
                      <p className="text-sm text-secondary-text">No image uploaded</p>
                    </div>
                  )}
                  <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-accent text-white rounded-lg cursor-pointer hover:bg-primary-accent/90 transition-colors">
                    <IoCloudUpload size={18} />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false)
                setIsEditModalOpen(false)
                resetForm()
              }}
              className="flex items-center gap-2"
            >
              <IoClose size={18} />
              Close
            </Button>
            <Button
              type="submit"
              className="flex items-center gap-2"
            >
              <IoCheckmark size={18} />
              Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Item Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedItem(null)
        }}
        title="View Item"
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Title</label>
                <p className="text-sm font-semibold text-primary-text">{selectedItem.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Category</label>
                <p className="text-sm text-primary-text">{selectedItem.category || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Unit Type</label>
                <p className="text-sm text-primary-text">{selectedItem.unit_type || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Rate</label>
                <p className="text-sm font-semibold text-primary-text">${parseFloat(selectedItem.rate || 0).toFixed(2)}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-secondary-text mb-1">Description</label>
                <p className="text-sm text-primary-text whitespace-pre-wrap">{selectedItem.description || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Show in Client Portal</label>
                <p className="text-sm text-primary-text">{selectedItem.show_in_client_portal ? 'Yes' : 'No'}</p>
              </div>
            </div>
            {selectedItem.image_url && (
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-2">Image</label>
                <img
                  src={selectedItem.image_url}
                  alt={selectedItem.title}
                  className="max-w-full h-64 object-contain rounded-lg border border-gray-200"
                />
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewModalOpen(false)
                  setSelectedItem(null)
                }}
                className="flex items-center gap-2"
              >
                <IoClose size={18} />
                Close
              </Button>
              <Button
                onClick={() => {
                  setIsViewModalOpen(false)
                  handleEdit(selectedItem)
                }}
                className="flex items-center gap-2"
              >
                <IoCreate size={18} />
                Edit
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Import Items Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Items"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 mb-2">
              <strong>Instructions:</strong>
            </p>
            <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
              <li>Upload a CSV, XLS, or XLSX file</li>
              <li>Required columns: Title, Category, Unit Type, Rate</li>
              <li>Optional columns: Description</li>
              <li>First row should contain column headers</li>
            </ul>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Select File
            </label>
            <input
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleFileImport}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            />
            <p className="text-xs text-secondary-text mt-1">Supports: CSV, XLS, XLSX</p>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setIsImportModalOpen(false)}
              className="flex items-center gap-2"
            >
              <IoClose size={18} />
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Items

