import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Card from '../../../components/ui/Card';
import { itemsAPI } from '../../../api';
import { useAuth } from '../../../context/AuthContext';
import { IoCheckmarkCircle, IoClose, IoCloudUpload, IoCamera } from 'react-icons/io5';
import BaseUrl from '../../../api/baseUrl';

const TestItemPage = () => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Products',
        unit_type: 'Pcs',
        rate: '',
        show_in_client_portal: false,
        image: null
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [message, setMessage] = useState('');

    const fetchItems = async () => {
        try {
            setLoading(true);
            const response = await itemsAPI.getAll({ company_id: user.company_id });
            if (response.data.success) {
                setItems(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching items:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.company_id) {
            fetchItems();
        }
    }, [user?.company_id]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, image: file });
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('Creating item...');
        try {
            const data = new FormData();
            data.append('company_id', user.company_id);
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('category', formData.category);
            data.append('unit_type', formData.unit_type);
            data.append('rate', formData.rate);
            data.append('show_in_client_portal', formData.show_in_client_portal);
            if (formData.image) {
                data.append('image', formData.image);
            }

            const response = await itemsAPI.create(data);
            if (response.data.success) {
                setMessage('Item created successfully!');
                setFormData({
                    title: '',
                    description: '',
                    category: 'Products',
                    unit_type: 'Pcs',
                    rate: '',
                    show_in_client_portal: false,
                    image: null
                });
                setImagePreview(null);
                fetchItems();
            } else {
                setMessage('Failed to create item: ' + response.data.error);
            }
        } catch (error) {
            setMessage('Error: ' + (error.response?.data?.error || error.message));
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Test Item Creation (New DB Fields)</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Create Form */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Create New Item</h2>
                    {message && <div className={`p-3 rounded mb-4 ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{message}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Title</label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                placeholder="Item Name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Rate</label>
                            <Input
                                type="number"
                                value={formData.rate}
                                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                                required
                                placeholder="0.00"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="show_client"
                                checked={formData.show_in_client_portal}
                                onChange={(e) => setFormData({ ...formData, show_in_client_portal: e.target.checked })}
                                className="w-4 h-4"
                            />
                            <label htmlFor="show_client">Show in Client Portal (New DB Column)</label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Image (New DB Column)</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                {imagePreview ? (
                                    <div className="space-y-2">
                                        <img src={imagePreview} alt="Preview" className="h-32 mx-auto object-contain" />
                                        <button type="button" onClick={() => { setImagePreview(null); setFormData({ ...formData, image: null }) }} className="text-red-500 text-sm">Remove</button>
                                    </div>
                                ) : (
                                    <label className="cursor-pointer flex flex-col items-center">
                                        <IoCloudUpload size={24} className="text-gray-400 mb-2" />
                                        <span className="text-sm text-blue-500">Upload Image</span>
                                        <input type="file" onChange={handleImageChange} className="hidden" accept="image/*" />
                                    </label>
                                )}
                            </div>
                        </div>

                        <Button type="submit" className="w-full">Create Item</Button>
                    </form>
                </Card>

                {/* List View */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Existing Items</h2>
                    {loading ? <p>Loading...</p> : (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto">
                            {items.map(item => (
                                <div key={item.id} className="flex items-center gap-4 p-3 border rounded hover:bg-gray-50">
                                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                                        {item.image_url || item.image_path ? (
                                            <img
                                                src={item.image_url ? `${BaseUrl}${item.image_url}` : `${BaseUrl}/uploads/${item.image_path}`}
                                                alt={item.title}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/64?text=Error' }}
                                            />
                                        ) : (
                                            <span className="text-xs text-gray-400">No Img</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{item.title}</p>
                                        <p className="text-sm text-gray-500">${parseFloat(item.rate).toFixed(2)}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xs px-2 py-1 rounded ${item.show_in_client_portal ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {item.show_in_client_portal ? 'Visible' : 'Hidden'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {items.length === 0 && <p className="text-gray-500">No items found.</p>}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default TestItemPage;
