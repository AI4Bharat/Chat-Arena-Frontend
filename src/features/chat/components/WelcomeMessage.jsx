import { Sparkles, Zap, GitCompare, Shuffle, AlertCircle } from 'lucide-react';

export function WelcomeMessage({ isAnonymous }) {
  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to AI Model Playground! 👋
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-400">
          Chat with and compare the world's leading AI models
        </p>
      </div>

      {isAnonymous && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-600 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-amber-900">You're using a guest account</p>
              <p className="text-sm text-amber-700 mt-1">
                {/* • Limited to 20 messages and 3 sessions
                <br /> */}
                • Sessions expire after 30 days
                <br />
                • Sign in anytime to save your progress
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200 dark:border-slate-700">
          <Zap className="text-blue-600 mb-3" size={32} />
          <h3 className="font-semibold text-gray-900 mb-2">Direct Chat</h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Have a conversation with a single AI model of your choice
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 dark:border-slate-700">
          <GitCompare className="text-green-600 mb-3" size={32} />
          <h3 className="font-semibold text-gray-900 mb-2">Compare Mode</h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Get responses from two models side-by-side to compare their capabilities
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 dark:border-slate-700">
          <Shuffle className="text-purple-600 mb-3" size={32} />
          <h3 className="font-semibold text-gray-900 mb-2">Random Mode</h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Blind test with randomly selected models - can you guess which is which?
          </p>
        </div>
      </div>

      <div className="text-center">
        <p className="text-gray-600 dark:text-slate-400 mb-4">
          Select a mode from the dropdown above to start chatting
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-slate-400">
          <Sparkles size={16} />
          <span>Powered by OpenAI, Google, Anthropic, Meta, and more</span>
        </div>
      </div>
    </div>
  );
}