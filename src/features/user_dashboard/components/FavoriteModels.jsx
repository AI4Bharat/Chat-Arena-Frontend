import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import { ProviderIcons } from '../../../shared/icons';

export function FavoriteModels({ models }) {
    const hasModels = models && models.length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-fit"
        >
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">Most Used Models</h3>
                <p className="text-sm text-gray-500 mt-1">
                    Your frequently used models by message count
                </p>
            </div>

            {hasModels ? (
                <div className="overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
                    <div className="min-w-[300px] space-y-4">
                        {models.map((model, idx) => {
                            const Icon = ProviderIcons[model.model__provider?.toLowerCase()] || Bot;

                            return (
                                <div key={model.model__id || idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center p-1.5 border border-gray-200">
                                            <Icon className="w-full h-full object-contain" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-800">{model.model__display_name}</div>
                                            <div className="text-xs text-gray-500 capitalize">{model.model__provider}</div>
                                        </div>
                                    </div>
                                    <div className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {model.usage_count} uses
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
                    <div className="p-3 bg-gray-100 rounded-full mb-3">
                        <Bot className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="font-medium text-gray-900 mb-1">No favorites yet</p>
                    <p className="text-xs">Start chatting with models to track your favorites!</p>
                </div>
            )}
        </motion.div>
    );
}
