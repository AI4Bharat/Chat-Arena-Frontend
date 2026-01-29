import { MessageSquare, Zap, GitCompare, Shuffle } from 'lucide-react';
import { useSelector } from 'react-redux';
import { WelcomeMessage } from './WelcomeMessage';

export function EmptyChat() {
  const { isAnonymous } = useSelector((state) => state.auth);
  const { sessions } = useSelector((state) => state.asrChat);
  
  // Show welcome message for new users
  if (sessions.length === 0) {
    return <WelcomeMessage isAnonymous={isAnonymous} />;
  }
  
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-2xl">
        <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Welcome to AI Model Playground
        </h2>
        <p className="text-gray-600 mb-8">
          Start a new conversation by selecting a mode and choosing your models
        </p>
        
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
          <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
            <Zap className="mx-auto text-blue-600 mb-2" size={24} />
            <h3 className="font-medium text-gray-900">Direct</h3>
            <p className="text-sm text-gray-500 mt-1">Chat with a single model</p>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
            <GitCompare className="mx-auto text-green-600 mb-2" size={24} />
            <h3 className="font-medium text-gray-900">Compare</h3>
            <p className="text-sm text-gray-500 mt-1">Compare two models side-by-side</p>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
            <Shuffle className="mx-auto text-purple-600 mb-2" size={24} />
            <h3 className="font-medium text-gray-900">Random</h3>
            <p className="text-sm text-gray-500 mt-1">Blind test with random models</p>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mt-8">
          Select a mode from the dropdown above to get started
        </p>
      </div>
    </div>
  );
}