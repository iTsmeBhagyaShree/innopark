import React, { useState, useEffect } from 'react';
import { tasksAPI, usersAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext.jsx';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import {
    IoAdd,
    IoCalendarOutline,
    IoCheckmarkCircleOutline,
    IoFlagOutline,
    IoPersonOutline,
    IoTimeOutline,
    IoTrashOutline,
    IoPencil,
    IoAlertCircleOutline
} from 'react-icons/io5';

const Tasks = ({ relatedToType, relatedToId }) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterPriority, setFilterPriority] = useState('All');

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        due_date: '',
        priority: 'Medium',
        assigned_to: '',
        reminder_datetime: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [relatedToType, relatedToId, filterStatus, filterPriority]);

    const fetchUsers = async () => {
        try {
            const res = await usersAPI.getAll({ company_id: user?.company_id || 1 });
            if (res.data.success) setUsers(res.data.data);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const params = {
                company_id: user?.company_id || 1,
                status: filterStatus !== 'All' ? filterStatus : undefined,
                priority: filterPriority !== 'All' ? filterPriority : undefined,
                related_to_type: relatedToType,
                related_to_id: relatedToId
            };
            const res = await tasksAPI.getAll(params);
            if (res.data.success) setTasks(res.data.data);
        } catch (err) {
            console.error('Error fetching tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                company_id: user?.company_id || 1,
                related_to_type: relatedToType,
                related_to_id: relatedToId
            };

            if (editingTask) {
                await tasksAPI.update(editingTask.id, payload);
            } else {
                await tasksAPI.create(payload);
            }

            setIsModalOpen(false);
            setEditingTask(null);
            resetForm();
            fetchTasks();
        } catch (err) {
            console.error('Error saving task:', err);
            alert(err.response?.data?.error || t('messages.saveFailed'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('tasks.delete_confirm'))) return;
        try {
            await tasksAPI.delete(id);
            fetchTasks();
        } catch (err) {
            console.error('Error deleting task:', err);
            alert(err.response?.data?.error || t('messages.deleteFailed'));
        }
    };

    const handleComplete = async (id) => {
        try {
            await tasksAPI.markComplete(id);
            fetchTasks();
        } catch (err) {
            console.error('Error completing task:', err);
        }
    };

    const handleReopen = async (id) => {
        try {
            await tasksAPI.reopen(id);
            fetchTasks();
        } catch (err) {
            console.error('Error reopening task:', err);
        }
    }

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            due_date: '',
            priority: 'Medium',
            assigned_to: user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' ? '' : user?.id || '',
            reminder_datetime: ''
        });
    };

    const openCreateModal = () => {
        setEditingTask(null);
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (task) => {
        setEditingTask(task);
        setFormData({
            title: task.title,
            description: task.description || '',
            due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
            priority: task.priority,
            assigned_to: task.assigned_to,
            reminder_datetime: task.reminder_datetime ? new Date(task.reminder_datetime).toISOString().slice(0, 16) : ''
        });
        setIsModalOpen(true);
    };

    const getPriorityColor = (p) => {
        switch (p) {
            case 'High': return 'text-red-700 bg-red-50 ring-red-600/20 border-red-100';
            case 'Medium': return 'text-amber-700 bg-amber-50 ring-amber-600/20 border-amber-100';
            case 'Low': return 'text-emerald-700 bg-emerald-50 ring-emerald-600/20 border-emerald-100';
            default: return 'text-gray-600 bg-gray-50 ring-gray-500/20 border-gray-100';
        }
    };

    const getTranslatedStatus = (status) => {
        switch (status) {
            case 'All': return t('tasks.all');
            case 'Pending': return t('tasks.pending');
            case 'Overdue': return t('tasks.overdue');
            case 'Completed': return t('tasks.completed');
            default: return status;
        }
    };

    const getTranslatedPriority = (p) => {
        switch (p) {
            case 'All': return t('tasks.any');
            case 'High': return t('tasks.high_short') || 'High';
            case 'Medium': return t('tasks.medium_short') || 'Medium';
            case 'Low': return t('tasks.low_short') || 'Low';
            default: return p;
        }
    };

    return (
        <div className="flex flex-col h-full bg-white/50 rounded-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 px-1">
                <div className="flex flex-wrap gap-2">
                    <div className="flex bg-gray-100/80 p-1 rounded-xl border border-gray-200 backdrop-blur-sm">
                        {['All', 'Pending', 'Overdue', 'Completed'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-300 ${filterStatus === status ? 'bg-white text-primary-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {getTranslatedStatus(status)}
                            </button>
                        ))}
                    </div>
                    <div className="flex bg-gray-100/80 p-1 rounded-xl border border-gray-200 backdrop-blur-sm">
                        {['All', 'High', 'Medium', 'Low'].map(p => (
                            <button
                                key={p}
                                onClick={() => setFilterPriority(p)}
                                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-300 ${filterPriority === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {getTranslatedPriority(p)}
                            </button>
                        ))}
                    </div>
                </div>
                <Button variant="primary" size="sm" onClick={openCreateModal} className="w-full sm:w-auto h-11 flex items-center justify-center gap-3 px-6 shadow-xl shadow-primary-accent/20 bg-primary-accent border-none rounded-xl hover:brightness-110 active:scale-95 transition-all">
                    <IoAdd size={22} />
                    <span className="font-black text-xs uppercase tracking-widest">{t('tasks.new_mission')}</span>
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar min-h-0 pb-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-6">
                        <div className="relative">
                            <div className="w-16 h-16 border-[5px] border-primary-accent/10 border-t-primary-accent rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-3 h-3 bg-primary-accent rounded-full animate-pulse shadow-lg shadow-primary-accent/50"></div>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.2em] animate-pulse">{t('tasks.syncing')}</p>
                        </div>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-24 bg-gray-50/40 rounded-[2.5rem] border-2 border-dashed border-gray-200/60 flex flex-col items-center justify-center group hover:bg-white hover:border-primary-accent/40 transition-all duration-700">
                        <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl border border-gray-100 flex items-center justify-center mb-8 text-gray-200 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                            <IoCheckmarkCircleOutline size={48} className="group-hover:text-primary-accent transition-colors duration-500" />
                        </div>
                        <h4 className="text-gray-900 font-black text-xl tracking-tight">{t('tasks.zero_pending')}</h4>
                        <p className="text-gray-400 text-sm mt-3 max-w-[280px] leading-relaxed font-bold uppercase tracking-wider">{t('tasks.all_clear')}</p>
                        <button onClick={openCreateModal} className="mt-8 px-8 py-3 bg-gray-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary-accent shadow-lg transition-all active:scale-95">{t('tasks.initiate')}</button>
                    </div>
                ) : (
                    tasks.map(task => {
                        const isOverdue = task.status === 'Overdue' || (task.status === 'Pending' && new Date(task.due_date) < new Date());
                        const isCompleted = task.status === 'Completed';

                        return (
                            <div key={task.id} className={`p-6 bg-white rounded-[2rem] border shadow-sm transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:-translate-y-1.5 flex items-start gap-6 group ${isOverdue && !isCompleted ? 'border-red-100 bg-red-50/10' : 'border-gray-100'}`}>
                                <div className="mt-1">
                                    <button
                                        onClick={() => isCompleted ? handleReopen(task.id) : handleComplete(task.id)}
                                        className={`w-8 h-8 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 transform active:scale-90 ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-200 scale-110' : 'border-gray-200 hover:border-primary-accent bg-white shadow-sm'}`}
                                    >
                                        {isCompleted ? <IoCheckmarkCircleOutline size={20} /> : <div className="w-2 h-2 rounded-full bg-gray-200 group-hover:bg-primary-accent transition-colors" />}
                                    </button>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className={`font-black text-gray-900 text-lg tracking-tight transition-all duration-500 ${isCompleted ? 'line-through text-gray-400 font-semibold' : ''}`}>
                                                    {task.title}
                                                </h4>
                                                {isOverdue && !isCompleted && <span className="px-2.5 py-1 bg-red-600 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-lg animate-bounce self-center">{t('tasks.delayed')}</span>}
                                            </div>
                                            {task.description && <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed font-bold tracking-tight opacity-70 group-hover:opacity-100 transition-opacity">{task.description}</p>}
                                        </div>
                                        <div className={`flex-shrink-0 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border-2 ${getPriorityColor(task.priority)} shadow-sm`}>
                                            {getTranslatedPriority(task.priority)}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-y-4 gap-x-8 mt-6 text-[10px] font-black uppercase tracking-[0.15em] border-t border-gray-50 pt-5">
                                        <div className={`flex items-center gap-3 transition-all duration-300 ${isOverdue && !isCompleted ? 'text-red-600 translate-x-1' : 'text-gray-400 group-hover:text-gray-700'}`}>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${isOverdue && !isCompleted ? 'bg-red-100' : 'bg-gray-50 group-hover:bg-white border border-transparent group-hover:border-gray-100'}`}>
                                                <IoCalendarOutline size={18} />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[8px] opacity-40">{t('tasks.target_date')}</span>
                                                <span>{new Date(task.due_date).toLocaleDateString(t('locale') === 'de' ? 'de-DE' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-400 group-hover:text-gray-700 transition-all duration-300">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 group-hover:bg-white border border-transparent group-hover:border-gray-100 flex items-center justify-center">
                                                <IoPersonOutline size={18} />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[8px] opacity-40">{t('tasks.operative')}</span>
                                                <span className="truncate max-w-[120px]">{task.assigned_to_name || t('tasks.standby')}</span>
                                            </div>
                                        </div>
                                        {task.reminder_datetime && (
                                            <div className="flex items-center gap-3 text-blue-500 group-hover:scale-105 transition-transform">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                                                    <IoTimeOutline size={18} />
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[8px] opacity-50 font-black">{t('tasks.alarm')}</span>
                                                    <span>{new Date(task.reminder_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                                    <button
                                        onClick={() => openEditModal(task)}
                                        className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-white rounded-2xl hover:bg-gray-900 shadow-xl transition-all active:scale-90"
                                    >
                                        <IoPencil size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(task.id)}
                                        className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-white rounded-2xl hover:bg-red-600 shadow-xl transition-all active:scale-90"
                                    >
                                        <IoTrashOutline size={20} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingTask ? (
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-2xl">
                            <IoPencil size={24} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-900 font-black text-xl tracking-tight">{t('tasks.modify_mission')}</span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black">{t('tasks.updating_parameters')}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-accent text-white flex items-center justify-center shadow-2xl shadow-primary-accent/30">
                            <IoAdd size={28} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-900 font-black text-xl tracking-tight">{t('tasks.new_assignment')}</span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black">{t('tasks.establishing_objective')}</span>
                        </div>
                    </div>
                )}
                size="md"
            >
                <form onSubmit={handleSubmit} className="p-2 space-y-8">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">{t('tasks.task_title')} <span className="text-red-500">*</span></label>
                            <input
                                required
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-5 py-4 bg-gray-50/50 border-2 border-gray-100 rounded-[1.5rem] focus:outline-none focus:ring-8 focus:ring-primary-accent/5 focus:border-primary-accent focus:bg-white transition-all font-bold text-gray-900 text-lg placeholder:text-gray-300"
                                placeholder={t('tasks.title_placeholder')}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">{t('tasks.deadline')} <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input
                                        required
                                        type="datetime-local"
                                        value={formData.due_date}
                                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50/50 border-2 border-gray-100 rounded-[1.25rem] focus:outline-none focus:border-primary-accent focus:bg-white transition-all font-bold text-gray-900"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">{t('tasks.priority_level')}</label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50/50 border-2 border-gray-100 rounded-[1.25rem] focus:outline-none focus:border-primary-accent focus:bg-white transition-all font-bold text-gray-900 appearance-none cursor-pointer"
                                >
                                    <option value="Low">{t('tasks.low')}</option>
                                    <option value="Medium">{t('tasks.medium')}</option>
                                    <option value="High">{t('tasks.high')}</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">{t('tasks.handler')} <span className="text-red-500">*</span></label>
                            <select
                                required
                                disabled={user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN'}
                                value={formData.assigned_to}
                                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                                className="w-full px-5 py-4 bg-gray-50/50 border-2 border-gray-100 rounded-[1.25rem] focus:outline-none focus:border-primary-accent focus:bg-white transition-all font-bold text-gray-900 disabled:opacity-60 disabled:cursor-not-allowed appearance-none cursor-pointer"
                            >
                                <option value="">{t('tasks.select_operative')}</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">{t('tasks.briefing_notes')}</label>
                            <textarea
                                rows="4"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-5 py-4 bg-gray-50/50 border-2 border-gray-100 rounded-[1.5rem] focus:outline-none focus:border-primary-accent focus:bg-white transition-all font-bold text-gray-900 resize-none placeholder:text-gray-300"
                                placeholder={t('tasks.briefing_notes_placeholder') || '...'}
                            ></textarea>
                        </div>

                        <div className="p-6 bg-blue-50/30 rounded-[1.5rem] border border-blue-100/50">
                            <label className="block text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                {t('tasks.tactical_reminder')}
                                <IoTimeOutline className="animate-pulse" size={14} />
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.reminder_datetime}
                                onChange={(e) => setFormData({ ...formData, reminder_datetime: e.target.value })}
                                className="w-full px-4 py-3 bg-white border-2 border-blue-100 rounded-xl focus:outline-none focus:border-blue-400 transition-all font-bold text-gray-900"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {t('tasks.abort_mission')}
                        </button>
                        <Button
                            variant="primary"
                            type="submit"
                            className="px-12 py-4 h-auto shadow-2xl shadow-primary-accent/30 bg-primary-accent rounded-2xl transition-all active:scale-95"
                        >
                            <span className="font-black text-[10px] uppercase tracking-[0.2em]">{t('tasks.deploy_assignment')}</span>
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Tasks;
