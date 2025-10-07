import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updatePreferences } from '../store/authSlice';
import { Settings, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function UserPreferences({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [preferences, setPreferences] = useState(user?.preferences || {});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await dispatch(updatePreferences({ preferences })).unwrap();
      toast.success('Preferences saved');
      onClose();
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings size={24} />
            <h2 className="text-xl font-semibold">User Preferences</h2>
          </div>

          <div className="space-y-4">
            {/* Theme preference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <select
                value={preferences.theme || 'light'}
                onChange={(e) => setPreferences({...preferences, theme: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            {/* Default model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Model
              </label>
              <select
                value={preferences.default_model || ''}
                onChange={(e) => setPreferences({...preferences, default_model: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No preference</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3">Claude 3</option>
                <option value="gemini-pro">Gemini Pro</option>
              </select>
            </div>

            {/* Auto-save */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Auto-save conversations
              </label>
              <input
                type="checkbox"
                checked={preferences.auto_save !== false}
                onChange={(e) => setPreferences({...preferences, auto_save: e.target.checked})}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}