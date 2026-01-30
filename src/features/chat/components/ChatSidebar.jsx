import { useEffect, useState, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSessions,
  setActiveSession,
  clearMessages,
  resetLanguageSettings,
  togglePinSession,
  renameSession,
} from "../store/chatSlice";
import { logout } from "../../auth/store/authSlice";
import {
  Plus,
  MessageSquare,
  LogOut,
  User,
  LogIn,
  BotMessageSquare,
  PanelLeftOpen,
  PanelLeftClose,
  Trophy,
  Grid2x2,
  ScrollText,
  Shuffle,
  Pin,
  Edit2,
  Ellipsis,
  Download,
  ChevronRight,
  FileSpreadsheet,
  FileJson,
  Mic,
  Volume2,
  ChevronDown,
} from 'lucide-react';
import { AuthModal } from '../../auth/components/AuthModal';
import { useNavigate, useParams } from 'react-router-dom';
import { groupSessionsByDate } from '../utils/dateUtils';
import { SidebarItem } from './SidebarItem';
import { ProviderIcons } from '../../../shared/icons';
import { useTenant } from '../../../shared/context/TenantContext';
import { RenameSessionModal } from "../../chat/components/RenameSessionModal";
import { DropdownPortal } from "../../../shared/components/DropdownPortal";
import { apiClient } from '../../../shared/api/client';


