import { useState, useEffect } from 'react';
import { generateSubDomains, generatePersonas, generateSituations, generateSentences, createDataset } from '../../../services/syntheticAsrApi';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, CheckCircle2, Plus, Trash2 } from 'lucide-react';

// Stage 1: Initial Data Collection Form
function Stage1DataCollection({ data, onDataChange, onNext, fastTrackEnabled, onFastTrackChange, onStageChange }) {

  const handleInputChange = (field, value) => {
    onDataChange({ ...data, [field]: value });
  };

  const handleCheckboxChange = (style) => {
    const styles = data.sentenceStyles || [];
    const updated = styles.includes(style)
      ? styles.filter(s => s !== style)
      : [...styles, style];
    onDataChange({ ...data, sentenceStyles: updated });
  };

  const handleFastTrack = (enabled) => {
    onFastTrackChange(enabled);
    if (enabled) {
      onDataChange({
        ...data,
        sentenceStyles: ['Conversational'],
        duration: '10'
      });
      // Immediately navigate to Stage 6 (final stage)
      onStageChange(6);
    } else {
      onDataChange({
        ...data,
        sentenceStyles: [],
        duration: ''
      });
      // Return to Stage 1 when unchecked
      onStageChange(1);
    }
  };

  const sentenceStyles = ['Conversational', 'Read', 'Command', 'Descriptive', 'Formal', 'Informal', 'Emotional'];

  return (
    <div className="space-y-3 sm:space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Create Your Dataset</h2>
          <p className="text-xs sm:text-sm text-gray-600">Fill in the information about your synthetic ASR dataset</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={fastTrackEnabled}
            onChange={(e) => handleFastTrack(e.target.checked)}
            className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500 accent-orange-500"
          />
          <span className="text-sm text-gray-700 font-medium">⚡ Fast Track</span>
        </label>
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Category *</label>
        <select
          value={data.category || ''}
          onChange={(e) => handleInputChange('category', e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
        >
          <option value="">Select a category</option>
          <option value="Agriculture">Agriculture</option>
          <option value="Healthcare">Healthcare</option>
          <option value="Finance">Finance</option>
          <option value="Education">Education</option>
          <option value="Technology">Technology</option>
          <option value="Retail">Retail</option>
          <option value="Manufacturing">Manufacturing</option>
          <option value="Transportation">Transportation</option>
          <option value="Hospitality">Hospitality</option>
          <option value="Government">Government</option>
        </select>
      </div>

      {/* Language */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Language *</label>
        <select
          value={data.language || ''}
          onChange={(e) => handleInputChange('language', e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
        >
          <option value="">Select a language</option>
          <option value="hindi">Hindi</option>
          <option value="tamil">Tamil</option>
          <option value="telugu">Telugu</option>
          <option value="kannada">Kannada</option>
          <option value="malayalam">Malayalam</option>
          <option value="bengali">Bengali</option>
          <option value="gujarati">Gujarati</option>
          <option value="marathi">Marathi</option>
          <option value="punjabi">Punjabi</option>
        </select>
      </div>

      {/* Sentence Styles */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Sentence Styles *</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {sentenceStyles.map((style) => (
            <label key={style} className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors">
              <input
                type="checkbox"
                checked={(data.sentenceStyles || []).includes(style)}
                onChange={() => handleCheckboxChange(style)}
                className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500 accent-orange-500"
              />
              <span className="text-sm text-gray-700">{style}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Duration (hours)</label>
        <input
          type="number"
          value={data.duration || ''}
          onChange={(e) => handleInputChange('duration', e.target.value)}
          placeholder="e.g., 1, 2.5, 10"
          min="0"
          step="0.5"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Description</label>
        <textarea
          value={data.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Provide any additional context or requirements..."
          rows="2"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm resize-none"
        />
      </div>

      {/* Entities */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Related Entities</label>
        <textarea
          value={data.entities || ''}
          onChange={(e) => handleInputChange('entities', e.target.value)}
          placeholder="Comma separated (e.g., crop types, soil conditions)"
          rows="2"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm resize-none"
        />
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onNext}
          disabled={!data.category || !data.language || (data.sentenceStyles || []).length === 0}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm w-full sm:w-auto"
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// Stage 2: Sub Domains Generated
function Stage2SubDomains({ data, onDataChange, onNext, onPrev }) {
  const [subDomains, setSubDomains] = useState(data.subDomains || []);
  const [isCustomizeMode, setIsCustomizeMode] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const subDomains = await generateSubDomains(data);
      setSubDomains(subDomains);
      onDataChange({ ...data, subDomains });
    } catch (error) {
      console.error('Error generating subdomains:', error);
      // TODO: Replace with toast
      alert('Failed to generate subdomains: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!customPrompt.trim()) return;

    setIsRegenerating(true);
    try {
      const newDomains = await generateSubDomains({ ...data }, customPrompt);
      setSubDomains(newDomains);
      onDataChange({ ...data, subDomains: newDomains });

      setCustomPrompt('');
      setIsCustomizeMode(false);
    } catch (error) {
      console.error('Error regenerating subdomains:', error);
      // TODO: Show error toast/notification
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Sub domains generated</h2>
        <p className="text-xs sm:text-sm text-gray-600">These are the sub domains based on your category. Verify and customize as needed</p>
      </div>

      {/* Info Box (compact, single-line pill) */}
      <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-blue-50 border border-blue-200 max-w-full">
        <p className="text-[11px] text-blue-800 truncate">
          <span className="font-semibold">Tip:</span>&nbsp;Not satisfied? Use "Customize with prompt" to regenerate domains.
        </p>
      </div>

      {/* Sub Domains List */}
      <div className="bg-white rounded-lg p-3 sm:p-5 border border-gray-200">
        {!isCustomizeMode ? (
          subDomains.length > 0 ? (
            <ul className="space-y-2">
              {subDomains.map((domain, idx) => (
                <li key={idx} className="flex items-center gap-3 text-gray-700 p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition-colors">
                  <CheckCircle2 size={18} className="text-orange-500 flex-shrink-0" />
                  <span className="text-sm">{domain}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm mb-4">No subdomains generated yet.</p>
              <p className="text-gray-400 text-xs mb-6">Generate subdomains based on your selected category, or use "Customize with prompt" for more control.</p>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-6 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating...' : 'Generate Subdomains'}
              </button>
            </div>
          )
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                Describe the subdomains you want to generate:
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Example: Include organic farming and irrigation systems. Focus on sustainable practices. Exclude dairy farming."
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none"
              />
              <p className="text-[10px] sm:text-xs text-gray-500 mt-2">
                Write in natural language what subdomains you'd like to see
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRegenerate}
                disabled={!customPrompt.trim() || isRegenerating}
                className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isRegenerating ? 'Regenerating...' : 'Regenerate Subdomains'}
              </button>
              <button
                onClick={() => {
                  setIsCustomizeMode(false);
                  setCustomPrompt('');
                }}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onPrev}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm w-full sm:w-auto order-2 sm:order-1"
        >
          <ChevronLeft size={16} /> Back
        </button>
        {!isCustomizeMode && (
          <button
            onClick={() => setIsCustomizeMode(true)}
            className="px-4 sm:px-6 py-2.5 border border-orange-500 text-orange-500 rounded-lg font-semibold hover:bg-orange-50 transition-colors text-sm w-full sm:w-auto order-3 sm:order-2"
          >
            Customize with prompt
          </button>
        )}
        <button
          onClick={onNext}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors text-sm w-full sm:w-auto order-1 sm:order-3"
        >
          Proceed <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// Stage 3: Topics and Persona
function Stage3TopicsPersona({ data, onDataChange, onPrev, onNext }) {
  const [personas, setPersonas] = useState(data.personas || []);
  const [isCustomizeMode, setIsCustomizeMode] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedPersonas, setEditedPersonas] = useState([...personas]);
  const [newTopic, setNewTopic] = useState('');
  const [newPersona, setNewPersona] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Backend Integration - Auto-generate personas when stage loads
  // Auto-generate personas when stage loads
  useEffect(() => {
    const fetchPersonas = async () => {
      if (personas.length === 0 && data.subDomains?.length > 0) {
        setIsLoading(true);
        try {
          const newPersonas = await generatePersonas(data);
          setPersonas(newPersonas);
          setEditedPersonas(newPersonas);
          onDataChange({ ...data, personas: newPersonas });
        } catch (error) {
          console.error('Error generating personas:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchPersonas();
  }, []);

  const handleRegenerate = async () => {
    if (!customPrompt.trim()) return;

    setIsRegenerating(true);
    try {
      // TODO: Backend Integration - Regenerate personas with custom prompt
      // const response = await apiClient.post('/synthetic-asr/regenerate-personas', {
      //   category: data.category,
      //   language: data.language,
      //   subDomains: data.subDomains,
      //   prompt: customPrompt,
      // });
      // const newPersonas = response.data.personas;
      // setPersonas(newPersonas);
      // setEditedPersonas(newPersonas);
      // onDataChange({ ...data, personas: newPersonas });

      const newPersonas = await generatePersonas({ ...data }, customPrompt);
      setPersonas(newPersonas);
      setEditedPersonas(newPersonas);
      onDataChange({ ...data, personas: newPersonas });

      setCustomPrompt('');
      setIsCustomizeMode(false);
    } catch (error) {
      console.error('Error regenerating personas:', error);
      // TODO: Show error toast/notification
    } finally {
      setIsRegenerating(false);
    }
  };


  const handleAddPersona = () => {
    if (newTopic.trim() && newPersona.trim()) {
      setEditedPersonas([...editedPersonas, { topic: newTopic.trim(), persona: newPersona.trim() }]);
      setNewTopic('');
      setNewPersona('');
    }
  };

  const handleDeletePersona = (idx) => {
    setEditedPersonas(editedPersonas.filter((_, i) => i !== idx));
  };

  const handleEditPersona = (idx, field, value) => {
    const updated = [...editedPersonas];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditedPersonas(updated);
  };

  const handleSaveEdit = () => {
    setPersonas(editedPersonas);
    onDataChange({ ...data, personas: editedPersonas });
    setIsEditMode(false);
  };

  return (
    <div className="space-y-3 sm:space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Topics and Persona</h2>
        <p className="text-xs sm:text-sm text-gray-600">Verify and edit the personas for your dataset</p>
      </div>

      {/* Personas List */}
      <div className="bg-white rounded-lg p-3 sm:p-5 border border-gray-200 max-h-96 overflow-y-auto">
        {!isCustomizeMode && !isEditMode ? (
          personas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {personas.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <dl className="grid grid-cols-3 gap-x-2 gap-y-1 text-sm">
                    <dt className="col-span-1 text-gray-600 font-semibold">Sub Domain :</dt>
                    <dd className="col-span-2 text-gray-900 break-words">{item.subDomain || '—'}</dd>

                    <dt className="col-span-1 text-gray-600 font-semibold">Topic :</dt>
                    <dd className="col-span-2 text-gray-900 break-words">{item.topic}</dd>

                    <dt className="col-span-1 text-gray-600 font-semibold">Persona :</dt>
                    <dd className="col-span-2 text-gray-900 break-words">{item.persona}</dd>
                  </dl>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm mb-4">No topics and personas generated yet.</p>
              <p className="text-gray-400 text-xs">These will be automatically generated based on your category and subdomains, or you can use "Customize with prompt" for more control.</p>
            </div>
          )
        ) : isCustomizeMode ? (
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                Describe the topics and personas you want to generate:
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Example: Include topics about crop rotation and pest management. Focus on farmers and agricultural experts. Exclude dairy-related topics."
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none"
              />
              <p className="text-[10px] sm:text-xs text-gray-500 mt-2">
                Write in natural language what topics and personas you'd like to see
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRegenerate}
                disabled={!customPrompt.trim() || isRegenerating}
                className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isRegenerating ? 'Regenerating...' : 'Regenerate Topics & Personas'}
              </button>
              <button
                onClick={() => {
                  setIsCustomizeMode(false);
                  setCustomPrompt('');
                }}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {editedPersonas.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <input
                  type="text"
                  value={item.topic}
                  onChange={(e) => handleEditPersona(idx, 'topic', e.target.value)}
                  placeholder="Topic"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
                <input
                  type="text"
                  value={item.persona}
                  onChange={(e) => handleEditPersona(idx, 'persona', e.target.value)}
                  placeholder="Persona"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
                <button
                  onClick={() => handleDeletePersona(idx)}
                  className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg font-semibold transition-colors whitespace-nowrap text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
            {/* Add New Persona */}
            <div className="flex items-center gap-2.5 pt-3 border-t border-gray-300">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Topic"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleAddPersona()}
              />
              <input
                type="text"
                value={newPersona}
                onChange={(e) => setNewPersona(e.target.value)}
                placeholder="Persona"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleAddPersona()}
              />
              <button
                onClick={handleAddPersona}
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors whitespace-nowrap text-sm"
              >
                Add
              </button>
            </div>
            {/* Save Changes */}
            <button
              onClick={handleSaveEdit}
              className="w-full mt-4 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors text-sm"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onPrev}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm w-full sm:w-auto order-2 sm:order-1"
        >
          <ChevronLeft size={16} /> Back
        </button>
        {!isCustomizeMode && (
          <button
            onClick={() => setIsCustomizeMode(true)}
            className="px-4 sm:px-6 py-2.5 border border-orange-500 text-orange-500 rounded-lg font-semibold hover:bg-orange-50 transition-colors text-sm w-full sm:w-auto order-3 sm:order-2"
          >
            Customize with prompt
          </button>
        )}
        <button
          onClick={onNext}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors text-sm w-full sm:w-auto order-1 sm:order-3"
        >
          Proceed <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// Stage 4: Situations
function Stage4Situations({ data, onDataChange, onPrev, onNext }) {
  const [situations, setSituations] = useState(data.situations || []);
  const [isCustomizeMode, setIsCustomizeMode] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedSituations, setEditedSituations] = useState([...situations]);
  const [newSituation, setNewSituation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Backend Integration - Auto-generate situations when stage loads
  // Auto-generate situations when stage loads
  useEffect(() => {
    const fetchSituations = async () => {
      if (situations.length === 0 && data.personas?.length > 0) {
        setIsLoading(true);
        try {
          const newSituations = await generateSituations(data);
          setSituations(newSituations);
          setEditedSituations(newSituations);
          onDataChange({ ...data, situations: newSituations });
        } catch (error) {
          console.error('Error generating situations:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchSituations();
  }, []);

  const handleRegenerate = async () => {
    if (!customPrompt.trim()) return;

    setIsRegenerating(true);
    try {
      const newSituations = await generateSituations({ ...data }, customPrompt);
      setSituations(newSituations);
      setEditedSituations(newSituations);
      onDataChange({ ...data, situations: newSituations });

      setCustomPrompt('');
      setIsCustomizeMode(false);
    } catch (error) {
      console.error('Error regenerating situations:', error);
      // TODO: Show error toast/notification
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleAddSituation = () => {
    if (newSituation.trim()) {
      setEditedSituations([...editedSituations, newSituation.trim()]);
      setNewSituation('');
    }
  };

  const handleDeleteSituation = (idx) => {
    setEditedSituations(editedSituations.filter((_, i) => i !== idx));
  };

  const handleEditSituation = (idx, value) => {
    const updated = [...editedSituations];
    updated[idx] = value;
    setEditedSituations(updated);
  };

  const handleSaveEdit = () => {
    setSituations(editedSituations);
    onDataChange({ ...data, situations: editedSituations });
    setIsEditMode(false);
  };

  return (
    <div className="space-y-3 sm:space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Situations</h2>
        <p className="text-xs sm:text-sm text-gray-600">Verify and edit the situations for your dataset</p>
      </div>

      {/* Situations List */}
      <div className="bg-white rounded-lg p-3 sm:p-5 border border-gray-200 max-h-96 overflow-y-auto">
        {!isCustomizeMode && !isEditMode ? (
          situations.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {situations.map((situation, idx) => {
                // Handle both string and object formats
                const situationText = typeof situation === 'string' ? situation : situation.scenario;
                const subDomain = typeof situation === 'object' ? situation.subDomain : null;
                const topic = typeof situation === 'object' ? situation.topic : null;
                const persona = typeof situation === 'object' ? situation.persona : null;

                return (
                  <div
                    key={idx}
                    className="group relative bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-orange-300 transition-all duration-300 ease-in-out"
                  >
                    {/* Context Info - Stage 2 & 3 */}
                    {(subDomain || topic || persona) && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-xs text-gray-500">
                        {subDomain && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium text-gray-400">Domain:</span>
                            <span>{subDomain}</span>
                          </span>
                        )}
                        {topic && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium text-gray-400">Topic:</span>
                            <span>{topic}</span>
                          </span>
                        )}
                        {persona && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium text-gray-400">Persona:</span>
                            <span>{persona}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Situation Text */}
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-orange-500 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {situationText}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm mb-4">No situations generated yet.</p>
              <p className="text-gray-400 text-xs">Situations will be automatically generated based on your previous inputs, or you can use "Customize with prompt" for more control.</p>
            </div>
          )
        ) : isCustomizeMode ? (
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                Describe the situations you want to generate:
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Example: Include situations about farm equipment maintenance and seasonal planning. Focus on practical scenarios. Exclude emergency situations."
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none"
              />
              <p className="text-[10px] sm:text-xs text-gray-500 mt-2">
                Write in natural language what situations you'd like to see
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRegenerate}
                disabled={!customPrompt.trim() || isRegenerating}
                className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isRegenerating ? 'Regenerating...' : 'Regenerate Situations'}
              </button>
              <button
                onClick={() => {
                  setIsCustomizeMode(false);
                  setCustomPrompt('');
                }}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {editedSituations.map((situation, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <input
                  type="text"
                  value={situation}
                  onChange={(e) => handleEditSituation(idx, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
                <button
                  onClick={() => handleDeleteSituation(idx)}
                  className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg font-semibold transition-colors whitespace-nowrap text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
            {/* Add New Situation */}
            <div className="flex items-center gap-2.5 pt-3 border-t border-gray-300">
              <input
                type="text"
                value={newSituation}
                onChange={(e) => setNewSituation(e.target.value)}
                placeholder="Add new situation"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleAddSituation()}
              />
              <button
                onClick={handleAddSituation}
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors whitespace-nowrap text-sm"
              >
                Add
              </button>
            </div>
            {/* Save Changes */}
            <button
              onClick={handleSaveEdit}
              className="w-full mt-4 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors text-sm"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onPrev}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm w-full sm:w-auto order-2 sm:order-1"
        >
          <ChevronLeft size={16} /> Back
        </button>
        {!isCustomizeMode && (
          <button
            onClick={() => setIsCustomizeMode(true)}
            className="px-4 sm:px-6 py-2.5 border border-orange-500 text-orange-500 rounded-lg font-semibold hover:bg-orange-50 transition-colors text-sm w-full sm:w-auto order-3 sm:order-2"
          >
            Customize with prompt
          </button>
        )}
        <button
          onClick={onNext}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors text-sm w-full sm:w-auto order-1 sm:order-3"
        >
          Proceed <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// Stage 5: Sample Sentences
function Stage5SampleSentences({ data, onDataChange, onPrev, onNext }) {
  const [sentences, setSentences] = useState(data.sentences || []);
  const [isCustomizeMode, setIsCustomizeMode] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [newSentence, setNewSentence] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedSentences, setEditedSentences] = useState([...sentences]);
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Backend Integration - Auto-generate sample sentences when stage loads
  // Auto-generate sentences when stage loads
  useEffect(() => {
    const fetchSentences = async () => {
      if (sentences.length === 0 && data.situations?.length > 0) {
        setIsLoading(true);
        try {
          const newSentences = await generateSentences(data);
          setSentences(newSentences);
          setEditedSentences(newSentences);
          onDataChange({ ...data, sentences: newSentences });
        } catch (error) {
          console.error('Error generating sentences:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchSentences();
  }, []);

  const handleRegenerate = async () => {
    if (!customPrompt.trim()) return;

    setIsRegenerating(true);
    try {
      const newSentences = await generateSentences({ ...data }, customPrompt);
      setSentences(newSentences);
      setEditedSentences(newSentences);
      onDataChange({ ...data, sentences: newSentences });

      setCustomPrompt('');
      setIsCustomizeMode(false);
    } catch (error) {
      console.error('Error regenerating sentences:', error);
      // TODO: Show error toast/notification
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleAddSentence = () => {
    if (newSentence.trim()) {
      setEditedSentences([...editedSentences, newSentence.trim()]);
      setNewSentence('');
    }
  };

  const handleDeleteSentence = (idx) => {
    setEditedSentences(editedSentences.filter((_, i) => i !== idx));
  };

  const handleEditSentence = (idx, value) => {
    const updated = [...editedSentences];
    updated[idx] = value;
    setEditedSentences(updated);
  };

  const handleSaveEdit = () => {
    setSentences(editedSentences);
    onDataChange({ ...data, sentences: editedSentences });
    setIsEditMode(false);
  };

  return (
    <div className="space-y-3 sm:space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Sample Sentences</h2>
        <p className="text-xs sm:text-sm text-gray-600">Verify and edit the sample sentences for your dataset</p>
      </div>

      {/* Sentences List */}
      <div className="bg-white rounded-lg p-3 sm:p-5 border border-gray-200 max-h-96 overflow-y-auto">
        {!isCustomizeMode && !isEditMode ? (
          sentences.length > 0 ? (
            <ul className="space-y-2.5">
              {sentences.map((sentence, idx) => (
                <li key={idx} className="flex items-start gap-3 text-gray-700 p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition-colors">
                  <CheckCircle2 size={18} className="text-orange-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{sentence}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm mb-4">No sample sentences generated yet.</p>
              <p className="text-gray-400 text-xs">Sample sentences will be automatically generated based on your configuration, or you can use "Customize with prompt" for more control.</p>
            </div>
          )
        ) : isCustomizeMode ? (
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                Describe the sample sentences you want to generate:
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Example: Include sentences about daily farming activities and weather conditions. Focus on conversational style. Exclude technical jargon."
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none"
              />
              <p className="text-[10px] sm:text-xs text-gray-500 mt-2">
                Write in natural language what sample sentences you'd like to see
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRegenerate}
                disabled={!customPrompt.trim() || isRegenerating}
                className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isRegenerating ? 'Regenerating...' : 'Regenerate Sentences'}
              </button>
              <button
                onClick={() => {
                  setIsCustomizeMode(false);
                  setCustomPrompt('');
                }}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {editedSentences.map((sentence, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <input
                  type="text"
                  value={sentence}
                  onChange={(e) => handleEditSentence(idx, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
                <button
                  onClick={() => handleDeleteSentence(idx)}
                  className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg font-semibold transition-colors whitespace-nowrap text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
            {/* Add New Sentence */}
            <div className="flex items-center gap-2.5 pt-3 border-t border-gray-300">
              <input
                type="text"
                value={newSentence}
                onChange={(e) => setNewSentence(e.target.value)}
                placeholder="Add new sentence"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleAddSentence()}
              />
              <button
                onClick={handleAddSentence}
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors whitespace-nowrap text-sm"
              >
                Add
              </button>
            </div>
            {/* Save Changes */}
            <button
              onClick={handleSaveEdit}
              className="w-full mt-4 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors text-sm"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onPrev}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm w-full sm:w-auto order-2 sm:order-1"
        >
          <ChevronLeft size={16} /> Back
        </button>
        {!isCustomizeMode && (
          <button
            onClick={() => setIsCustomizeMode(true)}
            className="px-4 sm:px-6 py-2.5 border border-orange-500 text-orange-500 rounded-lg font-semibold hover:bg-orange-50 transition-colors text-sm w-full sm:w-auto order-3 sm:order-2"
          >
            Customize with prompt
          </button>
        )}
        <button
          onClick={onNext}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors text-sm w-full sm:w-auto order-1 sm:order-3"
        >
          Proceed <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// Stage 6: Audio Details
function Stage6AudioDetails({ data, onDataChange, onPrev, onComplete }) {
  const [audioConfig, setAudioConfig] = useState(data.audioConfig || {
    voices: [],
    ageGroups: [],
    accent: 'normal',
    customAccent: '',
  });
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  const handleConfigChange = (field, value) => {
    setAudioConfig({ ...audioConfig, [field]: value });
  };

  const handleVoiceToggle = (voice) => {
    const voices = audioConfig.voices || [];
    const updated = voices.includes(voice)
      ? voices.filter(v => v !== voice)
      : [...voices, voice];
    setAudioConfig({ ...audioConfig, voices: updated });
  };

  const handleAgeGroupToggle = (group) => {
    const ageGroups = audioConfig.ageGroups || [];
    const updated = ageGroups.includes(group)
      ? ageGroups.filter(g => g !== group)
      : [...ageGroups, group];
    setAudioConfig({ ...audioConfig, ageGroups: updated });
  };

  const handleComplete = () => {
    const updatedData = { ...data, audioConfig };
    onDataChange(updatedData);
    // Show the preview modal with the JSON
    setShowJsonPreview(true);
  };

  return (
    <div className="space-y-3 sm:space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Audio Configuration</h2>
        <p className="text-xs sm:text-sm text-gray-600">Configure the audio generation settings for your dataset</p>
      </div>

      {/* Voice Selection */}
      <div className="bg-white rounded-lg p-3 sm:p-5 border border-gray-200">
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Select the voice (multiple):</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              value="male"
              checked={(audioConfig.voices || []).includes('male')}
              onChange={() => handleVoiceToggle('male')}
              className="w-4 h-4 text-orange-500 accent-orange-500 rounded"
            />
            <span className="text-sm text-gray-700 font-medium">Male</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              value="female"
              checked={(audioConfig.voices || []).includes('female')}
              onChange={() => handleVoiceToggle('female')}
              className="w-4 h-4 text-orange-500 accent-orange-500 rounded"
            />
            <span className="text-sm text-gray-700 font-medium">Female</span>
          </label>
        </div>
      </div>

      {/* Age Group Selection */}
      <div className="bg-white rounded-lg p-3 sm:p-5 border border-gray-200">
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Select the age group (multiple):</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['18-30', '30-45', '45-60', '60+'].map((group) => (
            <label key={group} className={`flex items-center gap-3 cursor-pointer p-3 border rounded-lg transition-colors ${(audioConfig.ageGroups || []).includes(group)
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-300 hover:border-orange-500 hover:bg-orange-50'
              }`}>
              <input
                type="checkbox"
                value={group}
                checked={(audioConfig.ageGroups || []).includes(group)}
                onChange={() => handleAgeGroupToggle(group)}
                className="w-4 h-4 text-orange-500 accent-orange-500 rounded"
              />
              <span className="text-sm text-gray-700 font-medium">{group}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onPrev}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm w-full sm:w-auto order-2 sm:order-1"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <button
          onClick={handleComplete}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors text-sm w-full sm:w-auto order-1 sm:order-2"
        >
          Start generation <ChevronRight size={16} />
        </button>
      </div>

      {/* JSON Preview Modal */}
      <AnimatePresence>
        {showJsonPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowJsonPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-96 flex flex-col"
            >
              <div className="border-b border-gray-200 p-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Final JSON Payload</h3>
                <button
                  onClick={() => setShowJsonPreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words font-mono bg-white p-3 rounded border border-gray-200">
                  {JSON.stringify({
                    sentence: {
                      category: data.category || null,
                      language: data.language || null,
                      description: data.description || '',
                      entities: data.entities || '',
                      style: data.sentenceStyles || [],
                      topic_persona_instruction: (data.personas || []).map(p => `${p.topic} - ${p.persona}`).join(' | '),
                      sub_domain_instruction: (data.subDomains || []).join(' | '),
                      scenario_instruction: (data.situations || []).join(' | '),
                    },
                    audio: {
                      gender: audioConfig.voices || [],
                      age_group: audioConfig.ageGroups || [],
                      accent: audioConfig.accent === 'custom' ? audioConfig.customAccent : audioConfig.accent || 'normal',
                    },
                    job_id: null,
                    prompt_config: [],
                    is_sample: true,
                    size: data.duration ? parseInt(data.duration) : null,
                  }, null, 2)}
                </pre>
              </div>
              <div className="border-t border-gray-200 p-4 flex gap-3 justify-end">
                <button
                  onClick={() => setShowJsonPreview(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setShowJsonPreview(false);
                    onComplete();
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"
                >
                  Confirm & Submit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Main Wizard Component
export function SyntheticASRWizard() {
  const [currentStage, setCurrentStage] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fastTrackEnabled, setFastTrackEnabled] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    language: '',
    sentenceStyles: [],
    duration: '',
    description: '',
    entities: '',
    subDomains: [],
    personas: [],
    sentences: [],
    situations: [],
    audioConfig: {
      voices: [],
      ageGroups: [],
      accent: 'normal',
      customAccent: '',
    },
  });

  const handleNext = () => {
    if (currentStage < 6) {
      // If fast-track is enabled and we're on stage 1, skip to stage 6
      if (fastTrackEnabled && currentStage === 1) {
        setCurrentStage(6);
      } else {
        setCurrentStage(currentStage + 1);
      }
    }
  };

  const handlePrev = () => {
    if (currentStage > 1) {
      setCurrentStage(currentStage - 1);
    }
  };

  const buildPayload = () => {
    // Format the data according to the backend requirements
    const payload = {
      sentence: {
        category: formData.category || null,
        language: formData.language || null,
        description: formData.description || '',
        entities: formData.entities || '',
        style: formData.sentenceStyles || [],
        topic_persona_instruction: (formData.personas || []).map(p => `${p.topic} - ${p.persona}`).join(' | '),
        sub_domain_instruction: (formData.subDomains || []).join(' | '),
        scenario_instruction: (formData.situations || []).join(' | '),
      },
      audio: {
        gender: formData.audioConfig?.voices || [],
        age_group: formData.audioConfig?.ageGroups || [],
        accent: formData.audioConfig?.accent === 'custom' ? formData.audioConfig?.customAccent : formData.audioConfig?.accent || 'normal',
      },
      job_id: null,
      prompt_config: [],
      is_sample: true,
      size: formData.duration ? parseInt(formData.duration) : null,
    };
    return payload;
  };

  const handleComplete = async () => {
    try {
      setIsSubmitting(true);

      const jobId = await createDataset(formData);
      console.log('Dataset job created:', jobId);

      // Optionally store job_id locally or just show success
      // localStorage.setItem('lastJobId', jobId);

      setIsComplete(true);
    } catch (error) {
      console.error('Error submitting dataset:', error);
      alert('Failed to submit dataset: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-2xl w-full text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-12"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={48} className="text-green-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Dataset Created Successfully!</h1>
            <p className="text-xs sm:text-sm text-gray-600 mb-6 sm:mb-8">Your synthetic ASR dataset configuration has been submitted. Audio generation will begin shortly.</p>

            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 text-left mb-6 sm:mb-8">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Configuration Summary:</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700">
                <li><span className="font-medium">Category:</span> {formData.category}</li>
                <li><span className="font-medium">Language:</span> {formData.language}</li>
                <li><span className="font-medium">Duration:</span> {formData.duration} hours</li>
                <li><span className="font-medium">Sentence Styles:</span> {formData.sentenceStyles.join(', ')}</li>
                <li><span className="font-medium">Voices:</span> {(formData.audioConfig.voices || []).join(', ') || 'None selected'}</li>
                <li><span className="font-medium">Age Groups:</span> {(formData.audioConfig.ageGroups || []).join(', ') || 'None selected'}</li>
              </ul>
            </div>

            <button
              onClick={() => {
                setIsComplete(false);
                setCurrentStage(1);
                setFormData({
                  ...formData,
                  category: '',
                  language: '',
                  sentenceStyles: [],
                  duration: '',
                  description: '',
                  entities: '',
                });
              }}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              Create Another Dataset
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Progress */}
        <div className="mb-8">
          {/* Progress Stepper */}
          <div className="relative bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6">
            {/* Background Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2" style={{
              left: 'calc(5% + 24px)',
              right: 'calc(5% + 24px)',
              width: 'calc(90% - 48px)'
            }}>
              {/* Animated Progress Fill */}
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-700 ease-out rounded-full"
                style={{
                  width: currentStage === 1 ? '0%' : `${((currentStage - 1) / 5) * 100}%`
                }}
              />
            </div>

            {/* Stage Circles */}
            <div className="relative flex justify-between items-center">
              {[1, 2, 3, 4, 5, 6].map((stage) => {
                const isCompleted = currentStage > stage;
                const isCurrent = currentStage === stage;
                const isPending = currentStage < stage;

                return (
                  <button
                    key={stage}
                    onClick={() => setCurrentStage(stage)}
                    className="group flex flex-col items-center gap-2 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 rounded-lg p-2"
                    title={`Stage ${stage}`}
                    aria-label={`Go to Stage ${stage}`}
                  >
                    {/* Circle */}
                    <div
                      className={`
                        relative w-12 h-12 flex items-center justify-center font-bold text-sm
                        transition-all duration-300 transform
                        ${isCompleted
                          ? 'bg-gradient-to-br from-green-400 to-green-500 text-white shadow-lg shadow-green-200 scale-100'
                          : isCurrent
                            ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-xl shadow-orange-200 ring-4 ring-orange-100 scale-110'
                            : 'bg-white border-2 border-gray-300 text-gray-400 group-hover:border-orange-300 group-hover:text-orange-400'
                        }
                        rounded-full
                      `}
                    >
                      {isCompleted ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span>{stage}</span>
                      )}

                      {/* Pulse Animation for Current Stage */}
                      {isCurrent && (
                        <span className="absolute inset-0 rounded-full bg-orange-400 animate-ping opacity-20"></span>
                      )}
                    </div>

                    {/* Stage Label (Hidden on mobile) */}
                    <span className={`
                      hidden sm:block text-xs font-medium transition-colors duration-300
                      ${isCurrent ? 'text-orange-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}
                    `}>
                      Stage {stage}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stage Content */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStage === 1 && (
                <Stage1DataCollection
                  data={formData}
                  onDataChange={setFormData}
                  onNext={handleNext}
                  fastTrackEnabled={fastTrackEnabled}
                  onFastTrackChange={setFastTrackEnabled}
                  onStageChange={setCurrentStage}
                />
              )}
              {currentStage === 2 && (
                <Stage2SubDomains
                  data={formData}
                  onDataChange={setFormData}
                  onNext={handleNext}
                  onPrev={handlePrev}
                />
              )}
              {currentStage === 3 && (
                <Stage3TopicsPersona
                  data={formData}
                  onDataChange={setFormData}
                  onNext={handleNext}
                  onPrev={handlePrev}
                />
              )}
              {currentStage === 4 && (
                <Stage4Situations
                  data={formData}
                  onDataChange={setFormData}
                  onNext={handleNext}
                  onPrev={handlePrev}
                />
              )}
              {currentStage === 5 && (
                <Stage5SampleSentences
                  data={formData}
                  onDataChange={setFormData}
                  onNext={handleNext}
                  onPrev={handlePrev}
                />
              )}
              {currentStage === 6 && (
                <Stage6AudioDetails
                  data={formData}
                  onDataChange={setFormData}
                  onPrev={handlePrev}
                  onComplete={handleComplete}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Info */}
        <div className="text-center text-[10px] sm:text-xs text-gray-500">
          <p>
            {currentStage === 1 && '📝 Fill in the dataset information to continue'}
            {currentStage === 2 && '✓ Verify and edit the generated sub-domains'}
            {currentStage === 3 && '👥 Review and confirm the generated personas'}
            {currentStage === 4 && '🎭 Review and edit the situations'}
            {currentStage === 5 && '📄 Verify the sample sentences'}
            {currentStage === 6 && '🎵 Configure audio generation settings'}
          </p>
        </div>
      </div>
    </div>
  );
}
