import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { setSelectedMode, setSelectedModels, setActiveSession, clearOcrState } from '../store/chatSlice';
import { ModeDropdown } from './ModeDropdown';
import { ModelDropdown } from './ModelDropdown';
import { fetchModelsOCR } from '../../models/store/modelsSlice';
import { useTenant } from '../../../shared/context/TenantContext';

export function ModelSelector({ variant = 'full' }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tenant: urlTenant } = useParams();
  const { tenant: contextTenant } = useTenant();
  const currentTenant = urlTenant || contextTenant;
  const { activeSession, selectedModels } = useSelector(s => s.ocrChat);
  const { models, loading } = useSelector(s => s.models);

  useEffect(() => {
    dispatch(fetchModelsOCR(currentTenant));
  }, [dispatch, currentTenant]);

  // OCR only supports direct mode
  const mode = 'direct';
  const modelsInUse = {
    modelA: activeSession?.model_a?.id || selectedModels?.modelA,
    modelB: null,
  };

  // Auto-select first model when models load
  useEffect(() => {
    if (models.length > 0 && !activeSession) {
      const isValid = selectedModels?.modelA && models.some(m => m.id === selectedModels.modelA);
      if (!isValid) {
        dispatch(setSelectedModels({ modelA: models[0].id, modelB: null }));
      }
    }
  }, [models, activeSession, dispatch]);

  const handleModeChange = (newMode) => {
    dispatch(setSelectedMode(newMode));
    if (activeSession) {
      dispatch(setActiveSession(null));
      dispatch(clearOcrState());
      navigate(currentTenant ? `/${currentTenant}/ocr` : '/ocr');
    }
  };

  const handleModelSelect = (model) => {
    const isChangingActive = activeSession && activeSession.model_a?.id !== model.id;
    dispatch(setSelectedModels({ modelA: model.id, modelB: null }));
    if (isChangingActive) {
      dispatch(setActiveSession(null));
      dispatch(clearOcrState());
      navigate(currentTenant ? `/${currentTenant}/ocr` : '/ocr');
    }
  };

  if (loading || (models.length > 0 && !modelsInUse.modelA)) {
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
    return (
      <div className="flex items-center justify-center gap-1 sm:gap-2 flex-nowrap">
        <ModelDropdown
          models={models}
          selectedModelId={modelsInUse.modelA}
          onSelect={handleModelSelect}
          fullWidth
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
      <ModeDropdown currentMode={mode} onModeChange={handleModeChange} />
      <span className="text-gray-300 font-light text-lg sm:text-2xl hidden sm:inline">/</span>
      <ModelDropdown
        models={models}
        selectedModelId={modelsInUse.modelA}
        onSelect={handleModelSelect}
      />
    </div>
  );
}