const SessionItem = ({ session, isActive, onClick, onPin, onRename }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(session.title || "");
  const [showExportMenu, setShowExportMenu] = useState(false);

  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const inputRef = useRef(null);
  const itemRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const isLongPressRef = useRef(false);

  const dispatch = useDispatch();

  useEffect(() => {
    setRenameValue(session.title || "");
  }, [session.title]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isRenaming]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowMenu(false);
        setShowExportMenu(false);
      }
    };

    const handleScroll = () => {
      if (showMenu) {
        setShowMenu(false);
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showMenu]);


  const calculateMenuPosition = (rect, isMobile) => {
    const MENU_WIDTH = 192;
    const MENU_HEIGHT = 100;
    const SCREEN_WIDTH = window.innerWidth;
    const SCREEN_HEIGHT = window.innerHeight;

    let left, top;

    if (isMobile) {
      left = rect.left + (rect.width / 2) - (MENU_WIDTH / 2);
      top = rect.bottom + 5;
    } else {
      left = rect.right + 5;
      top = rect.top;
    }

    if (left + MENU_WIDTH > SCREEN_WIDTH) {
      left = SCREEN_WIDTH - MENU_WIDTH - 10;
    }
    if (left < 10) {
      left = 10;
    }

    if (top + MENU_HEIGHT > SCREEN_HEIGHT) {
      top = rect.top - MENU_HEIGHT;
      if (top < 10) top = 10;
    }

    return { top, left };
  };

  const handleMenuOpen = (rect) => {
    const isMobile = window.innerWidth < 768;
    const position = calculateMenuPosition(rect, isMobile);
    setMenuPosition(position);
    setShowMenu(true);
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    if (!showMenu) {
      const rect = e.currentTarget.getBoundingClientRect();
      handleMenuOpen(rect);
    } else {
      setShowMenu(false);
      setShowExportMenu(false);
    }
  };

  const handleTouchStart = (e) => {
    if (window.innerWidth >= 768) return;
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      if (itemRef.current) {
        const rect = itemRef.current.getBoundingClientRect();
        handleMenuOpen(rect);
        if (navigator.vibrate) navigator.vibrate(50);
      }
    }, 500);
  };

  const handleTouchEnd = (e) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const handleTouchMove = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const handleItemClick = (e) => {
    if (isRenaming) return;

    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }

    onClick();
  };

  const handleStartRename = (e) => {
    e.stopPropagation();
    setShowMenu(false);

    if (window.innerWidth < 768) {
      onRename(session);
    } else {
      setIsRenaming(true);
    }
  };

  const saveRename = async () => {
    if (!renameValue.trim() || renameValue === session.title) {
      setIsRenaming(false);
      setRenameValue(session.title || "");
      return;
    }

    try {
      await dispatch(renameSession({ sessionId: session.id, title: renameValue }));
      setIsRenaming(false);
    } catch (error) {
      console.error("Failed to rename", error);
      setRenameValue(session.title || "");
      setIsRenaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      saveRename();
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setIsRenaming(false);
      setRenameValue(session.title || "");
    }
  };

  const handleInputClick = (e) => {
    e.stopPropagation();
  };

  const handleJsonExport = async (e) => {
    e.stopPropagation();

    try {
      const response = await apiClient.get(`/sessions/${session.id}/`);
      const data = response.data || response;

      if (!data) throw new Error("No data received");

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `chat_export_${(session.title || 'chat').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setShowMenu(false);
      setShowExportMenu(false);

    } catch (error) {
      console.error("Error exporting JSON:", error);
      alert("Failed to export chat as JSON. Please try again.");
    }
  };

  const handleCsvExport = async (e) => {
    e.stopPropagation();
    try {
      const response = await apiClient.get(`/sessions/${session.id}/`);
      const data = response.data || response;

      if (!data || !data.messages) throw new Error("No messages found");

      const headers = ["Role", "Content", "Timestamp", "Model"];

      const escapeCsvField = (field) => {
        if (field === null || field === undefined) return "";
        const stringField = String(field);
        if (stringField.search(/("|,|\n)/g) >= 0) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      };

      const mode = data.session?.mode || "direct";
      const modelA = data.session?.model_a;
      const modelB = data.session?.model_b;

      let sessionModelText = "Unknown Model";
      if (mode === "direct") {
        sessionModelText = modelA?.display_name || "Unknown Model";
      } else {
        const nameA = modelA?.display_name || "Model A";
        const nameB = modelB?.display_name || "Model B";
        sessionModelText = `${nameA} vs ${nameB}`;
      }

      const csvRows = [
        headers.join(","),
        ...data.messages.map((msg) => {
          const isUser = msg.role === 'user';
          let senderName = "Unknown";

          if (isUser) {
            senderName = "User";
          } else {
            if (mode === 'direct') {
              senderName = modelA?.display_name || "AI Model";
            } else {
              if (msg.participant === 'a' || msg.participant === 'model_a') {
                senderName = modelA?.display_name || "Model A";
              } else if (msg.participant === 'b' || msg.participant === 'model_b') {
                senderName = modelB?.display_name || "Model B";
              } else {
                senderName = "AI Model";
              }
            }
          }

          return [
            escapeCsvField(senderName),
            escapeCsvField(msg.content),
            escapeCsvField(new Date(msg.created_at).toLocaleString()),
            escapeCsvField(sessionModelText)
          ].join(",");
        }),
      ].join("\n");

      const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `chat_export_${(session.title || 'chat').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setShowMenu(false);
      setShowExportMenu(false);

    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Failed to export chat as CSV.");
    }
  };

  // Helper to get the icon for a provider
  const getProviderIcon = (provider) => {
    if (!provider) return null;
    const Icon = ProviderIcons[provider.toLowerCase()];
    return Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null;
  };

  // Determine which icon(s) to show based on mode
  const renderModeIcon = () => {
    if (session.mode === "random") {
      return (
        <Shuffle
          className="flex-shrink-0 rounded-full bg-white ring-2 ring-white"
          size={16}
        />
      );
    }

    if (session.mode === 'direct') {
      const modelName = session.model_a_name || '';
      const firstWord = modelName.split(/[\s-_]/)[0].toLowerCase();
      const IconComponent = ProviderIcons[firstWord];
      return IconComponent ? (
        <IconComponent className="h-4 w-4 rounded-full bg-white ring-2 ring-white" />
      ) : (
        <MessageSquare className="flex-shrink-0" size={16} />
      );
    }

    if (session.mode === 'compare') {
      const modelName_a = session.model_a_name?.split(/[\s-_]/)[0].toLowerCase() || '';
      const modelName_b = session.model_b_name?.split(/[\s-_]/)[0].toLowerCase() || '';
      const iconA = getProviderIcon(modelName_a);
      const iconB = getProviderIcon(modelName_b);


      const fallbackIcon = <MessageSquare size={10} className="text-gray-500" />;

      return (
        <div className="flex items-center">
          <div className="relative z-10 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-2 ring-white">
            {iconA || fallbackIcon}
          </div>
          <div className="relative flex h-4 w-4 items-center justify-center rounded-full bg-white ring-2 ring-white">
            {iconB || fallbackIcon}
          </div>
        </div>
      );
    }

    return <MessageSquare className="flex-shrink-0" size={16} />;
  };

  return (
    <div
      ref={itemRef}
      className={`
      group relative flex items-center mb-1 rounded-lg transition-colors select-none
      ${isActive ? "bg-orange-100 text-orange-800" : "text-gray-700 hover:bg-gray-100"}
    `}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onContextMenu={(e) => {
        if (window.innerWidth < 768) {
          // e.preventDefault(); // Optional: depend on preference
        }
      }}
    >
      <div
        onClick={handleItemClick}
        className={`
          relative w-full text-left p-2 sm:p-2.5 rounded-lg transition-all duration-200
          flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium
          cursor-pointer
          ${isActive ? 'text-orange-800' : 'text-gray-700'}
        `}
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
              onClick={handleInputClick}
              className="w-full bg-white border border-orange-300 rounded px-1 py-0.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-800 shadow-sm"
              autoFocus
            />
          ) : (
            <div className={`truncate ${showMenu ? 'md:pr-4' : 'md:group-hover:pr-4'} transition-all duration-0`}>
              {session.title || 'New Conversation'}
            </div>
          )}
        </div>
      </div>

      {!isRenaming && (
        <button
          ref={buttonRef}
          onClick={handleMenuClick}
          className={`
            hidden md:block 
            absolute right-1 top-1/2 -translate-y-1/2 z-10
            p-1 rounded-md hover:bg-gray-200/50 transition-all duration-200
            ${showMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} 
            ${isActive ? 'text-orange-800' : 'text-gray-500'}
          `}
        >
          <Ellipsis size={16} />
        </button>
      )}

      {showMenu && (
        <DropdownPortal>
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: menuPosition.top,
              left: menuPosition.left,
            }}
            className="z-[9999] w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 text-gray-700 animate-in fade-in zoom-in-95 duration-100 origin-top-left"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPin(session);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <Pin
                size={14}
                className={session.is_pinned ? "fill-gray-700" : ""}
              />
              {session.is_pinned ? "Unpin" : "Pin"}
            </button>

            <button
              onClick={handleStartRename}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 md:flex items-center gap-2 hidden"
            >
              <Edit2 size={14} /> Rename
            </button>
            <button
              onClick={handleStartRename}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex md:hidden items-center gap-2"
            >
              <Edit2 size={14} /> Rename
            </button>

            <div className="relative group/export w-full">
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between gap-2 text-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowExportMenu(!showExportMenu);
                }}
              >
                <div className="flex items-center gap-2">
                  <Download size={14} />
                  <span>Export</span>
                </div>
                <ChevronRight size={12} className={`text-gray-400 transition-transform ${showExportMenu && window.innerWidth < 768 ? 'rotate-90' : ''}`} />
              </button>

              <div className={`
                  ${window.innerWidth < 768 ? 'relative w-full bg-gray-50/50 border-t border-gray-100' : 'absolute left-full top-0 ml-1 w-40 bg-white shadow-xl border border-gray-100 rounded-lg'}
                  z-[10000] py-1
                  ${showExportMenu ? 'block' : 'hidden md:group-hover/export:block'}
              `}>
                {/* CSV */}
                <button
                  onClick={handleCsvExport}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <FileSpreadsheet size={14} className="text-green-600" />
                  <span>CSV</span>
                </button>

                {/* JSON */}
                <button
                  onClick={handleJsonExport}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <FileJson size={14} className="text-yellow-600" />
                  <span>JSON</span>
                </button>
              </div>
            </div>

          </div>
        </DropdownPortal>
      )}
    </div>
  );
};

