import { useLanguage } from '../../context/LanguageContext';

const PREDEFINED_COLORS = [
    '#22c55e', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#f59e0b', '#eab308', '#ec4899', '#64748b',
    '#166534', '#065f46', '#1e40af', '#3730a3', '#5b21b6', '#92400e', '#854d0e', '#9d174d', '#1e293b'
];

const ColorPicker = ({ value, onChange, label }) => {
    const { t } = useLanguage();
    const displayLabel = label || t('common.choose_color');
    return (
        <div className="space-y-3">
            {displayLabel && (
                <label className="block text-xs font-black text-gray-700 uppercase tracking-widest">
                    {displayLabel}
                </label>
            )}
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                {PREDEFINED_COLORS.map((color) => (
                    <button
                        key={color}
                        type="button"
                        onClick={() => onChange(color)}
                        className={`w-8 h-8 rounded-xl border-2 transition-all duration-200 hover:scale-110 active:scale-95 ${value === color
                            ? 'border-gray-900 shadow-md ring-2 ring-gray-200'
                            : 'border-white shadow-sm hover:shadow-md'
                            }`}
                        style={{ backgroundColor: color }}
                        title={color}
                    />
                ))}

                {/* Custom Color Input for Flexibility (Small and Discrete) */}
                <div className="relative w-8 h-8 rounded-xl overflow-hidden border-2 border-white shadow-sm group">
                    <input
                        type="color"
                        value={value || '#3b82f6'}
                        onChange={(e) => onChange(e.target.value)}
                        className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] cursor-pointer bg-transparent border-none"
                    />
                </div>
            </div>

            {/* Show Selected Hex (Optional, but good for feedback) */}
            <div className="flex items-center gap-2 mt-2">
                <div
                    className="w-4 h-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: value }}
                />
                <span className="text-[10px] font-mono font-bold text-gray-400 tracking-wider">
                    {value?.toUpperCase() || '#---'}
                </span>
            </div>
        </div>
    );
};

export default ColorPicker;
