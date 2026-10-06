import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { ModeDropdown } from '../../ocr/components/ModeDropdown';
import { ModelDropdown } from '../../ocr/components/ModelDropdown';
import { useTenant } from '../../../shared/context/TenantContext';
import { clearEvaluation, fetchEvalModels, setSelectedModelId } from '../store/evaluationSlice';

/** Header controls: arena mode menu + evaluator model picker. */
export function EvaluationModelSelector() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tenant: urlTenant } = useParams();
  const { tenant: contextTenant } = useTenant();
  const tenant = urlTenant || contextTenant;
  const { models, modelsLoading: loading, activeSession, selectedModelId } = useSelector(s => s.evaluation);

  useEffect(() => {
    dispatch(fetchEvalModels(tenant));
  }, [dispatch, tenant]);

  useEffect(() => {
    if (!models.length || activeSession) return;
    if (!models.some(m => m.id === selectedModelId)) dispatch(setSelectedModelId(models[0].id));
  }, [models, activeSession, selectedModelId, dispatch]);

  const go = (route) => navigate(tenant ? `/${tenant}/${route}` : `/${route}`);

  const handleModeChange = (mode) => {
    if (mode === 'direct') go('ocr');
    else if (mode === 'eduviz') go('eduviz');
  };

  const handleModelSelect = (model) => {
    dispatch(setSelectedModelId(model.id));
    if (activeSession && activeSession.model_a?.id !== model.id) {
      dispatch(clearEvaluation());
      go('evaluate');
    }
  };

  const shownModelId = activeSession?.model_a?.id || selectedModelId;

  return (
    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
      <ModeDropdown currentMode="evaluation" onModeChange={handleModeChange} />
      <span className="text-gray-300 font-light text-lg sm:text-2xl hidden sm:inline">/</span>
      {loading ? (
        <span className="text-sm text-gray-500 animate-pulse">Loading models…</span>
      ) : models.length ? (
        <ModelDropdown models={models} selectedModelId={shownModelId} onSelect={handleModelSelect} />
      ) : (
        <span className="text-sm text-gray-400">No evaluation models configured</span>
      )}
    </div>
  );
}
