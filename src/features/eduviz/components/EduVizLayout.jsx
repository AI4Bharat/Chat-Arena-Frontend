import { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus, LogOut, User, LogIn, BotMessageSquare,
  PanelLeftOpen, PanelLeftClose, ChevronDown, ScanText,
  Pin, Edit2, Ellipsis, Trash2, Search, X,
  MessageSquare, Mic, Volume2,
} from 'lucide-react';
import { AuthModal } from '../../auth/components/AuthModal';
import { SidebarItem } from '../../ocr/components/SidebarItem';
import { RenameSessionModal } from '../../chat/components/RenameSessionModal';
import { DropdownPortal } from '../../../shared/components/DropdownPortal';
import { useTenant } from '../../../shared/context/TenantContext';
import { ProviderIcons } from '../../../shared/icons';
import { logout } from '../../auth/store/authSlice';
import {
  fetchEduvizSessions,
  setActiveSession,
  clearEduvizState,
  togglePinEduvizSession,
  renameEduvizSession,
  deleteEduvizSession,
  fetchEduvizSessionById,
} from '../store/eduvizSlice';
import { EduVizWindow } from './EduVizWindow';
import { EduVizModelSelector } from './EduVizModelSelector';
import useDocumentTitle from '../../../shared/hooks/useDocumentTitle';

