import { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSessions, setActiveSession, togglePinSession, renameSession, deleteSession, clearOcrState } from '../store/chatSlice';
import { logout } from '../../auth/store/authSlice';
import {
  Plus, MessageSquare, LogOut, User, LogIn, BotMessageSquare,
  PanelLeftOpen, PanelLeftClose, Trophy, Grid2x2, ScrollText,
  Pin, Edit2, Ellipsis, Mic, Volume2, ChevronDown, ScanText,
  Trash2, Search, X,
} from 'lucide-react';
import { AuthModal } from '../../auth/components/AuthModal';
import { useNavigate, useParams } from 'react-router-dom';
import { groupSessionsByDate } from '../utils/dateUtils';
import { SidebarItem } from './SidebarItem';
import { ProviderIcons } from '../../../shared/icons';
import { RenameSessionModal } from '../../chat/components/RenameSessionModal';
import { DropdownPortal } from '../../../shared/components/DropdownPortal';
import { useTenant } from '../../../shared/context/TenantContext';
import { apiClient } from '../../../shared/api/client';


const SessionItem = ({ session, isActive, onClick, onPin, onRename, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(session.title || '');

  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const inputRef = useRef(null);
  const itemRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const isLongPressRef = useRef(false);

  const dispatch = useDispatch();

  useEffect(() => { setRenameValue(session.title || ''); }, [session.title]);
  useEffect(() => { if (isRenaming && inputRef.current) inputRef.current.focus(); }, [isRenaming]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current && !menuRef.current.contains(event.target) &&
        buttonRef.current && !buttonRef.current.contains(event.target)
      ) setShowMenu(false);
    };
    const handleScroll = () => { if (showMenu) setShowMenu(false); };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMenu]);

  const calculateMenuPosition = (rect, isMobile) => {
    const MENU_WIDTH = 192;
    const MENU_HEIGHT = 130;
    const SW = window.innerWidth;
    const SH = window.innerHeight;
    let left = isMobile ? rect.left + rect.width / 2 - MENU_WIDTH / 2 : rect.right + 5;
    let top  = isMobile ? rect.bottom + 5 : rect.top;
    if (left + MENU_WIDTH > SW) left = SW - MENU_WIDTH - 10;
    if (left < 10) left = 10;
    if (top + MENU_HEIGHT > SH) { top = rect.top - MENU_HEIGHT; if (top < 10) top = 10; }
    return { top, left };
  };

  const handleMenuOpen = (rect) => {
    setMenuPosition(calculateMenuPosition(rect, window.innerWidth < 768));
    setShowMenu(true);
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    if (!showMenu) handleMenuOpen(e.currentTarget.getBoundingClientRect());
    else setShowMenu(false);
  };

  const handleTouchStart = () => {
    if (window.innerWidth >= 768) return;
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      if (itemRef.current) {
        handleMenuOpen(itemRef.current.getBoundingClientRect());
        if (navigator.vibrate) navigator.vibrate(50);
      }
    }, 500);
  };
  const handleTouchEnd = () => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); };
  const handleTouchMove = () => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); };

  const handleItemClick = () => {
    if (isRenaming) return;
    if (isLongPressRef.current) { isLongPressRef.current = false; return; }
    onClick();
  };

  const handleStartRename = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (window.innerWidth < 768) onRename(session);
    else setIsRenaming(true);
  };

  const saveRename = async () => {
    if (!renameValue.trim() || renameValue === session.title) {
      setIsRenaming(false);
      setRenameValue(session.title || '');
      return;
    }
    try {
      dispatch(renameSession({ sessionId: session.id, title: renameValue }));
      setIsRenaming(false);
    } catch {
      setRenameValue(session.title || '');
      setIsRenaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.stopPropagation(); saveRename(); }
    else if (e.key === 'Escape') { e.stopPropagation(); setIsRenaming(false); setRenameValue(session.title || ''); }
  };

  const handleJsonExport = async (e) => {
    e.stopPropagation();
    try {
      const response = await apiClient.get(`/sessions/${session.id}/`);
      const data = response.data || response;
      if (!data) throw new Error('No data received');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ocr_export_${(session.title || 'session').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setShowMenu(false);
    } catch (error) {
      console.error('Error exporting JSON:', error);
    }
  };

  const renderModeIcon = () => {
    if (session.mode === 'direct') {
      const firstWord = (session.model_a_name || '').split(/[\s-_]/)[0].toLowerCase();
      const IconComponent = ProviderIcons[firstWord];
      return IconComponent
        ? <IconComponent className="h-4 w-4 rounded-full bg-white ring-2 ring-white" />
        : <ScanText className="flex-shrink-0" size={16} />;
    }
    return <ScanText className="flex-shrink-0" size={16} />;
  };

  return (
    <div
      ref={itemRef}
      className={`group relative flex items-center mb-1 rounded-lg transition-colors select-none ${
        isActive ? 'bg-orange-100 text-orange-800' : 'text-gray-700 hover:bg-gray-100'
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      <div
        onClick={handleItemClick}
        className={`relative w-full text-left p-2 sm:p-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium cursor-pointer ${
          isActive ? 'text-orange-800' : 'text-gray-700'
        }`}
      >
        <div className="flex-shrink-0 flex items-center justify-center" style={{ width: '28px' }}>
          {renderModeIcon()}
        </div>
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <input
              ref={inputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={saveRename}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-white border border-orange-300 rounded px-1 py-0.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-800 shadow-sm"
              autoFocus
            />
          ) : (
            <div className={`truncate ${showMenu ? 'md:pr-4' : 'md:group-hover:pr-4'} transition-all duration-0`}>
              {session.title || 'OCR Session'}
            </div>
          )}
        </div>
      </div>

      {!isRenaming && (
        <button
          ref={buttonRef}
          onClick={handleMenuClick}
          className={`hidden md:block absolute right-1 top-1/2 -translate-y-1/2 z-10 p-1 rounded-md hover:bg-gray-200/50 transition-all duration-200 ${
            showMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          } ${isActive ? 'text-orange-800' : 'text-gray-500'}`}
        >
          <Ellipsis size={16} />
        </button>
      )}

      {showMenu && (
        <DropdownPortal>
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: menuPosition.top, left: menuPosition.left }}
            className="z-[9999] w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 text-gray-700 animate-in fade-in zoom-in-95 duration-100 origin-top-left"
          >
            <button
              onClick={(e) => { e.stopPropagation(); onPin(session); setShowMenu(false); }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <Pin size={14} className={session.is_pinned ? 'fill-gray-700' : ''} />
              {session.is_pinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              onClick={handleStartRename}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <Edit2 size={14} /> Rename
            </button>
            <button
              onClick={handleJsonExport}
              disabled={true}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <ScrollText size={14} /> Export JSON
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                if (window.confirm('Delete this session? This cannot be undone.')) {
                  onDelete(session.id);
                }
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </DropdownPortal>
      )}
    </div>
  );
};


export function OcrSidebar({ isOpen, onToggle }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sessionId, tenant: urlTenant } = useParams();
  const { tenant: contextTenant } = useTenant();
  const currentTenant = urlTenant || contextTenant;

  const { sessions } = useSelector(s => s.ocrChat);
  const { user, isAnonymous } = useSelector(s => s.auth);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLeaderboardDropdownOpen, setIsLeaderboardDropdownOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [sessionToRename, setSessionToRename] = useState(null);
  const [isArenaSwitcherOpen, setIsArenaSwitcherOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const arenaOptions = [
    { key: 'LLM', name: 'LLM Arena',  icon: MessageSquare, url: '/chat' },
    { key: 'ASR', name: 'ASR Arena',  icon: Mic,           url: '/asr' },
    { key: 'TTS', name: 'TTS Arena',  icon: Volume2,       url: '/tts' },
    { key: 'OCR', name: 'OCR Arena',  icon: ScanText,      url: '/ocr' },
  ];

  const currentArena = arenaOptions.find(a => a.key === 'OCR');

  const { pinnedSessions, groupedHistory } = useMemo(() => {
    if (!sessions) return { pinnedSessions: [], groupedHistory: [] };
    const pinned   = sessions.filter(s => s.is_pinned);
    const unpinned = sessions.filter(s => !s.is_pinned);
    return { pinnedSessions: pinned, groupedHistory: groupSessionsByDate(unpinned) };
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    if (searchQuery.trim().length < 2) return null;
    const q = searchQuery.toLowerCase();
    return sessions.filter(s => (s.title || '').toLowerCase().includes(q));
  }, [sessions, searchQuery]);

  useEffect(() => { dispatch(fetchSessions()); }, [dispatch]);

  const handlePinSession = (session) => {
    dispatch(togglePinSession({ sessionId: session.id, isPinned: !session.is_pinned }));
  };

  const handleRenameSession = (session) => {
    setSessionToRename(session);
    setRenameModalOpen(true);
  };

  const onRename = (newTitle) => {
    if (sessionToRename) {
      dispatch(renameSession({ sessionId: sessionToRename.id, title: newTitle }));
      setSessionToRename(null);
    }
  };

  const handleDeleteSession = (deletedSessionId) => {
    if (sessionId === deletedSessionId) {
      dispatch(setActiveSession(null));
      dispatch(clearOcrState());
      navigate(currentTenant ? `/${currentTenant}/ocr` : '/ocr');
    }
    dispatch(deleteSession(deletedSessionId));
  };

  const handleNewSession = () => {
    dispatch(setActiveSession(null));
    dispatch(clearOcrState());
    navigate(currentTenant ? `/${currentTenant}/ocr` : '/ocr');
    if (typeof window !== 'undefined' && window.innerWidth < 768 && onToggle) onToggle();
  };

  const handleLeaderboard = () => {
    navigate(currentTenant ? `/${currentTenant}/leaderboard/ocr/overview` : '/leaderboard/ocr/overview');
    if (typeof window !== 'undefined' && window.innerWidth < 768 && onToggle) onToggle();
  };

  const handleSelectSession = (session) => {
    navigate(currentTenant ? `/${currentTenant}/ocr/${session.id}` : `/ocr/${session.id}`);
    if (typeof window !== 'undefined' && window.innerWidth < 768 && onToggle) onToggle();
  };

  const handleLogout = () => { dispatch(logout()); window.location.reload(); };

  const isSearchActive = filteredSessions !== null;

  return (
    <>
      <div
        className={`bg-white border-r border-gray-200 flex flex-col h-full transition-all duration-300
          fixed inset-y-0 left-0 z-40 w-64 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:z-auto md:transform-none ${isOpen ? 'md:w-64' : 'md:w-14'}`}
      >
        {/* Header */}
        <div className="flex-shrink-0">
          <div className="flex items-center h-[65px] px-3 sm:px-4 border-b border-gray-200">
            {isOpen ? (
              <div className="flex items-center justify-between w-full">
                <div
                  className="relative group/arena"
                  onMouseEnter={() => setIsArenaSwitcherOpen(true)}
                  onMouseLeave={() => setIsArenaSwitcherOpen(false)}
                >
                  <button className="flex items-center gap-2 overflow-hidden min-w-0 hover:bg-gray-100 rounded-lg px-2 py-1.5 transition-colors">
                    <BotMessageSquare className="text-orange-500 flex-shrink-0" size={20} />
                    <span className="font-bold text-base sm:text-lg whitespace-nowrap truncate">
                      Indic {currentArena.name}
                    </span>
                    <ChevronDown size={16} className={`text-gray-500 transition-transform ${isArenaSwitcherOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isArenaSwitcherOpen && (
                    <div className="absolute top-full left-0 pt-1 w-48 z-50">
                      <div className="bg-white rounded-lg shadow-xl border border-gray-100 py-1">
                        {arenaOptions.map((arena) => {
                          const Icon = arena.icon;
                          const isActive = arena.key === 'OCR';
                          return (
                            <button
                              key={arena.key}
                              onClick={() => {
                                navigate(currentTenant ? `/${currentTenant}${arena.url}` : arena.url);
                                setIsArenaSwitcherOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 ${isActive ? 'bg-orange-50 text-orange-700' : 'text-gray-700'}`}
                            >
                              <Icon size={18} className={isActive ? 'text-orange-500' : 'text-gray-500'} />
                              <span>Indic {arena.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-gray-100 flex-shrink-0">
                  <PanelLeftClose size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <button onClick={onToggle} className="relative group p-1.5 rounded-lg hover:bg-gray-100">
                  <BotMessageSquare size={20} className="text-orange-500 transition-transform duration-300 group-hover:scale-0" />
                  <PanelLeftOpen size={18} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-700 transition-transform duration-300 scale-0 group-hover:scale-100" />
                </button>
              </div>
            )}
          </div>

          <div className="p-2">
            <SidebarItem icon={Plus} text="New Session" isOpen={isOpen} onClick={handleNewSession} bordered={true} />
            <div
              className="relative group"
              onMouseEnter={() => setIsLeaderboardDropdownOpen(true)}
              onMouseLeave={() => setIsLeaderboardDropdownOpen(false)}
            >
              <SidebarItem icon={Trophy} text="Leaderboard" isOpen={isOpen} onClick={handleLeaderboard} arrow={true} />
              <div className={`
                absolute top-0 left-full min-w-[210px] z-50
                bg-white text-gray-700 shadow-lg rounded-lg py-1
                ${isLeaderboardDropdownOpen ? 'visible opacity-100 translate-x-0 transition-all duration-200 delay-300' : 'invisible opacity-0 -translate-x-2'}
              `}>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => { navigate(currentTenant ? `/${currentTenant}/leaderboard/ocr/overview` : '/leaderboard/ocr/overview'); setIsLeaderboardDropdownOpen(false); }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 rounded transition text-left w-full"
                  >
                    <Grid2x2 size={18} /><span className="text-sm">Overview</span>
                  </button>
                  <button
                    onClick={() => { navigate(currentTenant ? `/${currentTenant}/leaderboard/ocr/ocr` : '/leaderboard/ocr/ocr'); setIsLeaderboardDropdownOpen(false); }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 rounded transition text-left w-full"
                  >
                    <ScrollText size={18} /><span className="text-sm">OCR</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          {isOpen && sessions.length > 0 && (
            <div className="px-2 pb-2">
              {isSearchOpen ? (
                <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-100 rounded-lg">
                  <Search size={14} className="text-gray-400 flex-shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search sessions..."
                    className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400"
                  />
                  <button onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }} className="text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Search size={14} />
                  <span>Search sessions...</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Session list */}
        <div className={`flex-1 overflow-y-auto min-h-0 transition-opacity duration-200 ${isOpen ? 'opacity-100 p-2' : 'opacity-0 pointer-events-none md:pointer-events-auto'}`}>
          {isOpen && (
            <>
              {isSearchActive ? (
                filteredSessions.length > 0 ? (
                  <div className="mb-4">
                    {filteredSessions.map(session => (
                      <SessionItem
                        key={session.id}
                        session={session}
                        isActive={sessionId === session.id}
                        onClick={() => handleSelectSession(session)}
                        onPin={handlePinSession}
                        onRename={handleRenameSession}
                        onDelete={handleDeleteSession}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="px-3 py-6 text-xs text-center text-gray-400">
                    No sessions match &ldquo;{searchQuery}&rdquo;
                  </p>
                )
              ) : (
                <>
                  {pinnedSessions.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase px-2.5 mb-2 flex items-center gap-2">
                        <Pin size={12} /> Pinned
                      </h3>
                      {pinnedSessions.map(session => (
                        <SessionItem
                          key={session.id}
                          session={session}
                          isActive={sessionId === session.id}
                          onClick={() => handleSelectSession(session)}
                          onPin={handlePinSession}
                          onRename={handleRenameSession}
                          onDelete={handleDeleteSession}
                        />
                      ))}
                    </div>
                  )}

                  {groupedHistory.map(group => (
                    <div key={group.title} className="mb-4">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase px-2.5 mb-2">{group.title}</h3>
                      {group.sessions.map(session => (
                        <SessionItem
                          key={session.id}
                          session={session}
                          isActive={sessionId === session.id}
                          onClick={() => handleSelectSession(session)}
                          onPin={handlePinSession}
                          onRename={handleRenameSession}
                          onDelete={handleDeleteSession}
                        />
                      ))}
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-2 flex-shrink-0">
          {isAnonymous ? (
            <SidebarItem icon={LogIn} text="Sign in to save" isOpen={isOpen} onClick={() => setShowAuthModal(true)} />
          ) : (
            <SidebarItem icon={LogOut} text="Logout" isOpen={isOpen} onClick={handleLogout} />
          )}
          <div className={`flex items-center p-1.5 sm:p-2 mt-1 rounded-lg ${isOpen ? 'justify-start gap-2 sm:gap-3' : 'justify-center'}`}>
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isAnonymous ? 'bg-gray-200' : 'bg-orange-500 text-white'}`}>
              <User size={16} className="sm:w-[18px] sm:h-[18px]" />
            </div>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-w-[150px] sm:max-w-[180px]' : 'max-w-0'}`}>
              <p className="text-xs sm:text-sm font-semibold whitespace-nowrap truncate">
                {isAnonymous ? 'Guest User' : (user?.display_name || user?.email)}
              </p>
            </div>
          </div>
        </div>

        <div className={`justify-between items-center pt-2 text-xs text-gray-500 border-t border-gray-200 py-2 px-2 transition-opacity duration-200 ${isOpen ? 'flex opacity-100' : 'hidden opacity-0'}`}>
          <a href="/#/terms" target="_blank" rel="noopener noreferrer" className="hover:text-gray-800 hover:underline transition-colors">Terms of Use</a>
          <span className="text-gray-300">|</span>
          <a href="/#/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-gray-800 hover:underline transition-colors">Privacy Policy</a>
          <span className="text-gray-300">|</span>
          <a href="https://ai4bharat.iitm.ac.in" target="_blank" rel="noopener noreferrer" className="hover:text-gray-800 hover:underline transition-colors">About Us</a>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} session_type="OCR" />
      <RenameSessionModal
        isOpen={renameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        onRename={onRename}
        currentTitle={sessionToRename?.title}
      />
    </>
  );
}
