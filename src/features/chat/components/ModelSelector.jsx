import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { setSelectedMode, setSelectedModels, setActiveSession } from '../store/chatSlice';
import { ModeDropdown } from './ModeDropdown';
import { ModelDropdown } from './ModelDropdown';

export function ModelSelector({ variant = 'full' }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeSession, selectedMode, selectedModels } = useSelector((state) => state.chat);

  const { data: models = [], isLoading } = useQuery({
    queryKey: ['models'],
    queryFn: async () => apiClient.get(endpoints.models.list).then(res => res.data),
  });

  const mode = activeSession?.mode || selectedMode || 'random';
  const modelsInUse = {
    modelA: activeSession?.model_a?.id || selectedModels?.modelA,
    modelB: activeSession?.model_b?.id || selectedModels?.modelB,
  };

  useEffect(() => {
    if (models.length > 0 && !activeSession) {
      const currentSelections = { ...selectedModels };
      let needsUpdate = false;

      if ((mode === 'direct' || mode === 'compare') && !currentSelections.modelA) {
        currentSelections.modelA = models[0].id;
        needsUpdate = true;
      }
      
      if (mode === 'compare') {
        if (!currentSelections.modelB || currentSelections.modelB === currentSelections.modelA) {
          const defaultModelB = models.find(m => m.id !== currentSelections.modelA);
          if (defaultModelB) {
            currentSelections.modelB = defaultModelB.id;
            needsUpdate = true;
          }
        }
      }
      
      if (mode !== 'compare' && currentSelections.modelB) {
        currentSelections.modelB = null;
        needsUpdate = true;
      }

      if (needsUpdate) {
        dispatch(setSelectedModels(currentSelections));
      }
    }
  }, [models, mode, activeSession, selectedModels, dispatch]);

  const handleModeChange = (newMode) => {
    dispatch(setSelectedMode(newMode));
    if (activeSession && activeSession.mode !== newMode) {
      dispatch(setActiveSession(null));
      navigate('/chat');
    }
  };

  const handleModelSelect = (model, slot) => {
    const newModels = { ...modelsInUse };
    
    const isChangingActiveSessionModel = activeSession && (
      (slot === 'modelA' && activeSession.model_a?.id !== model.id) ||
      (slot === 'modelB' && activeSession.model_b?.id !== model.id)
    );
    
    if (slot === 'modelA' && mode === 'compare' && model.id === newModels.modelB) {
        newModels.modelB = models.find(m => m.id !== model.id)?.id || null;
    }
    newModels[slot] = model.id;
    dispatch(setSelectedModels(newModels));
    
    if (isChangingActiveSessionModel) {
      const currentMode = activeSession.mode;
      dispatch(setSelectedMode(currentMode));
      dispatch(setActiveSession(null));
      navigate('/chat');
    }
  };

  if (isLoading || (models.length > 0 && !modelsInUse.modelA && mode !== 'random')) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
        <span>Initializing...</span>
      </div>
    );
  }

  if (variant === 'mode') {
    return (
      <div className="flex items-center justify-center">
        <ModeDropdown currentMode={mode} onModeChange={handleModeChange} />
      </div>
    );
  }

  if (variant === 'models') {
    if (mode === 'random') return null;
    return (
      <div className="flex items-center justify-center gap-2 sm:gap-3 flex-nowrap">
        <ModelDropdown
          models={models}
          selectedModelId={modelsInUse.modelA}
          onSelect={(model) => handleModelSelect(model, 'modelA')}
          fullWidth={mode === 'direct'}
        />
        {mode === 'compare' && modelsInUse.modelA && (
          <>
            <span className="text-orange-500 dark:text-orange-400 font-semibold text-xs sm:text-sm px-1">vs</span>
            <ModelDropdown
              models={models.filter(m => m.id !== modelsInUse.modelA)}
              selectedModelId={modelsInUse.modelB}
              onSelect={(model) => handleModelSelect(model, 'modelB')}
              disabled={!modelsInUse.modelA}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
      <ModeDropdown currentMode={mode} onModeChange={handleModeChange} />
      {mode !== 'random' && (
        <>
          <span className="text-orange-300 dark:text-orange-600 font-light text-lg sm:text-2xl hidden sm:inline">/</span>
          <ModelDropdown
            models={models}
            selectedModelId={modelsInUse.modelA}
            onSelect={(model) => handleModelSelect(model, 'modelA')}
          />
        </>
      )}
      {mode === 'compare' && modelsInUse.modelA && (
        <>
          <span className="text-orange-500 dark:text-orange-400 font-semibold text-xs sm:text-sm px-1 hidden sm:inline">vs</span>
          <span className="text-orange-300 dark:text-orange-600 font-light text-lg sm:hidden">/</span>
          <ModelDropdown
            models={models.filter(m => m.id !== modelsInUse.modelA)}
            selectedModelId={modelsInUse.modelB}
            onSelect={(model) => handleModelSelect(model, 'modelB')}
            disabled={!modelsInUse.modelA}
          />
        </>
      )}
    </div>
  );
}