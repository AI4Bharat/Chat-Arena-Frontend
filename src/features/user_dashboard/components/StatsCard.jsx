import { motion } from 'framer-motion';

export function StatsCard({ title, value, icon: Icon, description, trend, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-900">
                        {value}
                    </h3>
                    {description && (
                        <p className="text-xs text-gray-400 mt-2">{description}</p>
                    )}
                </div>
                {Icon && (
                    <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                        <Icon className="w-6 h-6 text-orange-500" />
                    </div>
                )}
            </div>
            {trend && (
                <div className="mt-4 flex items-center gap-2 text-xs">
                    <span className={trend > 0 ? "text-green-600" : "text-red-600"}>
                        {trend > 0 ? "+" : ""}{trend}%
                    </span>
                    <span className="text-gray-400">vs last month</span>
                </div>
            )}
        </motion.div>
    );
}
