import { motion } from 'framer-motion';
import { Trophy, Star, Bot } from 'lucide-react';
import { ProviderIcons } from '../../../shared/icons';

export function ModelRankings({ models }) {
    const hasModels = models && models.length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
        >
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Your Top Models
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    Your Most Frequently Voted Models
                </p>
            </div>

            <div className="overflow-x-auto [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
                {hasModels ? (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Votes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {models.map((model, index) => {
                                const Icon = ProviderIcons[model.provider?.toLowerCase()] || Bot;

                                return (
                                    <tr key={model.model_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-bold text-gray-700 border border-gray-200">
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{model.display_name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center p-1.5 border border-gray-200">
                                                    <Icon className="w-full h-full object-contain" />
                                                </div>
                                                <div className="text-sm font-medium text-gray-700 capitalize">{model.provider}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                                            <span className="flex items-center justify-end gap-1">
                                                {model.votes}
                                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div className="p-3 bg-yellow-50 rounded-full mb-3">
                            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                        </div>
                        <p className="text-gray-900 font-medium mb-1">No ranked models yet</p>
                        <p className="text-sm text-gray-500 max-w-sm">
                            Vote on model responses during your chats to see your personal rankings here!
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
