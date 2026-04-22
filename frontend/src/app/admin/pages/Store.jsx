import { useState, useEffect } from 'react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import Input from '../../../components/ui/Input'
import { itemsAPI, ordersAPI } from '../../../api'
import { useLanguage } from '../../../context/LanguageContext.jsx'
import { 
  IoCart, 
  IoCheckmark, 
  IoStorefront, 
  IoSearch,
  IoClose,
  IoAdd,
  IoRemove,
  IoTrash,
  IoAttach,
  IoMic,
} from 'react-icons/io5'

const Store = () => {
  const { t } = useLanguage()
  const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
  const userId = parseInt(localStorage.getItem('userId') || 1, 10)
  
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [cart, setCart] = useState([])
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false)
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [orderNote, setOrderNote] = useState('')
  const [itemSearchQuery, setItemSearchQuery] = useState('')
  const [itemCategoryFilter, setItemCategoryFilter] = useState('')

  useEffect(() => {
    fetchItems()
  }, [categoryFilter])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const params = { company_id: companyId }
      if (categoryFilter) {
        params.category = categoryFilter
      }
      const response = await itemsAPI.getAll(params)
      if (response.data.success) {
        // Only show items that are enabled for client portal or all items for admin
        const allItems = response.data.data || []
        setItems(allItems)
      }
    } catch (error) {
      console.error('Error fetching items:', error)
      alert(error.response?.data?.error || 'Failed to fetch items')
    } finally {
      setLoading(false)
    }
  }



  // Add to cart
  const handleAddToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id)
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ))
    } else {
      setCart([...cart, { ...item, quantity: 1 }])
    }
  }

  // Update quantity
  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(itemId)
      return
    }
    setCart(cart.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ))
  }

  // Remove from cart
  const handleRemoveFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId))
  }

  // Calculate total
  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      return total + (parseFloat(item.rate || 0) * item.quantity)
    }, 0)
  }

  // Handle checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty')
      return
    }
    setIsCheckoutModalOpen(true)
  }

  // Place order
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty')
      return
    }

    try {
      // Create order with items
      const orderData = {
        company_id: companyId,

        title: `Order - ${new Date().toLocaleDateString()}`,
        description: orderNote || '',
        amount: calculateTotal(),
        status: 'Neu',
        items: cart.map(item => ({
          item_id: item.id,
          item_name: item.title,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit_type,
          unit_price: parseFloat(item.rate || 0),
          amount: parseFloat(item.rate || 0) * item.quantity
        }))
      }

      const response = await ordersAPI.create(orderData)
      
      if (response.data.success) {
        alert('Order placed successfully!')
        setCart([])
        setIsCheckoutModalOpen(false)
        setOrderNote('')
      } else {
        alert(response.data.error || 'Failed to place order')
      }
    } catch (error) {
      console.error('Error placing order:', error)
      alert(error.response?.data?.error || 'Failed to place order')
    }
  }

  // Get unique categories
  const categories = [...new Set(items.map(item => item.category).filter(Boolean))]

  // Filter items for store page
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !categoryFilter || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Filter items for add item modal
  const filteredItemsForModal = items.filter(item => {
    const matchesSearch = !itemSearchQuery || 
      item.title?.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(itemSearchQuery.toLowerCase())
    const matchesCategory = !itemCategoryFilter || item.category === itemCategoryFilter
    return matchesSearch && matchesCategory
  })

  // Handle add item from modal
  const handleAddItemFromModal = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id)
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ))
    } else {
      setCart([...cart, { ...item, quantity: 1 }])
    }
    setIsAddItemModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filter */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">{t('store.title') || 'Store'}</h1>
          <p className="text-secondary-text mt-1">{t('store.subtitle') || 'Entdecken Sie unsere Produkte और Dienstleistungen'}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none text-sm"
          >
            <option value="">- Category -</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          <div className="relative">
            <input
              type="text"
              placeholder={t('auto.auto_13348442') || "Search"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 pr-10 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none text-sm w-48"
            />
            <IoSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>

          {/* Cart Badge and Checkout Button */}
          {cart.length > 0 && (
            <Button
              onClick={handleCheckout}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <IoCheckmark size={18} />
              Checkout ({cart.length})
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-secondary-text">{t('common.loading') || 'Wird geladen...'}</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="p-12 text-center">
          <IoStorefront size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-primary-text mb-2">{t('store.no_items_found') || 'Keine Produkte gefunden'}</h3>
          <p className="text-secondary-text">{t('store.no_items_help') || 'Versuchen Sie es mit einem anderen Suchbegriff oder einer anderen Kategorie.'}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const cartItem = cart.find(c => c.id === item.id)
            const inCart = cartItem !== undefined
            
            return (
              <Card 
                key={item.id} 
                className="overflow-hidden hover:shadow-lg transition-all group"
              >
                {/* Item Image */}
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                  {item.image_url ? (
                    <img 
                      src={item.image_url} 
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                      <IoStorefront size={64} className="text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Item Details */}
                <div className="p-4">
                  <h3 className="font-semibold text-primary-text text-lg mb-1">
                    {item.title}
                  </h3>
                  <p className="text-red-500 font-bold text-lg mb-2">
                    ${parseFloat(item.rate || 0).toFixed(2)}
                    <span className="text-gray-400 font-normal text-sm">/{item.unit_type || 'PC'}</span>
                  </p>
                  <p className="text-secondary-text text-sm line-clamp-2 mb-3">
                    {item.description || t('store.no_description')}
                  </p>
                  
                  {/* Add to Cart Button */}
                  {inCart ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, cartItem.quantity - 1)}
                        className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                      >
                        <IoRemove size={16} />
                      </button>
                      <span className="flex-1 text-center font-semibold">{cartItem.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, cartItem.quantity + 1)}
                        className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                      >
                        <IoAdd size={16} />
                      </button>
                      <button
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors ml-2"
                        title={t('common.remove_from_cart')}
                      >
                        <IoTrash size={16} />
                      </button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleAddToCart(item)}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <IoCart size={18} />
                      {t('store.add_to_cart')}
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Checkout Modal - Process Order */}
      <Modal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        title={t('common.process_order')}
        size="lg"
      >
        <div className="space-y-6">
          {/* Instruction Text */}
          <p className="text-sm text-secondary-text">
            {t('store.process_order_help')}
          </p>

          {/* Order Items Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-primary-text">{t('store.column.item') || 'Produkt'}</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-primary-text">{t('store.column.qty') || 'Menge'}</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-primary-text">{t('store.column.rate') || 'Preis'}</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-primary-text">{t('store.column.total') || 'Gesamt'}</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-primary-text">{t('common.actions') || 'Aktionen'}</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-secondary-text text-sm">
                      {t('store.no_items_in_cart')}
                    </td>
                  </tr>
                ) : (
                  cart.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-primary-text">{item.title}</p>
                          {item.description && (
                            <p className="text-xs text-secondary-text mt-0.5">
                              {item.description.length > 50 ? `${item.description.substring(0, 50)}...` : item.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-primary-text">
                        {item.quantity} {item.unit_type?.toLowerCase() || 'pc'}
                      </td>
                      <td className="py-3 px-4 text-sm text-primary-text">
                        ${parseFloat(item.rate || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-primary-text">
                        ${(parseFloat(item.rate || 0) * item.quantity).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 text-primary-accent hover:bg-primary-accent/10 rounded transition-colors"
                            title={t('common.decrease_quantity')}
                          >
                            <IoRemove size={18} />
                          </button>
                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title={t('common.remove_item')}
                          >
                            <IoTrash size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Add Item Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddItemModalOpen(true)
              }}
              className="flex items-center justify-center gap-2"
            >
              <IoAdd size={18} />
              {t('common.add_item')}
            </Button>
          </div>

          {/* Order Summary */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-primary-text">{t('store.subtotal') || 'Zwischensumme'}</span>
              <span className="text-sm font-semibold text-primary-text">${calculateTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-base font-semibold text-primary-text">{t('store.total') || 'Gesamtsumme'}</span>
              <span className="text-lg font-bold text-primary-text">${calculateTotal().toFixed(2)}</span>
            </div>
          </div>



          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              {t('common.note')}
            </label>
            <textarea
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              placeholder={t('store.note_placeholder')}
              rows={4}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <IoAttach size={16} />
                Upload File
              </Button>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors">
                <IoMic size={20} />
              </button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsCheckoutModalOpen(false)}
                className="flex items-center gap-2"
              >
                <IoSearch size={16} />
                Find more items
              </Button>
            </div>
            <Button
              onClick={handlePlaceOrder}
              className="flex items-center gap-2 bg-primary-accent hover:bg-primary-accent/90 text-white"
            >
              <IoCheckmark size={18} />
              Place order
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        title="Add Items to Order"
        size="xl"
      >
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={t('auto.auto_b41f8031') || "Search items..."}
                value={itemSearchQuery}
                onChange={(e) => setItemSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none text-sm"
              />
              <IoSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
            <select
              value={itemCategoryFilter}
              onChange={(e) => setItemCategoryFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none text-sm"
            >
              <option value="">{t('store.all_categories') || 'Alle Kategorien'}</option>

              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Items Grid */}
          {filteredItemsForModal.length === 0 ? (
            <div className="text-center py-8 text-secondary-text">
              <p>{t('store.no_search_results') || 'Keine passenden Produkte gefunden'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {filteredItemsForModal.map((item) => {
                const cartItem = cart.find(c => c.id === item.id)
                const inCart = cartItem !== undefined
                
                return (
                  <Card 
                    key={item.id} 
                    className="p-4 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleAddItemFromModal(item)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Item Image */}
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <IoStorefront size={24} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-primary-text text-sm mb-1 truncate">
                          {item.title}
                        </h3>
                        <p className="text-red-500 font-bold text-sm mb-1">
                          ${parseFloat(item.rate || 0).toFixed(2)}
                          <span className="text-gray-400 font-normal text-xs">/{item.unit_type || 'PC'}</span>
                        </p>
                        {item.description && (
                          <p className="text-secondary-text text-xs line-clamp-2 mb-2">
                            {item.description}
                          </p>
                        )}
                        {inCart && (
                          <div className="flex items-center gap-1 text-xs text-primary-accent">
                            <IoCheckmark size={14} />
                            <span>In cart ({cartItem.quantity})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setIsAddItemModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Store

