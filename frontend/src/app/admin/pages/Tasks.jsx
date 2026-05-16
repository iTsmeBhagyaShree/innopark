import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  tasksAPI,
  usersAPI,
  leadsAPI,
  dealsAPI,
  contactsAPI,
  companiesAPI,
  projectsAPI
} from '../../../api';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import {
  IoAdd,
  IoFilter,
  IoSearch,
  IoChevronDown,
  IoCalendar,
  IoPerson,
  IoFlag,
  IoCheckmarkCircle,
  IoAlertCircle,
  IoTrash,
  IoPencil,
  IoList,
  IoGrid,
  IoSync,
  IoBusiness,
  IoPersonCircle,
  IoBriefcase,
  IoRocket
} from 'react-icons/io5';

const resolveCompanyId = (u) => {
  const cands = [u?.company_id, u?.companyId];
  for (const c of cands) {
    if (c == null || c === '') continue;
    const n = parseInt(String(c).trim(), 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const ls = localStorage.getItem('companyId') || localStorage.getItem('company_id');
  if (ls) {
    const n = parseInt(ls, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
};

const TaskDashboard = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  const companyId = useMemo(() => resolveCompanyId(user), [user]);

  useEffect(() => {
    if (user?.company_id && !localStorage.getItem('companyId')) {
      localStorage.setItem('companyId', String(user.company_id));
    }
  }, [user?.company_id]);

  // Core State
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalTasks, setTotalTasks] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Filter State
  const [filters, setFilters] = useState({
    category: '', // 'CRM' or 'Project'
    status: '',
    priority: '',
    related_to_type: '',
    assigned_to: isAdmin ? '' : user?.id,
    date_from: '',
    date_to: ''
  });

  // Form/Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'Medium',
    assigned_to: isAdmin ? '' : user?.id,
    related_to_type: '',
    related_to_id: '',
    reminder_datetime: ''
  });

  // Lists for Dropdowns
  const [users, setUsers] = useState([]);
  const [entities, setEntities] = useState([]);
  const [entityLoading, setEntityLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!companyId) {
      setTasks([]);
      setTotalTasks(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = {
        ...filters,
        page,
        limit,
        company_id: companyId,
      };
      const res = await tasksAPI.getAll(params);
      const list = res.data?.data;
      if (res.data && res.data.success) {
        setTasks(Array.isArray(list) ? list : []);
        setTotalTasks(
          res.data.pagination?.total ?? (Array.isArray(list) ? list.length : 0)
        );
      } else {
        setTasks([]);
        setTotalTasks(0);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, page, companyId, limit]);

  const fetchSupportingData = async () => {
    if (!companyId || !isAdmin) return;
    try {
      const uRes = await usersAPI.getAll({ company_id: companyId });
      if (uRes.data.success) setUsers(uRes.data.data);
    } catch (err) {
      console.error('Error fetching supporting data:', err);
    }
  };

  const fetchEntities = async (type) => {
    if (!type) {
      setEntities([]);
      return;
    }
    if (!companyId) {
      setEntities([]);
      return;
    }
    setEntityLoading(true);
    try {
      let res;
      const params = { company_id: companyId };
      switch (type) {
        case 'lead': res = await leadsAPI.getAll(params); break;
        case 'deal': res = await dealsAPI.getAll(params); break;
        case 'contact': res = await contactsAPI.getAll(params); break;
        case 'company': res = await companiesAPI.getAll(params); break;
        case 'project': res = await projectsAPI.getAll(params); break;
        default: setEntities([]); return;
      }
      if (res.data.success) {
        // Normalize labels/names
        const data = res.data.data.map(item => ({
          id: item.id,
          name: item.title || item.person_name || item.company_name || item.name || item.deal_number || `ID: ${item.id}`
        }));
        setEntities(data);
      }
    } catch (err) {
      console.error('Error fetching entities:', err);
    } finally {
      setEntityLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (companyId && isAdmin) fetchSupportingData();
  }, [companyId, isAdmin]);

  useEffect(() => {
    if (formData.related_to_type) {
      fetchEntities(formData.related_to_type);
    }
  }, [formData.related_to_type]);

  const handleAction = async (task, action) => {
    try {
      if (action === 'complete') await tasksAPI.markComplete(task.id);
      else if (action === 'reopen') await tasksAPI.reopen(task.id);
      else if (action === 'delete') {
        if (!window.confirm(t('common.confirm_delete') || t('confirm_delete'))) return;
        await tasksAPI.delete(task.id);
      }
      fetchTasks();
    } catch (err) {
      console.error('Task action error:', err);
      alert(err.response?.data?.error || t('common.action_failed') || t('action_failed'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyId) {
      alert(t('projects.errors.missing_company') || 'Company is required. Please sign in again.');
      return;
    }
    try {
      const payload = { ...formData, company_id: companyId };
      if (!isAdmin && user?.id) {
        payload.assigned_to = user.id;
      }
      if (editingTask) await tasksAPI.update(editingTask.id, payload);
      else await tasksAPI.create(payload);

      setIsModalOpen(false);
      setEditingTask(null);
      fetchTasks();
    } catch (err) {
      console.error('Submit error:', err);
      alert(err.response?.data?.error || t('common.save_failed') );
    }
  };

  const openEdit = (task) => {
    const resolvedRelatedType =
      task.related_to_type ||
      (task.project_id ? 'project' : (task.lead_id ? 'lead' : (task.deal_id ? 'deal' : (task.contact_id ? 'contact' : (task.related_company_id ? 'company' : '')))))
    const resolvedRelatedId =
      task.related_to_id || task.project_id || task.lead_id || task.deal_id || task.contact_id || task.related_company_id || ''

    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
      priority: task.priority,
      assigned_to: task.assigned_to,
      related_to_type: resolvedRelatedType,
      related_to_id: resolvedRelatedId ? String(resolvedRelatedId) : '',
      reminder_datetime: task.reminder_datetime ? new Date(task.reminder_datetime).toISOString().slice(0, 16) : ''
    });
    setIsModalOpen(true);
  };

  const getEntityIcon = (type) => {
    switch (type) {
      case 'lead': return <IoRocket className="text-orange-500" />;
      case 'deal': return <IoBriefcase className="text-green-500" />;
      case 'contact': return <IoPersonCircle className="text-blue-500" />;
      case 'company': return <IoBusiness className="text-purple-500" />;
      case 'project': return <IoGrid className="text-teal-500" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] overflow-hidden bg-gray-50">
      {/* ── Ultra-Compact Header ── */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 z-20 shadow-sm">
        <div className="max-w-full mx-auto flex flex-col gap-2">
          {/* Row 1: Brand, Source, Primary Actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-accent/10 flex items-center justify-center text-primary-accent shrink-0">
                <IoCheckmarkCircle size={18} />
              </div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight shrink-0">{t('tasks.centralized_tasks')}</h1>
              
              <div className="hidden md:flex items-center gap-1 p-1 bg-gray-100 rounded-lg shadow-inner ml-2">
                {[
                  { id: '', label: t('common.all') },
                  { id: 'CRM', label: t('tasks.crm') },
                  { id: 'Project', label: t('tasks.project') }
                ].map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setFilters({ ...filters, category: v.id })}
                    className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${filters.category === v.id ? 'bg-white text-primary-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Search placeholder */}
            <div className="flex-1 max-w-xs md:max-w-md"></div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                onClick={() => {
                  setEditingTask(null); setFormData({
                    title: '', description: '', due_date: '', priority: 'Medium',
                    assigned_to: user?.id || '', related_to_type: '', related_to_id: '', reminder_datetime: '',
                    category: filters.category || 'CRM'
                  }); setIsModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-accent text-white rounded-lg text-xs font-black shadow-md shadow-primary-accent/20 hover:bg-primary-accent-hover transition-all whitespace-nowrap"
              >
                <IoAdd size={16} /> {t('tasks.new_task')}
              </Button>
            </div>
          </div>

          {/* Row 2: Filters and Stats */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1 hover:border-primary-accent transition-all">
                <IoSync size={12} className="text-gray-400" />
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="bg-transparent text-[10px] font-bold text-gray-700 focus:outline-none cursor-pointer"
                >
                  <option value="">{t('tasks.all_status')}</option>
                  <option value="Pending">{t('tasks.pending')}</option>
                  <option value="Completed">{t('tasks.completed')}</option>
                  <option value="Overdue">{t('tasks.overdue')}</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1 hover:border-primary-accent transition-all">
                <IoFlag size={12} className="text-gray-400" />
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className="bg-transparent text-[10px] font-bold text-gray-700 focus:outline-none cursor-pointer"
                >
                  <option value="">{t('tasks.all_priorities')}</option>
                  <option value="High">{t('tasks.high')}</option>
                  <option value="Medium">{t('tasks.medium')}</option>
                  <option value="Low">{t('tasks.low')}</option>
                </select>
              </div>

              {/* Module Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1 hover:border-primary-accent transition-all">
                <IoRocket size={12} className="text-gray-400" />
                <select
                  value={filters.related_to_type}
                  onChange={(e) => setFilters({ ...filters, related_to_type: e.target.value })}
                  className="bg-transparent text-[10px] font-bold text-gray-700 focus:outline-none cursor-pointer"
                >
                  <option value="">{t('tasks.any_module')}</option>
                  <option value="lead">{t('leads.title')}</option>
                  <option value="deal">{t('deals.title') || 'Deals'}</option>
                  <option value="contact">{t('contacts.title')}</option>
                  <option value="company">{t('companies.title')}</option>
                  <option value="project">{t('projects.title')}</option>
                </select>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1 hover:border-primary-accent transition-all">
                  <IoPerson size={12} className="text-gray-400" />
                  <select
                    value={filters.assigned_to}
                    onChange={(e) => setFilters({ ...filters, assigned_to: e.target.value })}
                    className="bg-transparent text-[10px] font-bold text-gray-700 focus:outline-none cursor-pointer"
                  >
                    <option value="">{t('tasks.global_all')}</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              )}

              {/* Reset Btn */}
              <button
                onClick={() => { setFilters({ category: '', status: '', priority: '', related_to_type: '', assigned_to: isAdmin ? '' : user?.id, date_from: '', date_to: '' }); setPage(1); }}
                className="text-[10px] font-black text-red-500 uppercase hover:underline"
              >
                {t('tasks.reset_filters')}
              </button>
            </div>

            {/* Stats Bar */}
            <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500">
              <div className="flex items-center gap-1">
                <span className="opacity-70">{t('tasks.total')}:</span>
                <span className="text-gray-900 font-black">{totalTasks}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 sm:p-6 space-y-6 sm:space-y-8">
        {/* Task List */}
        <div className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white rounded-2xl animate-pulse border border-gray-100"></div>)}
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                <IoCheckmarkCircle size={48} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 uppercase tracking-widest">{t('tasks.no_tasks')}</h3>
              <p className="text-gray-400 font-medium">{t('tasks.no_tasks_found')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className={`group p-6 rounded-2xl border transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col md:flex-row items-start md:items-center gap-6 ${
                    task.status === 'Overdue' 
                      ? 'border-red-200 bg-red-50' 
                      : 'border-gray-100 bg-white'
                  }`}
                >
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleAction(task, task.status === 'Completed' ? 'reopen' : 'complete')}
                      className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${task.status === 'Completed' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200 hover:border-primary-accent bg-white text-transparent'}`}
                    >
                      <IoCheckmarkCircle size={20} />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <h3 className={`text-lg font-black tracking-tight ${task.status === 'Completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</h3>
                      <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ring-1 ${task.priority === 'High' ? 'bg-red-50 text-red-600 ring-red-500/20' :
                        task.priority === 'Medium' ? 'bg-yellow-50 text-yellow-600 ring-yellow-500/20' : 'bg-green-50 text-green-600 ring-green-500/20'
                        }`}>
                        {task.priority === 'High' ? t('tasks.high') : task.priority === 'Medium' ? t('tasks.medium') : t('tasks.low')}
                      </div>
                      {task.status === 'Overdue' && (
                        <div className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-red-600 text-white animate-pulse">
                          {t('tasks.overdue')}
                        </div>
                      )}
                    </div>
                    <div 
                      className={`text-gray-500 text-sm line-clamp-1 mb-3`}
                      dangerouslySetInnerHTML={{ __html: task.description || '' }}
                    />

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px] font-black uppercase tracking-wider text-gray-400">
                      <div className="flex items-center gap-2">
                        <IoCalendar size={14} className={task.status === 'Overdue' ? 'text-red-500' : ''} />
                        <span className={task.status === 'Overdue' ? 'text-red-600 font-black' : ''}>
                          {new Date(task.due_date).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <IoPerson size={14} />
                        <span>{task.assigned_to_name || t('common.system')}</span>
                      </div>
                      {task.related_to_type && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100 group-hover:bg-white transition-colors">
                          {getEntityIcon(task.related_to_type)}
                          <span className="text-gray-600">{task.related_entity_name || `${t(`sidebar.${task.related_to_type}`) || task.related_to_type} #${task.related_to_id}`}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(task)}
                      className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                      <IoPencil size={18} />
                    </button>
                    <button
                      onClick={() => handleAction(task, 'delete')}
                      className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                    >
                      <IoTrash size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-8 border-t border-gray-100">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
            {(t('tasks.showing_x_of_y') || '').replace('{{count}}', tasks.length).replace('{{total}}', totalTasks)}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="rounded-xl border-gray-200"
            >
              {t('tasks.back')}
            </Button>
            <div className="flex items-center px-4 font-black text-gray-900">{page}</div>
            <Button
              variant="outline"
              size="sm"
              disabled={tasks.length < limit}
              onClick={() => setPage(page + 1)}
              className="rounded-xl border-gray-200"
            >
              {t('tasks.next')}
            </Button>
          </div>
        </div>
      </div>

      {/* Creation/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={<span className="text-2xl font-black uppercase tracking-tight">{editingTask ? t('tasks.edit_task') : t('tasks.confirm_task')}</span>}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('tasks.subject')} <span className="text-red-500">*</span></label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('tasks.subject_placeholder')}
                className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary-accent/10 focus:border-primary-accent transition-all font-bold text-gray-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('tasks.due_date')} <span className="text-red-500">*</span></label>
              <input
                required
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary-accent/10 focus:border-primary-accent transition-all font-bold text-gray-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('tasks.priority')}</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary-accent/10 focus:border-primary-accent transition-all font-bold text-gray-900"
              >
                <option value="Low">{t('tasks.low')}</option>
                <option value="Medium">{t('tasks.medium')}</option>
                <option value="High">{t('tasks.high')}</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('tasks.assigned_to')}</label>
              {isAdmin ? (
              <select
                required
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary-accent/10 focus:border-primary-accent transition-all font-bold text-gray-900"
              >
                <option value="">{t('tasks.auto_assign_self')}</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              ) : (
              <select
                required
                disabled
                value={String(user?.id || formData.assigned_to || '')}
                onChange={() => {}}
                className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 opacity-90 cursor-not-allowed"
              >
                <option value={String(user?.id || '')}>{user?.name || t('tasks.only_me')}</option>
              </select>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('tasks.entity_module')}</label>
              <select
                value={formData.related_to_type}
                onChange={(e) => setFormData({ ...formData, related_to_type: e.target.value, related_to_id: '' })}
                className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary-accent/10 focus:border-primary-accent transition-all font-bold text-gray-900"
              >
                <option value="">{t('tasks.no_link')}</option>
                <option value="lead">{t('leads.title')}</option>
                <option value="deal">{t('deals.title') || 'Deals'}</option>
                <option value="contact">{t('contacts.title')}</option>
                <option value="company">{t('companies.title')}</option>
                <option value="project">{t('projects.title')}</option>
              </select>
            </div>
            {formData.related_to_type && (
              <div className="md:col-span-2">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">{(t('tasks.select_specific') || '').replace('{{type}}', formData.related_to_type)}</label>
                <select
                  required
                  value={formData.related_to_id}
                  onChange={(e) => setFormData({ ...formData, related_to_id: e.target.value })}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary-accent/10 focus:border-primary-accent transition-all font-bold text-gray-900"
                >
                  <option value="">{t('tasks.select_item')}</option>
                  {entityLoading ? <option disabled>{t('tasks.loading')}</option> : entities.map(en => <option key={en.id} value={en.id}>{en.name}</option>)}
                </select>
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('tasks.description')}</label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('tasks.description_placeholder')}
                className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary-accent/10 focus:border-primary-accent transition-all font-bold text-gray-900 resize-none"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button variant="outline" size="lg" onClick={() => setIsModalOpen(false)} className="px-8 rounded-2xl border-gray-100">{t('tasks.cancel')}</Button>
            <Button variant="primary" size="lg" type="submit" className="px-12 rounded-2xl bg-black text-white hover:bg-gray-900 shadow-xl">{editingTask ? t('tasks.save_changes') : t('tasks.confirm_task')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TaskDashboard;