export function ChatSidebar({ isOpen, onToggle }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sessionId, tenant: urlTenant } = useParams();
  const { sessions } = useSelector((state) => state.chat);
  const { user, isAnonymous } = useSelector((state) => state.auth);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLeaderboardDropdownOpen, setIsLeaderboardDropdownOpen] = useState(false);
  const { tenant: contextTenant } = useTenant();

  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [sessionToRename, setSessionToRename] = useState(null);
  const [isArenaSwitcherOpen, setIsArenaSwitcherOpen] = useState(false);

  const arenaOptions = [
    { key: 'LLM', name: 'LLM Arena', icon: MessageSquare, url: '/chat' },
    { key: 'ASR', name: 'ASR Arena', icon: Mic, url: '/asr' },
    { key: 'TTS', name: 'TTS Arena', icon: Volume2, url: '/tts' },
  ];

  const currentArena = arenaOptions.find(a => a.key === 'LLM');

  // Use URL tenant or context tenant
  let currentTenant = urlTenant || contextTenant;
  if (currentTenant === 'leaderboard') currentTenant = null;


  const groupedSessions = useMemo(
    () => groupSessionsByDate(sessions),
    [sessions]
  );

  const { pinnedSessions, groupedHistory } = useMemo(() => {
    if (!sessions) return { pinnedSessions: [], groupedHistory: [] };

    const pinned = sessions.filter((s) => s.is_pinned);
    const unpinned = sessions.filter((s) => !s.is_pinned);

    return {
      pinnedSessions: pinned,
      groupedHistory: groupSessionsByDate(unpinned),
    };
  }, [sessions]);

  useEffect(() => {
    dispatch(fetchSessions());
  }, [dispatch]);

  const handleNewChat = () => {
    dispatch(setActiveSession(null));
    dispatch(clearMessages());
    dispatch(resetLanguageSettings());
    // Navigate with tenant prefix if available
    if (currentTenant) {
      navigate(`/${currentTenant}/chat`);
    } else {
      navigate('/chat');
    }
    // Auto-close sidebar on small screens after starting a new chat
    if (typeof window !== 'undefined' && window.innerWidth < 768 && onToggle) {
      onToggle();
    }
  };

  const handleLeaderboard = () => {
    if (currentTenant) {
      navigate(`/${currentTenant}/leaderboard/chat/overview`);
    } else {
      navigate('/leaderboard/chat/overview');
    }
    // Auto-close sidebar on small screens after navigation
    if (typeof window !== 'undefined' && window.innerWidth < 768 && onToggle) {
      onToggle();
    }
  };


  const handleSelectSession = (session) => {
    // Navigate with tenant prefix if available
    if (currentTenant) {
      navigate(`/${currentTenant}/chat/${session.id}`);
    } else {
      navigate(`/chat/${session.id}`);
    }
    // Auto-close sidebar on small screens after selecting a session
    if (typeof window !== 'undefined' && window.innerWidth < 768 && onToggle) {
      onToggle();
    }
  };

  const handlePinSession = (session) => {
    dispatch(
      togglePinSession({
        sessionId: session.id,
        isPinned: !session.is_pinned,
      })
    );
  };

  const handleRenameSession = (session) => {
    setSessionToRename(session);
    setRenameModalOpen(true);
  };

  const onRename = async (newTitle) => {
    if (sessionToRename) {
      await dispatch(
        renameSession({ sessionId: sessionToRename.id, title: newTitle })
      );
      setSessionToRename(null);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    window.location.reload();
  };

  const getExpiryInfo = () => {
    if (!isAnonymous || !user?.anonymous_expires_at) return null;
    const expiryDate = new Date(user.anonymous_expires_at);
    const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
    return { displayText: `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left` };
  };

  const expiryInfo = getExpiryInfo();

  return (
    <>
      <div
        data-tour="sidebar"
        className={`bg-white border-r border-gray-200 flex flex-col h-full transition-all duration-300
          fixed inset-y-0 left-0 z-40 w-64 transform ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:z-auto md:transform-none ${isOpen ? "md:w-64" : "md:w-14"}`}
      >

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
                    <BotMessageSquare
                      className="text-orange-500 flex-shrink-0"
                      size={20}
                    />
                    <span className="font-bold text-base sm:text-lg whitespace-nowrap truncate">
                      Indic {currentArena.name}
                    </span>
                    <ChevronDown size={16} className={`text-gray-500 transition-transform ${isArenaSwitcherOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isArenaSwitcherOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50">
                      {arenaOptions.map((arena) => {
                        const Icon = arena.icon;
                        const isActive = arena.key === 'LLM';
                        return (
                          <button
                            key={arena.key}
                            onClick={() => {
                              if (currentTenant) {
                                navigate(`/${currentTenant}${arena.url}`);
                              } else {
                                navigate(arena.url);
                              }
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
                  )}
                </div>
                <button
                  onClick={onToggle}
                  className="p-1.5 rounded-lg hover:bg-gray-100 flex-shrink-0"
                >
                  <PanelLeftClose size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <button
                  onClick={onToggle}
                  className="relative group p-1.5 rounded-lg hover:bg-gray-100"
                >
                  <BotMessageSquare
                    size={20}
                    className="text-orange-500 transition-transform duration-300 group-hover:scale-0"
                  />
                  <PanelLeftOpen
                    size={18}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-700 transition-transform duration-300 scale-0 group-hover:scale-100"
                  />
                </button>
              </div>
            )}
          </div>

          <div className="p-2">
            <SidebarItem icon={Plus} text="New Chat" isOpen={isOpen} onClick={handleNewChat} bordered={true} />
            <div
              className="relative group"
              data-tour="leaderboard-link"
              onMouseEnter={() => setIsLeaderboardDropdownOpen(true)}
              onMouseLeave={() => setIsLeaderboardDropdownOpen(false)}
            >
              <SidebarItem
                icon={Trophy}
                text="Leaderboard"
                isOpen={isOpen}
                onClick={handleLeaderboard}
                arrow={true}
              />

              <div
                className={`
                    absolute top-0 left-full min-w-[210px] z-50
                    bg-white text-gray-700 shadow-lg rounded-lg py-1
                    ${isLeaderboardDropdownOpen ? "visible opacity-100 translate-x-0 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 delay-300" : "invisible opacity-0 -translate-x-2"}
                  `}
              >
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => {
                      if (currentTenant) {
                        navigate(`/${currentTenant}/leaderboard/chat/overview`);
                      } else {
                        navigate('/leaderboard/chat/overview');
                      }
                      setIsLeaderboardDropdownOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 rounded transition text-left w-full"
                  >
                    <Grid2x2 size={18} />
                    <span className="text-sm">Overview</span>
                  </button>
                  <button
                    onClick={() => {
                      if (currentTenant) {
                        navigate(`/${currentTenant}/leaderboard/chat/text`);
                      } else {
                        navigate('/leaderboard/chat/text');
                      }
                      setIsLeaderboardDropdownOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 rounded transition text-left w-full"
                  >
                    <ScrollText size={18} />
                    <span className="text-sm">Text</span>
                  </button>
{/* <button
                    onClick={() => {
                      if (currentTenant) {
                        navigate(`/${currentTenant}/leaderboard/chat/contributors`);
                      } else {
                        navigate('/leaderboard/chat/contributors');
                      }
                      setIsLeaderboardDropdownOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 rounded transition text-left w-full"
                  >
                    <User size={18} />
                    <span className="text-sm">Top Contributors</span>
                  </button> */}
                  {/* <button 
                        onClick={() => navigate('/leaderboard/webdev')}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 rounded transition text-left w-full"
                      >
                        <AppWindow size={18}/>
                        <span className="text-sm">WebDev</span>
                      </button>
                      <button 
                        onClick={() => navigate('/leaderboard/vision')}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 rounded transition text-left w-full"
                      >
                        <Eye size={18}/>
                        <span className="text-sm">Vision</span>
                      </button>
                      <button 
                        onClick={() => navigate('/leaderboard/text-to-image')}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 rounded transition text-left w-full"
                      >
                        <Image size={18}/>
                        <span className="text-sm">Text-to-Image</span>
                      </button>
                      <button 
                        onClick={() => navigate('/leaderboard/image-edit')}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 rounded transition text-left w-full"
                      >
                        <WandSparkles size={18}/>
                        <span className="text-sm">Image Edit</span>
                      </button>
                      <button 
                        onClick={() => navigate('/leaderboard/search')}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 rounded transition text-left w-full"
                      >
                        <Globe size={18}/>
                        <span className="text-sm">Search</span>
                      </button>
                      <button 
                        onClick={() => navigate('/leaderboard/text-to-video')}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 rounded transition text-left w-full"
                      >
                        <Video size={18}/>
                        <span className="text-sm">Text-to-Video</span>
                      </button>
                      <button 
                        onClick={() => navigate('/leaderboard/image-to-video')}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 rounded transition text-left w-full"
                      >
                        <Video size={18}/>
                        <span className="text-sm">Image-to-Video</span>
                      </button>
                      <button 
                        onClick={() => navigate('/leaderboard/copilot')}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 rounded transition text-left w-full"
                      >
                        <CodeXml size={18}/>
                        <span className="text-sm">Copilot</span>
                      </button> */}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`flex-1 overflow-y-auto min-h-0 transition-opacity duration-200 ${isOpen ? "opacity-100 p-2" : "opacity-0"} ${isOpen ? "" : "pointer-events-none md:pointer-events-auto"}`}
        >
          {isOpen && (
            <>
              {pinnedSessions.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase px-2.5 mb-2 flex items-center gap-2">
                    <Pin size={12} /> Pinned
                  </h3>
                  {pinnedSessions.map((session) => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={sessionId === session.id}
                      onClick={() => handleSelectSession(session)}
                      onPin={handlePinSession}
                      onRename={handleRenameSession}
                    />
                  ))}
                </div>
              )}

              {groupedHistory.map((group) => (
                <div key={group.title} className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase px-2.5 mb-2">
                    {group.title}
                  </h3>
                  {group.sessions.map((session) => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={sessionId === session.id}
                      onClick={() => handleSelectSession(session)}
                      onPin={handlePinSession}
                      onRename={handleRenameSession}
                    />
                  ))}
                </div>
              ))}
            </>
          )}
        </div>

        <div className="border-t border-gray-200 p-2 flex-shrink-0">
          {isAnonymous ? (
            <SidebarItem
              icon={LogIn}
              text="Sign in to save"
              isOpen={isOpen}
              onClick={() => setShowAuthModal(true)}
            />
          ) : (
            <SidebarItem
              icon={LogOut}
              text="Logout"
              isOpen={isOpen}
              onClick={handleLogout}
            />
          )}

          <div
            className={`flex items-center p-1.5 sm:p-2 mt-1 rounded-lg ${isOpen ? "justify-start gap-2 sm:gap-3" : "justify-center"}`}
          >
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isAnonymous ? "bg-gray-200" : "bg-orange-500 text-white"}`}
            >
              <User size={16} className="sm:w-[18px] sm:h-[18px]" />
            </div>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-w-[150px] sm:max-w-[180px]" : "max-w-0"}`}
            >
              <p className="text-xs sm:text-sm font-semibold whitespace-nowrap truncate">
                {isAnonymous ? "Guest User" : user?.display_name || user?.email}
              </p>
            </div>
          </div>
        </div>
        <div className={`
            justify-between items-center pt-2 text-xs text-gray-500 border-t border-gray-200 py-2 px-2
            transition-opacity duration-200
            ${isOpen ? 'flex opacity-100' : 'hidden opacity-0'}
          `}>
          <a href="/#/terms" target="_blank" rel="noopener noreferrer" className="hover:text-gray-800 hover:underline transition-colors">Terms of Use</a>
          <span className="text-gray-300">|</span>
          <a href="/#/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-gray-800 hover:underline transition-colors">Privacy Policy</a>
          <span className="text-gray-300">|</span>
          <a href="https://ai4bharat.iitm.ac.in" target="_blank" rel="noopener noreferrer" className="hover:text-gray-800 hover:underline transition-colors">About Us</a>
        </div>
      </div>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} session_type="LLM" />
      <RenameSessionModal
        isOpen={renameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        onRename={onRename}
        currentTitle={sessionToRename?.title}
      />
    </>
  );
}
