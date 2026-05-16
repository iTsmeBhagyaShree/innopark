import React, { useState, useEffect } from 'react';
import {
    IoCheckmarkCircleOutline,
    IoCalendarOutline,
    IoMailOutline,
    IoCallOutline,
    IoAdd,
    IoAlertCircle,
    IoChevronForward
} from 'react-icons/io5';
import { tasksAPI, meetingsAPI } from '../../api';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const PriorityActivities = ({ relatedToType, relatedToId, companyId, t }) => {
    const [tasks, setTasks] = useState([]);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);

    const safeTranslate = (key, fallback, options) => {
        if (!t) return fallback;
        const res = t(key, options);
        return res === key ? fallback : res;
    };

    useEffect(() => {
        fetchPriorityData();
    }, [relatedToType, relatedToId]);

    const fetchPriorityData = async () => {
        try {
            setLoading(true);
            const [tasksRes, meetingsRes] = await Promise.all([
                tasksAPI.getAll({
                    company_id: companyId,
                    related_to_type: relatedToType,
                    related_to_id: relatedToId,
                    status: 'Pending' // We only want pending tasks
                }),
                meetingsAPI.getAll({
                    company_id: companyId,
                    related_to_type: relatedToType,
                    related_to_id: relatedToId,
                    status: 'Scheduled' // We only want upcoming meetings
                })
            ]);

            if (tasksRes.data.success) {
                // Also include overdue tasks
                const overdueRes = await tasksAPI.getAll({
                    company_id: companyId,
                    related_to_type: relatedToType,
                    related_to_id: relatedToId,
                    status: 'Overdue'
                });
                const allPending = [...(tasksRes.data.data || [])];
                if (overdueRes.data.success) {
                    allPending.push(...(overdueRes.data.data || []));
                }
                setTasks(allPending.sort((a, b) => new Date(a.due_date) - new Date(b.due_date)));
            }

            if (meetingsRes.data.success) {
                setMeetings(meetingsRes.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching priority activities:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null;

    const activeCount = tasks.length + meetings.length;
    if (activeCount === 0) return null;

    return (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200">
                            <IoAlertCircle size={28} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-amber-900 uppercase tracking-wider">{safeTranslate('common.priority_activities', 'Prioritäre Aktivitäten')}</h3>
                            <p className="text-sm text-amber-700 font-medium">{safeTranslate('common.active_items_count', `${activeCount} ausstehende Aufgaben & Termine`, { count: activeCount })}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pending Tasks */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <IoCheckmarkCircleOutline size={14} /> {safeTranslate('tasks.pending', 'Anstehende Aufgaben')}
                        </h4>
                        {tasks.slice(0, 3).map(task => (
                            <div key={task.id} className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-amber-100 flex items-center justify-between group hover:bg-white transition-all hover:shadow-md">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${task.status === 'Overdue' ? 'bg-red-500 animate-pulse' : 'bg-amber-400'}`} />
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-900 text-sm truncate">{task.title}</p>
                                        <p className="text-[10px] text-gray-500 font-medium">
                                            {task.status === 'Overdue' ? (
                                                <span className="text-red-600 font-black uppercase">{safeTranslate('tasks.overdue', 'Überfällig')}</span>
                                            ) : (
                                                new Date(task.due_date).toLocaleDateString()
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <IoChevronForward className="text-amber-300 group-hover:text-amber-500 transition-colors" />
                            </div>
                        ))}
                        {tasks.length > 3 && (
                            <button className="text-xs font-black text-amber-600 uppercase tracking-widest hover:text-amber-800 transition-colors pl-6">
                                + {tasks.length - 3} {safeTranslate('common.more_tasks', 'weitere Aufgaben')}
                            </button>
                        )}
                    </div>

                    {/* Upcoming Meetings */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <IoCalendarOutline size={14} /> {safeTranslate('meetings.upcoming', 'Kommende Termine')}
                        </h4>
                        {meetings.slice(0, 3).map(meeting => (
                            <div key={meeting.id} className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-amber-100 flex items-center justify-between group hover:bg-white transition-all hover:shadow-md">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-900 text-sm truncate">{meeting.title || meeting.subject}</p>
                                        <p className="text-[10px] text-gray-500 font-medium">
                                            {new Date(meeting.meeting_date || meeting.start_time).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <IoChevronForward className="text-amber-300 group-hover:text-amber-500 transition-colors" />
                            </div>
                        ))}
                        {meetings.length === 0 && (
                            <p className="text-xs text-amber-400 italic pl-6">{safeTranslate('meetings.no_upcoming', 'Keine kommenden Termine')}</p>
                        )}
                        {meetings.length > 3 && (
                            <button className="text-xs font-black text-amber-600 uppercase tracking-widest hover:text-amber-800 transition-colors pl-6">
                                + {meetings.length - 3} {safeTranslate('common.more_meetings', 'weitere Termine')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PriorityActivities;
