import React, { useState, useEffect } from 'react';
import { meetingsAPI, usersAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext.jsx';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { IoAdd, IoLocationOutline, IoPersonOutline, IoTimeOutline, IoCalendarOutline, IoPencil, IoTrashOutline } from 'react-icons/io5';

const Meetings = ({ relatedToType, relatedToId }) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [meetings, setMeetings] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        meeting_date: '',
        start_time: '',
        end_time: '',
        location: '',
        assigned_to: '',
        reminder_datetime: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchMeetings();
    }, [relatedToType, relatedToId]);

    const fetchUsers = async () => {
        try {
            const res = await usersAPI.getAll({ company_id: user?.company_id || 1 });
            if (res.data.success) setUsers(res.data.data);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const fetchMeetings = async () => {
        setLoading(true);
        try {
            const params = {
                company_id: user?.company_id || 1,
                related_to_type: relatedToType,
                related_to_id: relatedToId
            };
            const res = await meetingsAPI.getAll(params);
            if (res.data.success) setMeetings(res.data.data);
        } catch (err) {
            console.error('Error fetching meetings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.start_time >= formData.end_time) {
            alert(t('meetings.time_error'));
            return;
        }

        try {
            const payload = {
                ...formData,
                company_id: user?.company_id || 1,
                related_to_type: relatedToType,
                related_to_id: relatedToId
            };

            if (editingMeeting) {
                await meetingsAPI.update(editingMeeting.id, payload);
            } else {
                await meetingsAPI.create(payload);
            }

            setIsModalOpen(false);
            setEditingMeeting(null);
            resetForm();
            fetchMeetings();
        } catch (err) {
            console.error('Error saving meeting:', err);
            alert(err.response?.data?.error || t('messages.saveFailed'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('meetings.confirm_delete'))) return;
        try {
            await meetingsAPI.delete(id);
            fetchMeetings();
        } catch (err) {
            console.error('Error deleting meeting:', err);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            meeting_date: '',
            start_time: '',
            end_time: '',
            location: '',
            assigned_to: user?.id || '',
            reminder_datetime: ''
        });
    };

    const openCreateModal = () => {
        setEditingMeeting(null);
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (meeting) => {
        setEditingMeeting(meeting);
        setFormData({
            title: meeting.title,
            description: meeting.description || '',
            meeting_date: meeting.meeting_date ? new Date(meeting.meeting_date).toISOString().slice(0, 10) : '',
            start_time: meeting.start_time,
            end_time: meeting.end_time,
            location: meeting.location || '',
            assigned_to: meeting.assigned_to,
            reminder_datetime: meeting.reminder_datetime ? new Date(meeting.reminder_datetime).toISOString().slice(0, 16) : ''
        });
        setIsModalOpen(true);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{t('meetings.scheduled')}</h3>
                <Button variant="primary" size="sm" onClick={openCreateModal} className="flex items-center gap-2">
                    <IoAdd /> {t('meetings.schedule')}
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {loading ? (
                    <div className="text-center py-8 text-gray-400">{t('meetings.loading')}</div>
                ) : meetings.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-500 text-sm">{t('meetings.no_meetings')}</p>
                    </div>
                ) : (
                    meetings.map(meeting => (
                        <div key={meeting.id} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md flex items-start gap-4">
                            <div className="flex flex-col items-center justify-center w-14 h-14 bg-primary-accent/10 rounded-xl text-primary-accent">
                                <span className="text-xs font-bold uppercase">{new Date(meeting.meeting_date).toLocaleString(t('locale') === 'de' ? 'de-DE' : 'en-US', { month: 'short' })}</span>
                                <span className="text-xl font-black">{new Date(meeting.meeting_date).getDate()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900">{meeting.title}</h4>
                                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500 font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <IoTimeOutline />
                                        {meeting.start_time.slice(0, 5)} - {meeting.end_time.slice(0, 5)}
                                    </div>
                                    {meeting.location && (
                                        <div className="flex items-center gap-1.5">
                                            <IoLocationOutline />
                                            {meeting.location}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                        <IoPersonOutline />
                                        {meeting.assigned_to_name || t('meetings.unassigned')}
                                    </div>
                                </div>
                                {meeting.description && <p className="text-xs text-gray-400 mt-2 line-clamp-1">{meeting.description}</p>}
                            </div>
                            <div className="flex items-center gap-1 self-start">
                                <button onClick={() => openEditModal(meeting)} className="p-1.5 text-gray-400 hover:text-primary-accent rounded-lg hover:bg-gray-100"><IoPencil size={16} /></button>
                                <button onClick={() => handleDelete(meeting.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100"><IoTrashOutline size={16} /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingMeeting ? t('meetings.edit_meeting') : t('meetings.schedule_meeting')}
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">{t('meetings.title')} <span className="text-red-500">*</span></label>
                        <input
                            required
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
                            placeholder={t('meetings.title_placeholder')}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">{t('meetings.date')} <span className="text-red-500">*</span></label>
                            <input
                                required
                                type="date"
                                value={formData.meeting_date}
                                onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">{t('meetings.start')} <span className="text-red-500">*</span></label>
                            <input
                                required
                                type="time"
                                value={formData.start_time}
                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">{t('meetings.end')} <span className="text-red-500">*</span></label>
                            <input
                                required
                                type="time"
                                value={formData.end_time}
                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">{t('meetings.location')}</label>
                        <div className="relative">
                            <IoLocationOutline className="absolute left-3 top-2.5 text-gray-400" />
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
                                placeholder={t('meetings.location_placeholder')}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">{t('meetings.assigned_user')} <span className="text-red-500">*</span></label>
                        <select
                            required
                            disabled={user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN'}
                            value={formData.assigned_to}
                            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <option value="">{t('meetings.select_user')}</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                        {user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN' && (
                            <p className="text-[10px] text-gray-400 mt-1 italic">{t('meetings.non_admin_note')}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">{t('meetings.description')}</label>
                        <textarea
                            rows="2"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
                            placeholder={t('meetings.agenda_placeholder')}
                        ></textarea>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">{t('meetings.set_reminder')}</label>
                        <input
                            type="datetime-local"
                            value={formData.reminder_datetime}
                            onChange={(e) => setFormData({ ...formData, reminder_datetime: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
                        <Button variant="primary" type="submit">{editingMeeting ? t('meetings.save_changes') : t('meetings.schedule')}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Meetings;
