import { motion } from 'framer-motion';
import { MessageSquare, Mic, Image as ImageIcon, FileText } from 'lucide-react';
import { getLanguageName } from '../../../shared/utils/language';

const MODE_LABELS = {
    compare: 'Compare Models',
    academic: 'Academic Benchmarking',
};

function TypeCard({ icon: Icon, label, count, color, total }) {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

    return (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
                    <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
                </div>
                <span className="text-xs font-mono text-gray-500">{percentage}%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{count}</div>
            <div className="text-xs text-gray-500">{label}</div>
        </div>
    );
}

export function UsageCharts({ languageStats, sessionBreakdown, chatsByType }) {
    const maxLangCount = Math.max(...Object.values(languageStats || { a: 0 }));
    const maxSessionCount = Math.max(...Object.values(sessionBreakdown || { a: 0 }));

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Session Stats */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
            >
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    Modes
                </h3>
                <div className="space-y-4">
                    {Object.entries(sessionBreakdown || {}).map(([mode, count], index) => (
                        <div key={mode}>
                            <div className="flex justify-between text-sm text-gray-500 mb-1">
                                <span className="capitalize">
                                    {MODE_LABELS[mode] || mode || 'Unknown'}
                                </span>
                                <span>{count}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(count / maxSessionCount) * 100}%` }}
                                    transition={{ duration: 1, delay: index * 0.1 }}
                                    className="h-full bg-purple-500 rounded-full"
                                />
                            </div>
                        </div>
                    ))}
                    {Object.keys(sessionBreakdown || {}).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="p-3 bg-purple-50 rounded-full mb-3">
                                <MessageSquare className="w-6 h-6 text-purple-400" />
                            </div>
                            <p className="font-medium text-gray-900 mb-1">No sessions yet</p>
                            <p className="text-xs text-gray-500">Start a new chat session to see your breakdown.</p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Language Stats */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
            >
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    Top Languages
                </h3>
                <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
                    {Object.entries(languageStats || {}).map(([lang, count], index) => (
                        <div key={lang}>
                            <div className="flex justify-between text-sm text-gray-500 mb-1">
                                <span className="capitalize">{getLanguageName(lang)}</span>
                                <span>{count} msgs</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(count / maxLangCount) * 100}%` }}
                                    transition={{ duration: 1, delay: index * 0.1 }}
                                    className="h-full bg-blue-500 rounded-full"
                                />
                            </div>
                        </div>
                    ))}
                    {Object.keys(languageStats || {}).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="p-3 bg-blue-50 rounded-full mb-3">
                                <MessageSquare className="w-6 h-6 text-blue-400" />
                            </div>
                            <p className="font-medium text-gray-900 mb-1">No language data</p>
                            <p className="text-xs text-gray-500">Chat in different languages to track usage stats.</p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Chat Types Stats */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
            >
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    Input Types
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <TypeCard
                        icon={FileText}
                        label="Text"
                        count={chatsByType?.text || 0}
                        color="bg-green-500"
                        total={Object.values(chatsByType || {}).reduce((a, b) => a + b, 0)}
                    />
                    <TypeCard
                        icon={ImageIcon}
                        label="Image"
                        count={chatsByType?.image || 0}
                        color="bg-purple-500"
                        total={Object.values(chatsByType || {}).reduce((a, b) => a + b, 0)}
                    />
                    <TypeCard
                        icon={Mic}
                        label="Audio"
                        count={chatsByType?.audio || 0}
                        color="bg-orange-500"
                        total={Object.values(chatsByType || {}).reduce((a, b) => a + b, 0)}
                    />
                    <TypeCard
                        icon={FileText}
                        label="Files"
                        count={chatsByType?.file || 0}
                        color="bg-pink-500"
                        total={Object.values(chatsByType || {}).reduce((a, b) => a + b, 0)}
                    />
                </div>
            </motion.div>
        </div>
    );
}