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
  Clock,
  BotMessageSquare,
  PanelLeftOpen,
  PanelLeftClose,
  Trophy,
  Grid2x2,
  ScrollText,
  AppWindow,
  Eye,
  Image,
  WandSparkles,
  Globe,
  Video,
  CodeXml,
  Shuffle,
  MoreHorizontal,
  Pin,
  Trash2,
  Edit2,
  Share2,
  FileText,
  FileJson,
  Download,
  ChevronRight,
} from 'lucide-react';
import { AuthModal } from '../../auth/components/AuthModal';
import { useNavigate, useParams } from 'react-router-dom';
import { groupSessionsByDate } from '../utils/dateUtils';
import { SidebarItem } from './SidebarItem';
import { ProviderIcons } from '../../../shared/icons';

import { RenameSessionModal } from "./RenameSessionModal";
import ChatPdfExporter from "./ChatPdfExporter";
import { apiClient } from "../../../shared/api/client";



const SessionItem = ({ session, isActive, onClick, onPin, onRename }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
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
      link.download = `chat_export_${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setShowMenu(false);

    } catch (error) {
      console.error("Error exporting JSON:", error);
      alert("Failed to export chat as JSON. Please try again.");
    }
  };

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
      // Show icon based on first word of model_a_name
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

    // Default fallback
    return <MessageSquare className="flex-shrink-0" size={16} />;
  };

  return (
    <div
      className={`
      group relative flex items-center mb-1 rounded-lg transition-colors
      ${isActive ? "bg-orange-100 text-orange-800" : "text-gray-700 hover:bg-gray-100"}
    `}
    >
      <button
        onClick={onClick}
        className={`
          relative w-full text-left p-2 sm:p-2.5 rounded-lg transition-all duration-200
          flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium truncate
          pr-2 group-hover:pr-9 
          ${isActive ? 'text-orange-800' : 'text-gray-700'}
        `}
      >
        <div className="flex-shrink-0 flex items-center justify-center" style={{ width: '28px' }}>
          {renderModeIcon()}
        </div>

        <span className="flex-1 truncate min-w-0">
          {session.title || 'New Conversation'}
        </span>

        {session.is_pinned && (
          <Pin
            size={12}
            className="transform rotate-45 flex-shrink-0 text-gray-500"
            fill="currentColor"
          />
        )}
      </button>
      <div
        className={`
          absolute right-1 top-1/2 -translate-y-1/2 z-10
          opacity-0 group-hover:opacity-100 transition-opacity duration-200
          ${showMenu ? 'opacity-100' : ''} 
        `}
        ref={menuRef}
      >
        <button
          onClick={handleMenuClick}
          className={`
            p-1 rounded-md hover:bg-gray-200/50 
            ${isActive ? 'text-orange-800' : 'text-gray-500'}
          `}
        >
          <MoreHorizontal size={16} />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-8 z-50 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 text-gray-700 animate-in fade-in zoom-in-95 duration-100 origin-top-right">

            {/* <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
              <Share2 size={14} /> Share
            </button> */}

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
              onClick={(e) => {
                e.stopPropagation();
                onRename(session);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <Edit2 size={14} /> Rename
            </button>

            <div className="relative group/export w-full">
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between gap-2 text-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2">
                  <Download size={14} />
                  <span>Export</span>
                </div>
                <ChevronRight size={12} className="text-gray-400" />
              </button>

              <div className="absolute left-full top-0 ml-1 w-40 bg-white rounded-lg shadow-xl border border-gray-100 py-1 hidden group-hover/export:block z-50">

                <ChatPdfExporter
                  sessionId={session.id}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <FileText size={14} className="text-red-500" />
                  <span>PDF</span>
                </ChatPdfExporter>

                <button
                  onClick={handleJsonExport}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <FileJson size={14} className="text-yellow-600" />
                  <span>JSON</span>
                </button>
              </div>
            </div>

            {/* <div className="h-px bg-gray-100 my-1"></div>
            
            <button 
              className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
            >
              <Trash2 size={14} /> Delete
            </button> */}
          </div>
        )}
      </div>
    </div>
  );
};

export function ChatSidebar({ isOpen, onToggle }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { sessions } = useSelector((state) => state.chat);
  const { user, isAnonymous } = useSelector((state) => state.auth);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [isLeaderboardDropdownOpen, setIsLeaderboardDropdownOpen] =
    useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [sessionToRename, setSessionToRename] = useState(null);

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

  useEffect(() => {
    dispatch(fetchSessions());
  }, [dispatch]);

  const handleNewChat = () => {
    dispatch(setActiveSession(null));
    dispatch(clearMessages());
    dispatch(resetLanguageSettings());
    navigate('/chat');
    // Auto-close sidebar on small screens after starting a new chat
    if (typeof window !== 'undefined' && window.innerWidth < 768 && onToggle) {
      onToggle();
    }
  };

  const handleLeaderboard = () => {
    navigate('/leaderboard/overview');
    // Auto-close sidebar on small screens after navigation
    if (typeof window !== 'undefined' && window.innerWidth < 768 && onToggle) {
      onToggle();
    }
  };


  const handleSelectSession = (session) => {
    navigate(`/chat/${session.id}`);
    // Auto-close sidebar on small screens after selecting a session
    if (typeof window !== 'undefined' && window.innerWidth < 768 && onToggle) {
      onToggle();
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
        className={`bg-white border-r border-gray-200 flex flex-col h-full transition-all duration-300
          fixed inset-y-0 left-0 z-40 w-64 transform ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:z-auto md:transform-none ${isOpen ? "md:w-64" : "md:w-14"}`}
      >

        <div className="flex-shrink-0">
          <div className="flex items-center h-[65px] px-3 sm:px-4 border-b border-gray-200">
            {isOpen ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 overflow-hidden min-w-0">
                  <BotMessageSquare
                    className="text-orange-500 flex-shrink-0"
                    size={20}
                  />
                  <span className="font-bold text-base sm:text-lg whitespace-nowrap truncate">
                    Indic LLM Arena
                  </span>
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
            <SidebarItem
              icon={Plus}
              text="New Chat"
              isOpen={isOpen}
              onClick={handleNewChat}
              bordered={true}
            />
            <div
              className="relative group"
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
                      navigate('/leaderboard/overview');
                      setIsLeaderboardDropdownOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 rounded transition text-left w-full"
                  >
                    <Grid2x2 size={18} />
                    <span className="text-sm">Overview</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/leaderboard/text');
                      setIsLeaderboardDropdownOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 rounded transition text-left w-full"
                  >
                    <ScrollText size={18} />
                    <span className="text-sm">Text</span>
                  </button>
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

              {groupedHistory.length === 0 && pinnedSessions.length === 0 ? (
                <></>
              ) : (
                groupedHistory.map((group) => (
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
                ))
              )}
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
        <div
          className={`
            justify-between items-center pt-2 text-xs text-gray-500 border-t border-gray-200 py-2 px-2
            transition-opacity duration-200
            ${isOpen ? "flex opacity-100" : "hidden opacity-0"}
          `}
        >
          <a
            href="/#/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-800 hover:underline transition-colors"
          >
            Terms of Use
          </a>
          <span className="text-gray-300">|</span>
          <a
            href="/#/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-800 hover:underline transition-colors"
          >
            Privacy Policy
          </a>
          <span className="text-gray-300">|</span>
          <a
            href="https://ai4bharat.iitm.ac.in"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-800 hover:underline transition-colors"
          >
            About Us
          </a>
        </div>
      </div>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      <RenameSessionModal
        isOpen={renameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        onRename={onRename}
        currentTitle={sessionToRename?.title}
      />
    </>
  );
}