/* -------------------------------------------------------------------------- */
/*  Session item                                                              */
/* -------------------------------------------------------------------------- */
const SessionItem = ({ session, isActive, onClick, onPin, onRename, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(session.title || '');
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const inputRef = useRef(null);
  const dispatch = useDispatch();

  useEffect(() => { setRenameValue(session.title || ''); }, [session.title]);
  useEffect(() => { if (isRenaming && inputRef.current) inputRef.current.focus(); }, [isRenaming]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleMenuClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ top: rect.top, left: rect.right + 5 });
    setShowMenu(!showMenu);
  };

  const saveRename = () => {
    if (!renameValue.trim() || renameValue === session.title) {
      setIsRenaming(false);
      return;
    }
    dispatch(renameEduvizSession({ sessionId: session.id, title: renameValue }));
    setIsRenaming(false);
  };

  const firstWord = (session.model_a_name || '').split(/[\s-_]/)[0].toLowerCase();
  const IconComponent = ProviderIcons[firstWord];

  return (
    <div className={`group relative flex items-center mb-1 rounded-lg transition-colors select-none ${isActive ? 'bg-orange-100 text-orange-800' : 'text-gray-700 hover:bg-gray-100'
      }`}>
      <div onClick={() => !isRenaming && onClick()} className="relative w-full text-left p-2.5 rounded-lg flex items-center gap-3 text-sm font-medium cursor-pointer">
        <div className="flex-shrink-0 flex items-center justify-center" style={{ width: '28px' }}>
          {IconComponent ? <IconComponent className="h-4 w-4 rounded-full" /> : <ScanText className="flex-shrink-0" size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <input
              ref={inputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveRename(); else if (e.key === 'Escape') setIsRenaming(false); }}
              onBlur={saveRename}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-white border border-orange-300 rounded px-1 py-0.5 text-sm focus:outline-none text-gray-800"
              autoFocus
            />
          ) : (
            <div className="truncate">{session.title || 'EduViz Session'}</div>
          )}
        </div>
      </div>

      {!isRenaming && (
        <button
          ref={buttonRef}
          onClick={handleMenuClick}
          className={`hidden md:block absolute right-1 top-1/2 -translate-y-1/2 z-10 p-1 rounded-md hover:bg-gray-200/50 transition-all ${showMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
        >
          <Ellipsis size={16} />
        </button>
      )}

      {showMenu && (
        <DropdownPortal>
          <div ref={menuRef} style={{ position: 'fixed', top: menuPosition.top, left: menuPosition.left }}
            className="z-[9999] w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1">
            <button onClick={(e) => { e.stopPropagation(); onPin(session); setShowMenu(false); }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
              <Pin size={14} className={session.is_pinned ? 'fill-gray-700' : ''} />
              {session.is_pinned ? 'Unpin' : 'Pin'}
            </button>
            <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); setIsRenaming(true); }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
              <Edit2 size={14} /> Rename
            </button>
            <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); if (window.confirm('Delete?')) onDelete(session.id); }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 flex items-center gap-2 text-red-600">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </DropdownPortal>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Layout                                                                    */
/* -------------------------------------------------------------------------- */
export function EduVizLayout() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { activeSession, sessions } = useSelector(s => s.eduviz);
  const { user, isAnonymous } = useSelector(s => s.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { tenant: urlTenant } = useParams();
  const { tenant: contextTenant } = useTenant();
  const currentTenant = urlTenant || contextTenant;

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isArenaSwitcherOpen, setIsArenaSwitcherOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const arenaOptions = [
    { key: 'LLM', name: 'LLM Arena', icon: MessageSquare, url: '/chat' },
    { key: 'ASR', name: 'ASR Arena', icon: Mic, url: '/asr' },
    { key: 'TTS', name: 'TTS Arena', icon: Volume2, url: '/tts' },
    { key: 'OCR', name: 'OCR Arena', icon: ScanText, url: '/ocr' },
  ];

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { dispatch(fetchEduvizSessions()); }, [dispatch]);

  useEffect(() => {
    if (sessionId) {
      if (!activeSession || activeSession.id !== sessionId) {
        dispatch(fetchEduvizSessionById(sessionId));
      }
    } else {
      if (activeSession) dispatch(setActiveSession(null));
    }
  }, [sessionId, dispatch]);

  const handleNewSession = () => {
    dispatch(setActiveSession(null));
    dispatch(clearEduvizState());
    navigate(currentTenant ? `/${currentTenant}/eduviz` : '/eduviz');
  };

  const handleSelectSession = (session) => {
    navigate(currentTenant ? `/${currentTenant}/eduviz/${session.id}` : `/eduviz/${session.id}`);
  };

  const handlePin = (session) => {
    dispatch(togglePinEduvizSession({ sessionId: session.id, isPinned: !session.is_pinned }));
  };

  const handleDelete = (id) => {
    if (sessionId === id) {
      dispatch(setActiveSession(null));
      dispatch(clearEduvizState());
      navigate(currentTenant ? `/${currentTenant}/eduviz` : '/eduviz');
    }
    dispatch(deleteEduvizSession(id));
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate(currentTenant ? `/${currentTenant}/eduviz` : '/eduviz');
  };

  const pinnedSessions = useMemo(() => (sessions || []).filter(s => s.is_pinned), [sessions]);
  const unpinnedSessions = useMemo(() => (sessions || []).filter(s => !s.is_pinned), [sessions]);
  const filteredSessions = useMemo(() => {
    if (searchQuery.trim().length < 2) return null;
    const q = searchQuery.toLowerCase();
    return (sessions || []).filter(s => (s.title || '').toLowerCase().includes(q));
  }, [sessions, searchQuery]);

  useDocumentTitle('EduViz Benchmark');

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <div className={`bg-white border-r border-gray-200 flex flex-col h-full transition-all duration-300
          fixed inset-y-0 left-0 z-40 w-64 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:z-auto md:transform-none ${isSidebarOpen ? 'md:w-64' : 'md:w-14'}`}>

          {/* Sidebar header */}
          <div className="flex-shrink-0">
            <div className="flex items-center h-[65px] px-4 border-b border-gray-200">
              {isSidebarOpen ? (
                <div className="flex items-center justify-between w-full">
                  <div className="relative group/arena"
                    onMouseEnter={() => setIsArenaSwitcherOpen(true)}
                    onMouseLeave={() => setIsArenaSwitcherOpen(false)}>
                    <button className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1.5 transition-colors">
                      <BotMessageSquare className="text-orange-500 flex-shrink-0" size={20} />
                      <span className="font-bold text-lg whitespace-nowrap truncate">Indic OCR Arena</span>
                      <ChevronDown size={16} className={`text-gray-500 transition-transform ${isArenaSwitcherOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isArenaSwitcherOpen && (
                      <div className="absolute top-full left-0 pt-1 w-48 z-50">
                        <div className="bg-white rounded-lg shadow-xl border border-gray-100 py-1">
                          {arenaOptions.map((arena) => {
                            const Icon = arena.icon;
                            const isActive = arena.key === 'OCR';
                            return (
                              <button key={arena.key}
                                onClick={() => { navigate(currentTenant ? `/${currentTenant}${arena.url}` : arena.url); setIsArenaSwitcherOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 ${isActive ? 'bg-orange-50 text-orange-700' : 'text-gray-700'}`}>
                                <Icon size={18} className={isActive ? 'text-orange-500' : 'text-gray-500'} />
                                <span>Indic {arena.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                    <PanelLeftClose size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <button onClick={() => setIsSidebarOpen(true)} className="relative group p-1.5 rounded-lg hover:bg-gray-100">
                    <BotMessageSquare size={20} className="text-orange-500 transition-transform group-hover:scale-0" />
                    <PanelLeftOpen size={18} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-700 transition-transform scale-0 group-hover:scale-100" />
                  </button>
                </div>
              )}
            </div>

            <div className="p-2">
              <SidebarItem icon={Plus} text="New Session" isOpen={isSidebarOpen} onClick={handleNewSession} bordered={true} />
            </div>

            {isSidebarOpen && sessions.length > 0 && (
              <div className="px-2 pb-2">
                {isSearchOpen ? (
                  <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-100 rounded-lg">
                    <Search size={14} className="text-gray-400 flex-shrink-0" />
                    <input autoFocus type="text" value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search sessions..."
                      className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400" />
                    <button onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }} className="text-gray-400 hover:text-gray-600">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setIsSearchOpen(true)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Search size={14} /><span>Search sessions...</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Session list */}
          <div className={`flex-1 overflow-y-auto min-h-0 ${isSidebarOpen ? 'p-2' : 'opacity-0 pointer-events-none'}`}>
            {isSidebarOpen && (
              <>
                {filteredSessions ? (
                  filteredSessions.length > 0 ? filteredSessions.map(s => (
                    <SessionItem key={s.id} session={s} isActive={sessionId === s.id}
                      onClick={() => handleSelectSession(s)} onPin={handlePin}
                      onRename={() => { }} onDelete={handleDelete} />
                  )) : (
                    <p className="px-3 py-6 text-xs text-center text-gray-400">No sessions match</p>
                  )
                ) : (
                  <>
                    {pinnedSessions.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase px-2.5 mb-2 flex items-center gap-2">
                          <Pin size={12} /> Pinned
                        </h3>
                        {pinnedSessions.map(s => (
                          <SessionItem key={s.id} session={s} isActive={sessionId === s.id}
                            onClick={() => handleSelectSession(s)} onPin={handlePin}
                            onRename={() => { }} onDelete={handleDelete} />
                        ))}
                      </div>
                    )}
                    {unpinnedSessions.map(s => (
                      <SessionItem key={s.id} session={s} isActive={sessionId === s.id}
                        onClick={() => handleSelectSession(s)} onPin={handlePin}
                        onRename={() => { }} onDelete={handleDelete} />
                    ))}
                  </>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-2 flex-shrink-0">
            {isAnonymous ? (
              <SidebarItem icon={LogIn} text="Sign in to save" isOpen={isSidebarOpen} onClick={() => setShowAuthModal(true)} />
            ) : (
              <SidebarItem icon={LogOut} text="Logout" isOpen={isSidebarOpen} onClick={handleLogout} />
            )}
            <div className={`flex items-center p-2 mt-1 rounded-lg ${isSidebarOpen ? 'justify-start gap-3' : 'justify-center'}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isAnonymous ? 'bg-gray-200' : 'bg-orange-500 text-white'}`}>
                <User size={18} />
              </div>
              <div className={`overflow-hidden transition-all ${isSidebarOpen ? 'max-w-[180px]' : 'max-w-0'}`}>
                <p className="text-sm font-semibold whitespace-nowrap truncate">
                  {isAnonymous ? 'Guest User' : (user?.display_name || user?.email)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-gray-200 px-6 flex-shrink-0">
            <div className="flex items-center h-[64px]">
              <div className="flex items-center gap-3 w-full min-w-0">
                {!isSidebarOpen && (
                  <button className="p-2 rounded-lg hover:bg-gray-100" onClick={() => setIsSidebarOpen(true)}>
                    <PanelLeftOpen size={20} />
                  </button>
                )}
                <div className="min-w-0 flex-1">
                  <EduVizModelSelector />
                </div>
              </div>
            </div>
          </header>

          <EduVizWindow />
        </div>

        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} session_type="EDUVIZ" />
    </div>
  );
}
