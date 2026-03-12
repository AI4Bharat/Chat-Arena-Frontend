import { useState, useEffect } from 'react';
import { generateSubDomains, generatePersonas, generateSituations, generateSentences, createDataset, getJobStatus } from '../../../services/syntheticAsrApi';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { ChevronRight, ChevronLeft, CheckCircle2, Plus, Trash2, Loader2 } from 'lucide-react';
import { AudioEmptyState } from './AudioEmptyState';

// Persist wizard progress across refreshes
const ASR_WIZARD_DRAFT_KEY = 'asr_wizard_draft_v1';

// Stage 1: Initial Data Collection Form
function Stage1DataCollection({ data, onDataChange, onNext, fastTrackEnabled, onFastTrackChange, onStageChange, isFastTrackGenerating, isSubmitting }) {

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
        duration: '3'
      });
    } else {
      onDataChange({
        ...data,
        sentenceStyles: [],
        duration: ''
      });
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
        <div className="flex flex-col items-end gap-1.5">
          <button
            type="button"
            onClick={() => handleFastTrack(!fastTrackEnabled)}
            className="flex items-center gap-2.5 bg-white border-0 rounded-2xl px-3.5 py-2.5"
            style={{
              boxShadow: fastTrackEnabled
                ? 'inset 1px 1px 3px rgba(249,115,22,0.12), inset -1px -1px 3px rgba(255,255,255,0.85), 5px 5px 14px rgba(249,115,22,0.16), -2px -2px 8px rgba(255,255,255,0.8)'
                : 'inset 1px 1px 3px rgba(0,0,0,0.03), inset -1px -1px 3px rgba(255,255,255,0.85), 4px 4px 14px rgba(0,0,0,0.06), -2px -2px 8px rgba(255,255,255,0.8)'
            }}
            aria-pressed={fastTrackEnabled}
          >
            <span className={`text-sm font-semibold ${fastTrackEnabled ? 'text-amber-700' : 'text-gray-700'}`}>Fast Track</span>
            <span
              className={`relative w-11 h-6 rounded-full border transition-all duration-300 ${fastTrackEnabled ? 'bg-amber-100 border-amber-300' : 'bg-gray-100 border-gray-300'}`}
              style={{
                boxShadow: fastTrackEnabled
                  ? 'inset 1px 1px 2px rgba(245,158,11,0.18), inset -1px -1px 2px rgba(255,255,255,0.9)'
                  : 'inset 1px 1px 2px rgba(0,0,0,0.06), inset -1px -1px 2px rgba(255,255,255,0.9)'
              }}
            >
              <span
                className={`absolute left-[2px] top-[2px] h-5 w-5 rounded-full transition-all duration-300 ${fastTrackEnabled ? 'translate-x-0 bg-amber-400' : 'translate-x-5 bg-white'}`}
                style={{
                  boxShadow: fastTrackEnabled
                    ? '0 1px 4px rgba(245,158,11,0.45)'
                    : '0 1px 4px rgba(0,0,0,0.2)'
                }}
              />
            </span>
          </button>
          <p className="text-[11px] text-gray-500 text-right leading-none">Auto-generates all stages with 3h defaults</p>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Category *</label>
        <select
          value={data.category || ''}
          onChange={(e) => handleInputChange('category', e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm transition-all"
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
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Language *</label>
        <select
          value={data.language || ''}
          onChange={(e) => handleInputChange('language', e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm transition-all"
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
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Sentence Styles *</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {sentenceStyles.map((style) => (
            <label key={style} className="flex items-center gap-2 cursor-pointer p-2 border border-gray-100 rounded-xl hover:border-orange-200 hover:bg-orange-50/50 transition-colors">
              <input
                type="checkbox"
                checked={(data.sentenceStyles || []).includes(style)}
                onChange={() => handleCheckboxChange(style)}
                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 accent-orange-600 border-gray-300"
              />
              <span className="text-xs sm:text-sm text-gray-700">{style}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Duration (hours) <span className="text-gray-400 font-normal">(max 3h)</span></label>
        <input
          type="number"
          value={data.duration || ''}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '' || parseFloat(val) <= 3) {
              handleInputChange('duration', val);
            } else {
              handleInputChange('duration', '3');
            }
          }}
          placeholder="e.g., 0.5, 1, 3"
          min="0"
          max="3"
          step="0.5"
          className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm transition-all"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Description</label>
        <textarea
          value={data.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Provide any additional context..."
          rows="2"
          className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm resize-none transition-all"
        />
      </div>

      {/* Entities */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Related Entities</label>
        <textarea
          value={data.entities || ''}
          onChange={(e) => handleInputChange('entities', e.target.value)}
          placeholder="Comma separated (e.g., crop types, soil conditions)"
          rows="2"
          className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm resize-none transition-all"
        />
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-3 border-t border-gray-100">
        <button
          onClick={onNext}
          disabled={!data.category || !data.language || (data.sentenceStyles || []).length === 0 || isFastTrackGenerating || isSubmitting}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-sm hover:shadow-orange-100 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-xs sm:text-sm w-full sm:w-auto"
        >
          {isFastTrackGenerating || isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {fastTrackEnabled ? 'Generating all data...' : 'Generating...'}
            </>
          ) : (
            <>
              Next <ChevronRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Stage 2: Sub Domains Generated
function Stage2SubDomains({ data, onDataChange, onNext, onPrev, isSubmitting }) {
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
      onDataChange({ ...data, subDomains: newDomains, subDomainCustomPrompt: customPrompt });

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
      <div className="bg-white rounded-2xl p-3 sm:p-5 border border-gray-100 shadow-sm">
        {!isCustomizeMode ? (
          subDomains.length > 0 ? (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              margin: '12px 0 0 0'
            }}>
              {subDomains.map((domain, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 18px',
                    borderRadius: '20px',
                    background: '#f5f5f5',
                    border: '1px solid #e0e0e0',
                    fontWeight: 500,
                    fontSize: '1rem',
                    color: '#333',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                  }}
                >
                  <CheckCircle2 size={16} className="text-orange-600 flex-shrink-0" style={{ marginRight: 8 }} />
                  <span style={{ fontSize: '0.97rem' }}>{domain}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <p className="text-gray-500 text-sm mb-3">No subdomains generated yet.</p>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-6 py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-sm text-sm disabled:bg-gray-200 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating...' : 'Generate Subdomains'}
              </button>
            </div>
          )
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
                Describe the subdomains you want to generate:
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Example: Include organic farming and irrigation systems..."
                rows="3"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm resize-none transition-all"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRegenerate}
                disabled={!customPrompt.trim() || isRegenerating}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all text-xs sm:text-sm disabled:bg-gray-200 disabled:cursor-not-allowed"
              >
                {isRegenerating ? 'Regenerating...' : 'Regenerate Subdomains'}
              </button>
              <button
                onClick={() => {
                  setIsCustomizeMode(false);
                  setCustomPrompt('');
                }}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all text-xs sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-2 sm:gap-3 pt-4 border-t border-gray-100">
        <button
          onClick={onPrev}
          className="flex items-center justify-center gap-2 px-6 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all text-xs sm:text-sm w-full sm:w-auto order-2 sm:order-1"
        >
          <ChevronLeft size={16} /> Back
        </button>
        {!isCustomizeMode && (
          <button
            onClick={() => setIsCustomizeMode(true)}
            className="px-6 py-2 border border-orange-200 text-orange-600 rounded-xl font-bold hover:bg-orange-50 transition-all text-xs sm:text-sm w-full sm:w-auto order-3 sm:order-2 shadow-sm"
          >
            Customize with prompt
          </button>
        )}
        <button
          onClick={onNext}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 px-8 py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-sm shadow-orange-100 text-xs sm:text-sm w-full sm:w-auto order-1 sm:order-3 disabled:bg-gray-200 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Generating...
            </>
          ) : (
            <>
              Proceed <ChevronRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Stage 3: Topics and Persona
function Stage3TopicsPersona({ data, onDataChange, onPrev, onNext, isSubmitting }) {
  const [personas, setPersonas] = useState(data.personas || []);
  const [isCustomizeMode, setIsCustomizeMode] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
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
      onDataChange({ ...data, personas: newPersonas, personaCustomPrompt: customPrompt });

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
  };

  return (
    <div className="space-y-3 sm:space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Topics and Persona</h2>
        <p className="text-xs sm:text-sm text-gray-600">Verify and edit the personas for your dataset</p>
      </div>

      {/* Personas List */}
      <div className="bg-white rounded-2xl p-3 sm:p-5 border border-gray-100 shadow-sm max-h-[50vh] overflow-y-auto custom-scrollbar">
        {!isCustomizeMode ? (
          personas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {personas.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-orange-100 transition-all duration-300"
                >
                  <dl className="space-y-1.5 text-xs">
                    <div className="flex flex-col">
                      <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sub Domain</dt>
                      <dd className="text-gray-900 font-medium truncate">{item.subDomain || '—'}</dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Topic</dt>
                      <dd className="text-gray-900 font-bold">{item.topic}</dd>
                    </div>
                    <div className="flex flex-col border-t border-gray-50 pt-1.5 mt-1.5">
                      <dt className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Persona</dt>
                      <dd className="text-gray-700 leading-normal">{item.persona}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm mb-4">No topics and personas generated yet.</p>
              <Loader2 className="animate-spin mx-auto text-orange-500 mb-2" size={24} />
              <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Generating...</p>
            </div>
          )
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
                Describe the topics and personas:
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Example: Include topics about crop rotation and pest management..."
                rows="3"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRegenerate}
                disabled={!customPrompt.trim() || isRegenerating}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all text-xs sm:text-sm disabled:bg-gray-200"
              >
                {isRegenerating ? 'Regenerating...' : 'Regenerate Topics & Personas'}
              </button>
              <button
                onClick={() => {
                  setIsCustomizeMode(false);
                  setCustomPrompt('');
                }}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all text-xs sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-2 sm:gap-3 pt-4 border-t border-gray-100">
        <button
          onClick={onPrev}
          className="flex items-center justify-center gap-2 px-6 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all text-xs sm:text-sm w-full sm:w-auto order-2 sm:order-1"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex gap-2 w-full sm:w-auto order-3 sm:order-2">
          {!isCustomizeMode && (
            <button
              onClick={() => setIsCustomizeMode(true)}
              className="flex-1 px-4 py-2 border border-orange-200 text-orange-600 rounded-xl font-bold hover:bg-orange-50 transition-all text-xs sm:text-sm whitespace-nowrap shadow-sm"
            >
              Custom Prompt
            </button>
          )}
        </div>
        <button
          onClick={onNext}
          disabled={isSubmitting || personas.length === 0}
          className="flex items-center justify-center gap-2 px-8 py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-sm shadow-orange-100 text-xs sm:text-sm w-full sm:w-auto order-1 sm:order-3 disabled:bg-gray-200 disabled:text-gray-400"
        >
          {isSubmitting ? (
            <><Loader2 size={16} className="animate-spin" /> Proceeding...</>
          ) : (
            <>Proceed <ChevronRight size={16} /></>
          )}
        </button>
      </div>
    </div>
  );
}

// Stage 4: Situations
function Stage4Situations({ data, onDataChange, onPrev, onNext, isSubmitting }) {
  const [situations, setSituations] = useState(data.situations || []);
  const [isCustomizeMode, setIsCustomizeMode] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  // isEditMode removed: manual edit option has been disabled
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
      onDataChange({ ...data, situations: newSituations, scenarioCustomPrompt: customPrompt });

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
  };

  return (
    <div className="space-y-3 sm:space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Situations</h2>
        <p className="text-xs sm:text-sm text-gray-600">Verify and edit the situations for your dataset</p>
      </div>

      {/* Situations List */}
      <div className="bg-white rounded-2xl p-3 sm:p-5 border border-gray-100 shadow-sm max-h-[50vh] overflow-y-auto custom-scrollbar">
        {!isCustomizeMode ? (
          situations.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {situations.map((situation, idx) => {
                const situationText = typeof situation === 'string' ? situation : situation.scenario;
                const subDomain = typeof situation === 'object' ? situation.subDomain : null;
                const topic = typeof situation === 'object' ? situation.topic : null;
                const persona = typeof situation === 'object' ? situation.persona : null;

                return (
                  <div
                    key={idx}
                    className="group relative bg-white border border-gray-100 rounded-xl p-3.5 hover:shadow-md hover:border-orange-100 transition-all duration-300"
                  >
                    {(subDomain || topic || persona) && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
                        {subDomain && <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{subDomain}</span>}
                        {topic && <span className="text-[10px] font-bold text-orange-400 uppercase bg-orange-50/50 px-1.5 py-0.5 rounded border border-orange-100">{topic}</span>}
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={16} className="text-orange-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
                        {situationText}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="animate-spin mx-auto text-orange-500 mb-2" size={24} />
              <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Generating Situations...</p>
            </div>
          )
        ) : isCustomizeMode ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Describe the situations:</label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Example: Include situations about farm equipment maintenance..."
                rows="3"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRegenerate}
                disabled={!customPrompt.trim() || isRegenerating}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all text-xs sm:text-sm disabled:bg-gray-200"
              >
                {isRegenerating ? 'Regenerating...' : 'Regenerate Situations'}
              </button>
              <button onClick={() => { setIsCustomizeMode(false); setCustomPrompt(''); }} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 text-xs sm:text-sm">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {editedSituations.map((situation, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={situation}
                  onChange={(e) => handleEditSituation(idx, e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm"
                />
                <button onClick={() => handleDeleteSituation(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"><Trash2 size={16} /></button>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
              <input
                type="text"
                value={newSituation}
                onChange={(e) => setNewSituation(e.target.value)}
                placeholder="Add new situation"
                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleAddSituation()}
              />
              <button onClick={handleAddSituation} className="px-4 py-1.5 bg-orange-100 text-orange-600 rounded-xl font-bold hover:bg-orange-200 text-sm whitespace-nowrap"><Plus size={16} /></button>
            </div>
            <button onClick={handleSaveEdit} className="w-full mt-2 px-4 py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all text-sm shadow-sm">Save Changes</button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-2 sm:gap-3 pt-4 border-t border-gray-100">
        <button
          onClick={onPrev}
          className="flex items-center justify-center gap-2 px-6 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all text-xs sm:text-sm w-full sm:w-auto order-2 sm:order-1"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex gap-2 w-full sm:w-auto order-3 sm:order-2">
          {!isCustomizeMode && (
            <button onClick={() => setIsCustomizeMode(true)} className="flex-1 px-4 py-2 border border-orange-200 text-orange-600 rounded-xl font-bold hover:bg-orange-50 text-xs sm:text-sm whitespace-nowrap shadow-sm">Custom Prompt</button>
          )}
        </div>
        <button
          onClick={onNext}
          disabled={isSubmitting || situations.length === 0}
          className="flex items-center justify-center gap-2 px-8 py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-sm shadow-orange-100 text-xs sm:text-sm w-full sm:w-auto order-1 sm:order-3 disabled:bg-gray-200 disabled:text-gray-400"
        >
          {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Proceeding...</> : <>Proceed <ChevronRight size={16} /></>}
        </button>
      </div>
    </div>
  );
}

// Stage 5: Sample Sentences
function Stage5SampleSentences({ data, onDataChange, onPrev, onNext, isSubmitting }) {
  const normalizeToStrings = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.map(s => (typeof s === 'string' ? s : (s?.sentence ?? JSON.stringify(s)))).filter(Boolean);
  };

  const [sentences, setSentences] = useState(normalizeToStrings(Array.isArray(data.sentences) ? data.sentences : []));
  const [newSentence, setNewSentence] = useState('');
  // isEditMode removed: manual edit option has been disabled (Stage5)
  const [editedSentences, setEditedSentences] = useState([...sentences]);
  const [isLoading, setIsLoading] = useState(false);

  // Sync local state when sentences from parent update
  useEffect(() => {
    const arr = normalizeToStrings(Array.isArray(data.sentences) ? data.sentences : []);
    if (arr.length > 0) {
      setSentences(arr);
      setEditedSentences(arr);
    }
  }, [data.sentences]);

  // Effective sentences to render (handles any race between navigation and state propagation)
  const effectiveSentences = sentences && sentences.length > 0
    ? sentences
    : normalizeToStrings(Array.isArray(data.sentences) ? data.sentences : []);

  // Removed customize-with-prompt flow for Stage 5

  // No per-sentence metadata needed in Stage 5 per requirements

  // Removed payload preview controls and builders for Stage 5

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
    // isEditMode removed
  };

  return (
    <div className="space-y-3 sm:space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Sample Sentences</h2>
        <p className="text-xs sm:text-sm text-gray-600">Verify and edit the sample sentences for your dataset</p>
      </div>

      {/* Context summary removed per requirements */}

      {/* Sentences List (sentences only) */}
      <div className="bg-white rounded-2xl p-3 sm:p-5 border border-gray-100 shadow-sm max-h-[50vh] overflow-y-auto custom-scrollbar">
        {effectiveSentences && effectiveSentences.length > 0 ? (
          <ul className="space-y-2">
            {effectiveSentences.map((item, idx) => {
              const text = typeof item === 'string' ? item : (item?.sentence ?? '');
              return (
                <li key={idx} className="flex items-start gap-3 text-gray-700 p-2.5 bg-gray-50 rounded-xl hover:bg-orange-50/50 transition-colors border border-transparent hover:border-orange-100">
                  <CheckCircle2 size={16} className="text-orange-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm font-medium leading-relaxed">{text}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-center py-8">
            <Loader2 className="animate-spin mx-auto text-orange-500 mb-2" size={24} />
            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Generating Sentences...</p>
          </div>
        )}
      </div>

      {/* Payload preview removed per requirements */}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-2 sm:gap-3 pt-4 border-t border-gray-100">
        <button
          onClick={onPrev}
          className="flex items-center justify-center gap-2 px-6 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all text-xs sm:text-sm w-full sm:w-auto order-2 sm:order-1"
        >
          <ChevronLeft size={16} /> Back
        </button>

        <button
          onClick={onNext}
          disabled={isSubmitting || effectiveSentences.length === 0}
          className="flex items-center justify-center gap-2 px-8 py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-sm shadow-orange-100 text-xs sm:text-sm w-full sm:w-auto order-1 sm:order-3 disabled:bg-gray-200 disabled:text-gray-400"
        >
          {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Proceeding...</> : <>Proceed <ChevronRight size={16} /></>}
        </button>
      </div>
    </div>
  );
}

// Stage 6: Audio Details
function Stage6AudioDetails({ data, onDataChange, onPrev, onComplete, isSubmitting }) {
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
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
        <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Voice Preference</label>
        <div className="flex gap-4">
          {['male', 'female'].map(voice => (
            <label key={voice} className={`flex items-center gap-3 cursor-pointer p-3 border rounded-xl transition-all flex-1 ${(audioConfig.voices || []).includes(voice)
              ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-50'
              : 'border-gray-100 hover:border-orange-200'
              }`}>
              <input
                type="checkbox"
                checked={(audioConfig.voices || []).includes(voice)}
                onChange={() => handleVoiceToggle(voice)}
                className="w-4 h-4 text-orange-600 accent-orange-600 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 font-bold capitalize">{voice}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Age Group Selection */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
        <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Age Groups</label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {['18-30', '30-45', '45-60', '60+'].map((group) => (
            <label key={group} className={`flex items-center gap-3 cursor-pointer p-3 border rounded-xl transition-all ${(audioConfig.ageGroups || []).includes(group)
              ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-50'
              : 'border-gray-100 hover:border-orange-200'
              }`}>
              <input
                type="checkbox"
                checked={(audioConfig.ageGroups || []).includes(group)}
                onChange={() => handleAgeGroupToggle(group)}
                className="w-4 h-4 text-orange-600 accent-orange-600 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 font-bold">{group}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-2 sm:gap-3 pt-4 border-t border-gray-100">
        <button
          onClick={onPrev}
          className="flex items-center justify-center gap-2 px-6 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all text-xs sm:text-sm w-full sm:w-auto order-2 sm:order-1"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <button
          onClick={handleComplete}
          disabled={isSubmitting || (audioConfig.voices || []).length === 0 || (audioConfig.ageGroups || []).length === 0}
          className="flex items-center justify-center gap-2 px-10 py-2.5 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-md shadow-orange-100 text-sm w-full sm:w-auto order-1 sm:order-2 disabled:bg-gray-200 disabled:text-gray-400"
        >
          {isSubmitting ? (
            <><Loader2 size={16} className="animate-spin" /> Preparing...</>
          ) : (
            <>Start generation <ChevronRight size={16} /></>
          )}
        </button>
      </div>

      {/* Configuration Review Modal */}
      <AnimatePresence>
        {showJsonPreview && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowJsonPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="border-b border-gray-100 p-6 flex justify-between items-center bg-gradient-to-r from-orange-50 to-orange-50/30">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Review & Confirm Configuration</h3>
                  <p className="text-sm text-gray-600 font-medium">Review and edit your dataset settings before submission</p>
                </div>
                <button onClick={() => setShowJsonPreview(false)} className="text-gray-400 hover:text-gray-600 transition-all p-3 hover:bg-white/50 rounded-xl">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Content Configuration */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-50/30 rounded-2xl p-5 border border-blue-100/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Content Configuration</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Category</label>
                      <div className="px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm font-medium text-gray-800">
                        {data.category}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Language</label>
                      <div className="px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm font-medium text-gray-800 uppercase">
                        {data.language}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Duration (Hours)</label>
                      <div className="px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm font-medium text-gray-800">
                        {data.duration}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Sentence Styles</label>
                      <div className="px-4 py-3 bg-white border border-blue-200 rounded-xl">
                        <div className="flex flex-wrap gap-2">
                          {(data.sentenceStyles || []).map((style, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium">
                              {style}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {data.description && (
                    <div className="mt-4 space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Description</label>
                      <div className="px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm text-gray-700">
                        {data.description}
                      </div>
                    </div>
                  )}
                  
                  {data.entities && (
                    <div className="mt-4 space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Entities</label>
                      <div className="px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm text-gray-700">
                        {data.entities}
                      </div>
                    </div>
                  )}
                </div>

                {/* Audio Configuration */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-50/30 rounded-2xl p-5 border border-purple-100/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Audio Configuration</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Voice Genders</label>
                      <div className="px-4 py-3 bg-white border border-purple-200 rounded-xl">
                        <div className="flex flex-wrap gap-2">
                          {(audioConfig.voices || []).map((voice, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">
                              {voice.charAt(0).toUpperCase() + voice.slice(1).toLowerCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Age Groups</label>
                      <div className="px-4 py-3 bg-white border border-purple-200 rounded-xl">
                        <div className="flex flex-wrap gap-2">
                          {(audioConfig.ageGroups || []).map((age, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">
                              {age}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Accent</label>
                      <div className="px-4 py-3 bg-white border border-purple-200 rounded-xl text-sm font-medium text-gray-800 capitalize">
                        {audioConfig.accent === 'custom' ? (audioConfig.customAccent || 'Normal') : (audioConfig.accent || 'Normal')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Generated Content Summary */}
                {(data.subDomains?.length > 0 || data.personas?.length > 0 || data.situations?.length > 0) && (
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/30 rounded-2xl p-5 border border-emerald-100/50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">Generated Content</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {data.subDomains?.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">Sub-domains ({data.subDomains.length})</label>
                          <div className="px-4 py-3 bg-white border border-emerald-200 rounded-xl max-h-24 overflow-y-auto">
                            <div className="space-y-1">
                              {data.subDomains.slice(0, 3).map((domain, idx) => (
                                <div key={idx} className="text-xs text-gray-600 truncate">{domain}</div>
                              ))}
                              {data.subDomains.length > 3 && (
                                <div className="text-xs text-emerald-600 font-medium">+{data.subDomains.length - 3} more</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {data.personas?.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">Topics & Personas ({data.personas.length})</label>
                          <div className="px-4 py-3 bg-white border border-emerald-200 rounded-xl max-h-24 overflow-y-auto">
                            <div className="space-y-1">
                              {data.personas.slice(0, 2).map((persona, idx) => (
                                <div key={idx} className="text-xs text-gray-600">
                                  <span className="font-medium">{persona.topic}</span> - {persona.persona}
                                </div>
                              ))}
                              {data.personas.length > 2 && (
                                <div className="text-xs text-emerald-600 font-medium">+{data.personas.length - 2} more</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {data.situations?.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">Scenarios ({data.situations.length})</label>
                          <div className="px-4 py-3 bg-white border border-emerald-200 rounded-xl max-h-24 overflow-y-auto">
                            <div className="space-y-1">
                              {data.situations.slice(0, 2).map((situation, idx) => (
                                <div key={idx} className="text-xs text-gray-600 truncate">
                                  {typeof situation === 'string' ? situation : situation?.scenario}
                                </div>
                              ))}
                              {data.situations.length > 2 && (
                                <div className="text-xs text-emerald-600 font-medium">+{data.situations.length - 2} more</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Submission Note */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-orange-800 mb-1">Ready for Submission</h5>
                      <p className="text-sm text-orange-700 leading-relaxed">
                        Your dataset job will be queued for processing. You can monitor progress and download results from the dashboard once generation is complete.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-100 p-6 flex gap-4">
                <button 
                  onClick={() => setShowJsonPreview(false)} 
                  className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  Review Settings
                </button>
                <button
                  onClick={() => { setShowJsonPreview(false); onComplete(); }}
                  className="flex-[2] px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-bold hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
                >
                  Submit Dataset Job
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
export function SyntheticASRWizard({ onBackToDashboard, resubmitData }) {
  const auth = useSelector((state) => state.auth);
  // If resubmitData is passed, start in read-only review mode at stage 1
  const isResubmitMode = !!resubmitData;
  const [isReadOnly, setIsReadOnly] = useState(isResubmitMode);
  const [currentStage, setCurrentStage] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fastTrackEnabled, setFastTrackEnabled] = useState(false);
  const [isFastTrackGenerating, setIsFastTrackGenerating] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [submissionMeta, setSubmissionMeta] = useState(null);
  const [formData, setFormData] = useState(resubmitData || {
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

  // Load draft from localStorage on mount (skip if resubmitting)
  useEffect(() => {
    if (isResubmitMode) return; // pre-filled from resubmitData
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(ASR_WIZARD_DRAFT_KEY) : null;
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft && typeof draft === 'object') {
        if (draft.formData) setFormData(prev => ({ ...prev, ...draft.formData }));
        if (Number.isInteger(draft.currentStage)) setCurrentStage(draft.currentStage);
        if (typeof draft.fastTrackEnabled === 'boolean') setFastTrackEnabled(draft.fastTrackEnabled);
        if (draft.jobId) setJobId(draft.jobId);
      }
    } catch (e) {
      console.warn('Failed to load ASR wizard draft:', e);
    }
  }, []);

  // Auto-save draft whenever key state changes (until completed)
  useEffect(() => {
    if (isComplete) return; // don't overwrite after completion
    try {
      const payload = {
        formData,
        currentStage,
        fastTrackEnabled,
        jobId,
        ts: Date.now(),
      };
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(ASR_WIZARD_DRAFT_KEY, JSON.stringify(payload));
      }
    } catch (e) {
      console.warn('Failed to save ASR wizard draft:', e);
    }
  }, [formData, currentStage, fastTrackEnabled, jobId, isComplete]);

  const handleFastTrackGeneration = async () => {
    setIsFastTrackGenerating(true);
    try {
      // Step 1: Generate subdomains
      const subDomainsResult = await generateSubDomains(formData);
      const subDomainsArray = (Array.isArray(subDomainsResult) ? subDomainsResult : Object.values(subDomainsResult || {}))
        .map(item => (typeof item === 'string' ? item : item?.sub_domain || item?.subDomain || ''))
        .filter(Boolean);
      setFormData(prev => ({ ...prev, subDomains: subDomainsArray }));

      // Step 2: Generate personas with updated data
      const personasData = { ...formData, subDomains: subDomainsArray };
      const personasResult = await generatePersonas(personasData);
      const personasArray = Object.values(personasResult).map(item => ({
        topic: item.topic,
        persona: item.persona,
        subDomain: item.subDomain,
        subDomainId: item.subDomainId
      }));
      setFormData(prev => ({ ...prev, personas: personasArray }));

      // Step 3: Generate situations with updated data
      const situationsData = { ...formData, subDomains: subDomainsArray, personas: personasArray };
      const situationsResult = await generateSituations(situationsData);
      const situationsArray = Object.values(situationsResult).map(item => item); // keep objects for metadata
      setFormData(prev => ({ ...prev, situations: situationsArray }));

      // Step 4: Generate sentences with all updated data
      const sentencesData = { ...formData, subDomains: subDomainsArray, personas: personasArray, situations: situationsArray };
      const sentencesResult = await generateSentences(sentencesData);
      // Keep enriched objects with metadata
      setFormData(prev => ({ ...prev, sentences: Array.isArray(sentencesResult) ? sentencesResult : [] }));

      // Navigate to stage 6
      setCurrentStage(6);
    } catch (error) {
      console.error('Fast-track generation error:', error);
      alert('Failed to generate data. Please try again or use manual mode.');
    } finally {
      setIsFastTrackGenerating(false);
    }
  };

  const handleNext = async () => {
    if (currentStage >= 6) return;

    // Validate Stage 1 required fields
    if (currentStage === 1) {
      if (!formData.category) {
        alert('Please select a category');
        return;
      }
      if (!formData.language) {
        alert('Please select a language');
        return;
      }
      if (!formData.sentenceStyles || formData.sentenceStyles.length === 0) {
        alert('Please select at least one sentence style');
        return;
      }
      if (formData.duration && parseFloat(formData.duration) > 3) {
        alert('Duration cannot exceed 3 hours. Please enter a value between 0 and 3.');
        return;
      }
    }

    // Fast-track: generate all at once
    if (fastTrackEnabled && currentStage === 1) {
      handleFastTrackGeneration();
      return;
    }

    // Normal flow: generate data for current stage before advancing
    setIsSubmitting(true);
    try {
      switch (currentStage) {
        case 1:
          // Stage 1 → 2: Generate subdomains
          const subDomainsResult = await generateSubDomains(formData);
          const subDomainsArray = Object.values(subDomainsResult);
          setFormData(prev => ({ ...prev, subDomains: subDomainsArray }));
          break;

        case 2:
          // Stage 2 → 3: Generate personas
          const personasResult = await generatePersonas(formData);
          const personasArray = Object.values(personasResult).map(item => ({
            topic: item.topic,
            persona: item.persona,
            subDomain: item.subDomain,
            subDomainId: item.subDomainId
          }));
          setFormData(prev => ({ ...prev, personas: personasArray }));
          break;

        case 3:
          // Stage 3 → 4: Generate situations (keep objects for metadata)
          const situationsResult = await generateSituations(formData);
          setFormData(prev => ({ ...prev, situations: Object.values(situationsResult) }));
          break;

        case 4:
          // Stage 4 → 5: Generate sentences (enriched objects)
          const sentencesResult = await generateSentences(formData);
          setFormData(prev => ({ ...prev, sentences: Array.isArray(sentencesResult) ? sentencesResult : [] }));
          break;

        case 5:
          // Stage 5 → 6: Just navigate (no generation needed)
          break;
      }

      // Move to next stage after generation
      setCurrentStage(currentStage + 1);
    } catch (error) {
      console.error('Error generating data:', error);
      alert('Failed to generate data: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrev = () => {
    if (currentStage > 1) {
      setCurrentStage(currentStage - 1);
    }
  };

  const buildPayload = () => {
    // Format the data according to the backend requirements
    const toTitle = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);
    const scenariosText = (formData.situations || []).map(s => (typeof s === 'string' ? s : (s?.scenario || ''))).filter(Boolean);
    const payload = {
      sentence: {
        category: formData.category || null,
        language: formData.language || null,
        description: formData.description || '',
        entities: formData.entities || '',
        style: formData.sentenceStyles || [],
        topic_persona_instruction: formData.personaCustomPrompt || '',
        sub_domain_instruction: formData.subDomainCustomPrompt || '',
        scenario_instruction: formData.scenarioCustomPrompt || '',
      },
      audio: {
        gender: (formData.audioConfig?.voices || []).map(toTitle),
        age_group: formData.audioConfig?.ageGroups || [],
        accent: toTitle(formData.audioConfig?.accent === 'custom' ? (formData.audioConfig?.customAccent || 'Normal') : (formData.audioConfig?.accent || 'Normal')),
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
      const result = await createDataset(formData);
      const returnedJobId = typeof result === 'string' ? result : result.jobId;
      const status = typeof result === 'string' ? 200 : result.status;
      const url = typeof result === 'string' ? '/pai/create' : result.url;
      // Job created successfully

      setJobId(returnedJobId);
      setSubmissionMeta({ status, url, jobId: returnedJobId, ts: Date.now() });
      setIsComplete(true);
      // Clear draft once submitted
      try { if (typeof localStorage !== 'undefined') localStorage.removeItem(ASR_WIZARD_DRAFT_KEY); } catch { }
    } catch (error) {
      console.error('Error submitting dataset:', error);
      alert('Failed to submit dataset: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Poll job status when job is submitted
  useEffect(() => {
    if (!jobId || !isComplete) return;

    let isActive = true;
    let intervalId;

    const pollStatus = async () => {
      try {
        const status = await getJobStatus(jobId);
        if (!isActive) return; // Stop if component unmounted

        setJobStatus(status);

        // Stop polling if job is complete or failed
        if (status.status === 'COMPLETED' || status.status === 'FAILED') {
          clearInterval(intervalId);
          return;
        }
      } catch (error) {
        if (isActive) {
          console.error('Error fetching job status:', error);
        }
      }
    };

    // Poll immediately
    pollStatus();

    // Then poll every 60 seconds
    intervalId = setInterval(pollStatus, 60000);

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [jobId, isComplete]);

  // Access gate
  if (!auth?.isAuthenticated || auth?.isAnonymous) {
    return (
      <AudioEmptyState
        title="Sign in Required"
        message="Please sign in with Google to use the Synthetic ASR data creation wizard."
        variant="wizard"
        actionButton={
          <div className="flex flex-col gap-3">
            <a
              href="/#/login"
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transform hover:scale-105 active:scale-95"
            >
              Sign in with Google
            </a>
            <button
              onClick={onBackToDashboard}
              className="text-sm text-gray-700 font-medium px-4 py-2 rounded-xl border-0 transition-colors"
              style={{
                boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.03), inset -1px -1px 3px rgba(255,255,255,0.85), 4px 4px 14px rgba(0,0,0,0.06), -2px -2px 8px rgba(255,255,255,0.8)'
              }}
            >
              ← Back to Dashboard
            </button>
          </div>
        }
      />
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-xl w-full text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-10"
          >
            {/* Success Icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-50 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6 border-2 border-orange-200">
              <CheckCircle2 size={36} className="text-orange-600" />
            </div>

            {/* Main Message */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Dataset Job Submitted</h1>
            <p className="text-sm text-gray-500 mb-8 font-medium">Your dataset is being processed. You can track progress from your dashboard.</p>

            {/* Job ID Card */}
            {submissionMeta && (
              <div className="bg-gradient-to-br from-orange-50 to-orange-50/40 rounded-2xl p-5 mb-8 border border-orange-100">
                <p className="text-[11px] sm:text-xs font-semibold text-gray-600 uppercase mb-2 tracking-wide">Job ID</p>
                <p className="font-mono text-sm sm:text-base font-bold text-gray-900 break-all">{submissionMeta.jobId}</p>
              </div>
            )}

            {/* Quick Status Badge */}
            {jobStatus && (
              <div className="mb-8 inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-full border border-gray-200">
                <div className={`w-2 h-2 rounded-full ${jobStatus.status === 'COMPLETED' ? 'bg-green-500' : jobStatus.status === 'FAILED' ? 'bg-red-500' : 'bg-orange-500 animate-pulse'}`}></div>
                <span className={`text-xs sm:text-sm font-bold ${jobStatus.status === 'COMPLETED' ? 'text-green-600' : jobStatus.status === 'FAILED' ? 'text-red-600' : 'text-orange-600'}`}>
                  {jobStatus.status === 'COMPLETED' ? 'Completed' : jobStatus.status === 'FAILED' ? 'Failed' : 'Processing'}
                </span>
              </div>
            )}

            {/* Error State */}
            {jobStatus?.error && (
              <div className="mt-6 mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl text-left">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                  <div className="text-sm text-red-700">
                    <p className="font-semibold mb-1">Processing Error</p>
                    <p className="text-xs font-mono">{typeof jobStatus.error === 'string' ? jobStatus.error : JSON.stringify(jobStatus.error)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={() => {
                setIsComplete(false);
                setJobId(null);
                setJobStatus(null);
                setSubmissionMeta(null);
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
              className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-bold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95 text-sm sm:text-base"
            >
              Create Another Dataset
            </button>

            {/* Dashboard Link */}
            <button
              onClick={onBackToDashboard}
              className="w-full mt-3 px-6 py-2.5 text-gray-700 hover:text-gray-900 font-medium transition-colors text-sm rounded-2xl border-0"
              style={{
                boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.03), inset -1px -1px 3px rgba(255,255,255,0.85), 4px 4px 14px rgba(0,0,0,0.06), -2px -2px 8px rgba(255,255,255,0.8)'
              }}
            >
              Back to Dashboard
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBackToDashboard}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium transition-colors px-4 py-2 rounded-xl border-0"
            style={{
              boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.03), inset -1px -1px 3px rgba(255,255,255,0.85), 4px 4px 14px rgba(0,0,0,0.06), -2px -2px 8px rgba(255,255,255,0.8)'
            }}
          >
            <ChevronLeft size={20} />
            Back to Dashboard
          </motion.button>
        </div>

        {/* Header with Progress */}
        <div className="mb-4 sm:mb-6">
          {/* Progress Stepper */}
          <div
            className="relative bg-white rounded-2xl p-3 sm:p-4 mb-4 border-0"
            style={{
              boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.03), inset -1px -1px 3px rgba(255,255,255,0.85), 4px 4px 14px rgba(0,0,0,0.06), -2px -2px 8px rgba(255,255,255,0.8)'
            }}
          >
            {/* Background Line */}
            <div className="absolute top-[35%] left-0 right-0 h-2 rounded-full -translate-y-1/2" style={{
              left: 'calc(5% + 16px)',
              right: 'calc(5% + 16px)',
              width: 'calc(90% - 32px)',
              background: 'rgba(0,0,0,0.05)',
              boxShadow: 'inset 1.5px 1.5px 4px rgba(0,0,0,0.08), inset -1px -1px 2px rgba(255,255,255,0.7)'
            }}>
              {/* Animated Progress Fill */}
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-700 ease-out rounded-full"
                style={{
                  width: currentStage === 1 ? '0%' : `${((currentStage - 1) / 5) * 100}%`,
                  boxShadow: '0 1px 4px rgba(249,115,22,0.35)'
                }}
              />
            </div>

            {/* Stage Circles */}
            <div className="relative flex justify-between items-center px-2">
              {[1, 2, 3, 4, 5, 6].map((stage) => {
                const isCompleted = currentStage > stage;
                const isCurrent = currentStage === stage;
                const isPending = currentStage < stage;

                return (
                  <button
                    key={stage}
                    onClick={() => { if (!isPending) setCurrentStage(stage); }}
                    disabled={isPending}
                    className={`group flex flex-col items-center gap-1.5 sm:gap-2 transition-all duration-300 focus:outline-none rounded-2xl p-1 sm:p-1.5 ${isPending ? 'cursor-not-allowed opacity-50' : 'hover:scale-105 cursor-pointer'}`}
                    title={isPending ? `Complete earlier stages first` : `Stage ${stage}`}
                    aria-label={`Go to Stage ${stage}`}
                  >
                    {/* Circle */}
                    <div
                      className={`
                        relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center font-bold text-xs sm:text-sm
                        transition-all duration-300 transform
                        ${isCompleted
                          ? 'text-white scale-100'
                          : isCurrent
                            ? 'text-white scale-110'
                            : 'text-gray-400 group-hover:text-orange-300'
                        }
                        rounded-full
                      `}
                      style={isCompleted
                        ? {
                          background: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)',
                          boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.25), inset -1px -1px 2px rgba(0,0,0,0.08), 4px 4px 10px rgba(249,115,22,0.25), -2px -2px 6px rgba(255,255,255,0.8)'
                        }
                        : isCurrent
                          ? {
                            background: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)',
                            boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.3), inset -1px -1px 2px rgba(0,0,0,0.1), 6px 6px 16px rgba(249,115,22,0.28), -3px -3px 8px rgba(255,255,255,0.85)'
                          }
                          : {
                            background: '#f8f8f8',
                            boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.06), inset -1px -1px 3px rgba(255,255,255,0.9), 3px 3px 9px rgba(0,0,0,0.05), -2px -2px 6px rgba(255,255,255,0.85)'
                          }}
                    >
                      {isCompleted ? (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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


                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Read-Only Review Banner */}
        {isReadOnly && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200"
          >
            <div className="flex items-center gap-2">
              <span className="text-amber-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </span>
              <span className="text-xs sm:text-sm font-semibold text-amber-800">Reviewing job details — read-only mode</span>
            </div>
            <button
              onClick={() => setIsReadOnly(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-all shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Edit &amp; Resubmit
            </button>
          </motion.div>
        )}

        {/* Read-Only Full Review OR Stage Content */}
        {isReadOnly ? (
          <ResubmitReadOnlyView
            data={formData}
            onEdit={(stage) => { setIsReadOnly(false); setCurrentStage(stage); }}
            onResubmit={handleComplete}
            isSubmitting={isSubmitting}
          />
        ) : (
          <>
            {/* Stage Content */}
            <div
              className="bg-white rounded-2xl border-0 p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6"
              style={{
                boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.03), inset -1px -1px 3px rgba(255,255,255,0.85), 4px 4px 14px rgba(0,0,0,0.06), -2px -2px 8px rgba(255,255,255,0.8)'
              }}
            >
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
                      isSubmitting={isSubmitting}
                      isFastTrackGenerating={isFastTrackGenerating}
                    />
                  )}
                  {currentStage === 2 && (
                    <Stage2SubDomains
                      data={formData}
                      onDataChange={setFormData}
                      onNext={handleNext}
                      onPrev={handlePrev}
                      isSubmitting={isSubmitting}
                    />
                  )}
                  {currentStage === 3 && (
                    <Stage3TopicsPersona
                      data={formData}
                      onDataChange={setFormData}
                      onNext={handleNext}
                      onPrev={handlePrev}
                      isSubmitting={isSubmitting}
                    />
                  )}
                  {currentStage === 4 && (
                    <Stage4Situations
                      data={formData}
                      onDataChange={setFormData}
                      onNext={handleNext}
                      onPrev={handlePrev}
                      isSubmitting={isSubmitting}
                    />
                  )}
                  {currentStage === 5 && (
                    <Stage5SampleSentences
                      data={formData}
                      onDataChange={setFormData}
                      onNext={handleNext}
                      onPrev={handlePrev}
                      isSubmitting={isSubmitting}
                    />
                  )}
                  {currentStage === 6 && (
                    <Stage6AudioDetails
                      data={formData}
                      onDataChange={setFormData}
                      onPrev={handlePrev}
                      onComplete={handleComplete}
                      isSubmitting={isSubmitting}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer Info */}
            <div className="text-center text-[10px] sm:text-xs text-gray-500">
              <p>
                {currentStage === 1 && 'Fill in the dataset information to continue'}
                {currentStage === 2 && 'Verify and edit the generated sub-domains'}
                {currentStage === 3 && 'Review and confirm the generated personas'}
                {currentStage === 4 && 'Review and edit the situations'}
                {currentStage === 5 && 'Verify the sample sentences'}
                {currentStage === 6 && 'Configure audio generation settings'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ResubmitReadOnlyView — shows all stages in read-only mode after clicking Resubmit
// ─────────────────────────────────────────────────────────────────────────────
function ResubmitReadOnlyView({ data, onEdit, onResubmit, isSubmitting }) {
  const audioConfig = data.audioConfig || {};

  const Section = ({ title, stage, children }) => (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
      style={{ boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.02), 4px 4px 12px rgba(0,0,0,0.05), -2px -2px 8px rgba(255,255,255,0.8)' }}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        <button
          onClick={() => onEdit(stage)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-600 border border-orange-200 rounded-xl hover:bg-orange-50 transition-all"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Edit
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Section title="Dataset Info" stage={1}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Category</p>
            <p className="text-sm font-semibold text-gray-800 capitalize">{data.category || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Language</p>
            <p className="text-sm font-semibold text-gray-800 capitalize">{data.language || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Duration</p>
            <p className="text-sm font-semibold text-gray-800">{data.duration ? `${data.duration}h` : '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Styles</p>
            <div className="flex flex-wrap gap-1">
              {(data.sentenceStyles || []).map(s => (
                <span key={s} className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded-lg text-[10px] font-semibold border border-orange-100">{s}</span>
              ))}
            </div>
          </div>
        </div>
        {data.description && (
          <p className="mt-3 text-xs text-gray-500 border-t border-gray-100 pt-3">{data.description}</p>
        )}
      </Section>

      <Section title="Sub-domains" stage={2}>
        {(data.subDomains || []).length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {data.subDomains.map((d, i) => (
              <span key={i} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700">{d}</span>
            ))}
          </div>
        ) : <p className="text-xs text-gray-400">No sub-domains generated</p>}
      </Section>

      <Section title="Topics & Personas" stage={3}>
        {(data.personas || []).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.personas.slice(0, 6).map((p, i) => (
              <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">{p.topic}</p>
                <p className="text-xs text-gray-600 mt-1">{p.persona}</p>
              </div>
            ))}
            {data.personas.length > 6 && (
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                <p className="text-xs font-semibold text-gray-400">+{data.personas.length - 6} more</p>
              </div>
            )}
          </div>
        ) : <p className="text-xs text-gray-400">No personas generated</p>}
      </Section>

      <Section title="Situations" stage={4}>
        {(data.situations || []).length > 0 ? (
          <div className="space-y-2">
            {data.situations.slice(0, 4).map((s, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <CheckCircle2 size={14} className="text-orange-500 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-700">{typeof s === 'string' ? s : s?.scenario}</p>
              </div>
            ))}
            {data.situations.length > 4 && (
              <p className="text-xs font-semibold text-gray-400 pt-1">+{data.situations.length - 4} more situations</p>
            )}
          </div>
        ) : <p className="text-xs text-gray-400">No situations generated</p>}
      </Section>

      <Section title="Sample Sentences" stage={5}>
        {(data.sentences || []).length > 0 ? (
          <div className="space-y-1.5">
            {data.sentences.slice(0, 3).map((s, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 mt-0.5 shrink-0">#{i + 1}</span>
                <p className="text-xs text-gray-700">{typeof s === 'string' ? s : s?.sentence || s?.text || JSON.stringify(s)}</p>
              </div>
            ))}
            {data.sentences.length > 3 && (
              <p className="text-xs font-semibold text-gray-400 pt-1">+{data.sentences.length - 3} more sentences</p>
            )}
          </div>
        ) : <p className="text-xs text-gray-400">No sample sentences generated</p>}
      </Section>

      <Section title="Audio Configuration" stage={6}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Voice Genders</p>
            <div className="flex flex-wrap gap-1">
              {(audioConfig.voices || []).length > 0
                ? audioConfig.voices.map(v => <span key={v} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-lg text-[10px] font-semibold border border-purple-100 capitalize">{v}</span>)
                : <span className="text-xs text-gray-400">—</span>}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Age Groups</p>
            <div className="flex flex-wrap gap-1">
              {(audioConfig.ageGroups || []).length > 0
                ? audioConfig.ageGroups.map(a => <span key={a} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-semibold border border-blue-100">{a}</span>)
                : <span className="text-xs text-gray-400">—</span>}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Accent</p>
            <p className="text-sm font-semibold text-gray-800 capitalize">
              {audioConfig.accent === 'custom' ? (audioConfig.customAccent || 'Normal') : (audioConfig.accent || 'Normal')}
            </p>
          </div>
        </div>
      </Section>

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => onEdit(1)}
          className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all text-sm"
        >
          Edit from Start
        </button>
        <button
          onClick={onResubmit}
          disabled={isSubmitting}
          className="flex-[2] px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-bold hover:from-orange-600 hover:to-orange-700 shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Submitting...</span>
          ) : 'Confirm & Resubmit Job'}
        </button>
      </div>
    </motion.div>
  );
}