import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { PanelLeftOpen, Plus } from 'lucide-react';
import { Grid3x3, ScanText } from 'lucide-react';
import { OcrSidebar } from './OcrSidebar';
import { OcrWindow } from './OcrWindow';
import { ModelSelector } from './ModelSelector';
import { AuthPromptBanner } from '../../auth/components/AuthPromptBanner';
import { LeaderboardContent } from './LeaderboardContent';
import { LeaderboardFilters } from '../../leaderboard/components/LeaderboardFilters';
import { fetchSessionById, setActiveSession, clearOcrState } from '../store/chatSlice';
import useDocumentTitle from '../../../shared/hooks/useDocumentTitle';
import { useTenant } from '../../../shared/context/TenantContext';

export function OcrLayout() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { activeSession } = useSelector(s => s.ocrChat);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { tenant: urlTenant } = useParams();
  const { tenant: contextTenant } = useTenant();
  const currentTenant = urlTenant || contextTenant;

  const isLeaderboardRoute = location.pathname.includes('/leaderboard');

  const filters = [
    { name: 'Overview', suffix: 'overview', icon: Grid3x3 },
    { name: 'OCR', suffix: 'ocr', icon: ScanText },
  ];

  useEffect(() => {
    const applyResponsiveSidebar = () => {
      if (typeof window === 'undefined') return;
      setIsSidebarOpen(window.innerWidth >= 768);
    };
    applyResponsiveSidebar();
    window.addEventListener('resize', applyResponsiveSidebar);
    return () => window.removeEventListener('resize', applyResponsiveSidebar);
  }, []);

  useEffect(() => {
    if (sessionId) {
      if (!activeSession || activeSession.id !== sessionId) {
        dispatch(fetchSessionById(sessionId));
      }
    } else {
      if (activeSession) {
        dispatch(setActiveSession(null));
      }
    }
  }, [sessionId, dispatch]);

  const handleNewSession = () => {
    dispatch(setActiveSession(null));
    dispatch(clearOcrState());
    navigate(currentTenant ? `/${currentTenant}/ocr` : '/ocr');
  };

  useDocumentTitle('Indic OCR Arena');

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <AuthPromptBanner session_type="OCR" />

      <div className="flex flex-1 overflow-hidden">
        <OcrSidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(o => !o)} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-gray-200 px-2 sm:px-4 md:px-6 flex-shrink-0">
            {isLeaderboardRoute ? (
              <div className="flex items-center h-[64px]">
                <div className="flex items-center gap-3 w-full min-w-0">
                  <button
                    className="md:hidden p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 flex-shrink-0"
                    onClick={() => setIsSidebarOpen(true)}
                  >
                    <PanelLeftOpen size={20} />
                  </button>
                  <LeaderboardFilters
                    basePath={currentTenant ? `/${currentTenant}/leaderboard/ocr` : '/leaderboard/ocr'}
                    availableFilters={filters}
                  />
                </div>
              </div>
            ) : (
              <>
                {/* Mobile */}
                <div className="md:hidden">
                  <div className="flex items-center justify-between w-full min-w-0 h-[48px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 flex-shrink-0"
                        onClick={() => setIsSidebarOpen(true)}
                      >
                        <PanelLeftOpen size={20} />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-center">
                      <ModelSelector variant="mode" />
                    </div>
                    <div className="flex items-center gap-2">
                      {!isSidebarOpen && (
                        <button onClick={handleNewSession} className="p-2 rounded-lg hover:bg-gray-100">
                          <Plus size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="pb-2">
                    <ModelSelector variant="models" />
                  </div>
                </div>

                {/* Desktop */}
                <div className="hidden md:flex items-center h-[64px]">
                  <div className="flex items-center gap-3 w-full min-w-0">
                    <div className="min-w-0 flex-1">
                      <ModelSelector />
                    </div>
                  </div>
                </div>
              </>
            )}
          </header>

          {isLeaderboardRoute
            ? <LeaderboardContent />
            : <OcrWindow />
          }
        </div>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
