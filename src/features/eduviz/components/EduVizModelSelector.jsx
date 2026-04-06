import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { setSelectedModels, setActiveSession, clearEduvizState } from '../store/eduvizSlice';
import { ModelDropdown } from '../../ocr/components/ModelDropdown';
import { ModeDropdown } from '../../ocr/components/ModeDropdown';
import { fetchModelsOCR } from '../../models/store/modelsSlice';
import { useTenant } from '../../../shared/context/TenantContext';

/**
 * EduViz model selector — direct mode only, single model.
 * Reads from eduviz slice instead of ocrChat.
 */
export function EduVizModelSelector() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tenant: urlTenant } = useParams();
  const { tenant: contextTenant } = useTenant();
  const currentTenant = urlTenant || contextTenant;
  const { activeSession, selectedModels } = useSelector(s => s.eduviz);
  const { models, loading } = useSelector(s => s.models);

  useEffect(() => {
    dispatch(fetchModelsOCR(currentTenant));
  }, [dispatch, currentTenant]);

  const modelsInUse = {
    modelA: activeSession?.model_a?.id || selectedModels?.modelA,
  };

  // Auto-select first model when models load
  useEffect(() => {
    if (models.length > 0 && !activeSession) {
      const isValid = selectedModels?.modelA && models.some(m => m.id === selectedModels.modelA);
      if (!isValid) {
        dispatch(setSelectedModels({ modelA: models[0].id }));
      }
    }
  }, [models, activeSession, dispatch]);

  const handleModelSelect = (model) => {
    const isChangingActive = activeSession && activeSession.model_a?.id !== model.id;
    dispatch(setSelectedModels({ modelA: model.id }));
    if (isChangingActive) {
      dispatch(setActiveSession(null));
      dispatch(clearEduvizState());
      navigate(currentTenant ? `/${currentTenant}/eduviz` : '/eduviz');
    }
  };

  const handleModeChange = (newMode) => {
    if (newMode === 'direct') {
      if (activeSession) {
        dispatch(setActiveSession(null));
        dispatch(clearEduvizState());
      }
      navigate(currentTenant ? `/${currentTenant}/ocr` : '/ocr');
    }
  };

  if (loading || (models.length > 0 && !modelsInUse.modelA)) {
    return <div className="text-sm text-gray-500 animate-pulse">Initializing...</div>;
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <ModeDropdown currentMode="eduviz" onModeChange={handleModeChange} />
      <span className="text-gray-300 font-light text-lg sm:text-2xl hidden sm:inline">/</span>
      <ModelDropdown
        models={models}
        selectedModelId={modelsInUse.modelA}
        onSelect={handleModelSelect}
      />
    </div>
  );
}
