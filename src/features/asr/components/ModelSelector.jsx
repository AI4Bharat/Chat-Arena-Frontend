import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { setSelectedMode, setSelectedModels, setActiveSession, resetLanguageSettings } from '../store/chatSlice';
import { ModeDropdown } from './ModeDropdown';
import { ModelDropdown } from './ModelDropdown';
import { fetchModelsASR } from '../../models/store/modelsSlice';
import { useTenant } from '../../../shared/context/TenantContext';

export function ModelSelector({ variant = 'full' }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tenant: urlTenant } = useParams();
  const { tenant: contextTenant } = useTenant();
  const currentTenant = urlTenant || contextTenant;
  const { activeSession, selectedMode, selectedModels } = useSelector((state) => state.asrChat);

  const { models, loading } = useSelector((state) => state.models);

  useEffect(() => {
    dispatch(fetchModelsASR(currentTenant));
  }, [dispatch, currentTenant]);

  const mode = activeSession?.mode || selectedMode || 'random';
  const modelsInUse = {
    modelA: activeSession?.model_a?.id || selectedModels?.modelA,
    modelB: activeSession?.model_b?.id || selectedModels?.modelB,
  };

  useEffect(() => {
    if (models.length > 0 && !activeSession) {
      const currentSelections = { ...selectedModels };
      let needsUpdate = false;

      if (currentSelections.modelA && !models.some((m) => m.id === currentSelections.modelA)) {
        currentSelections.modelA = null;
        needsUpdate = true;
      }

      if (currentSelections.modelB && !models.some((m) => m.id === currentSelections.modelB)) {
        currentSelections.modelB = null;
        needsUpdate = true;
      }

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
      dispatch(resetLanguageSettings());
      if (currentTenant) {
        navigate(`/${currentTenant}/asr`);
      } else {
        navigate('/asr');
      }
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
      dispatch(resetLanguageSettings());
      if (currentTenant) {
        navigate(`/${currentTenant}/asr`);
      } else {
        navigate('/asr');
      }
    }
  };

  if (loading || (models.length > 0 && !modelsInUse.modelA && mode !== 'random')) {
    return <div className="text-sm text-gray-500 animate-pulse">Initializing...</div>;
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
      <div className="flex items-center justify-center gap-1 sm:gap-2 flex-nowrap">
        <ModelDropdown
          models={models}
          selectedModelId={modelsInUse.modelA}
          onSelect={(model) => handleModelSelect(model, 'modelA')}
          fullWidth={mode === 'direct'}
        />
        {mode === 'compare' && modelsInUse.modelA && (
          <>
            <span className="text-gray-500 font-medium text-xs sm:text-sm mx-1">vs</span>
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
    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
      <ModeDropdown currentMode={mode} onModeChange={handleModeChange} />
      {mode !== 'random' && (
        <>
          <span className="text-gray-300 font-light text-lg sm:text-2xl hidden sm:inline">/</span>
          <ModelDropdown
            models={models}
            selectedModelId={modelsInUse.modelA}
            onSelect={(model) => handleModelSelect(model, 'modelA')}
          />
        </>
      )}
      {mode === 'compare' && modelsInUse.modelA && (
        <>
          <span className="text-gray-500 font-medium text-xs sm:text-sm mx-1 hidden sm:inline">vs</span>
          <span className="text-gray-500 font-medium text-xs sm:text-sm mx-1 sm:hidden">/</span>
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