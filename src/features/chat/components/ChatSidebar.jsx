import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSessions, setActiveSession, clearMessages, deleteSession } from '../store/chatSlice';
import { logout } from '../../auth/store/authSlice';
import {
  Plus,
  MessageSquare,
  LogOut,
  User,
  LogIn,
  Clock,
  Bot,
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
  Trash2
} from 'lucide-react';
import { AuthModal } from '../../auth/components/AuthModal';
import { DeleteChatModal } from './DeleteChatModal';
import { useNavigate, useParams } from 'react-router-dom';
import { groupSessionsByDate } from '../utils/dateUtils';
import { SidebarItem } from './SidebarItem';

const SessionItem = ({ session, isActive, onClick, onDelete }) => (
  <div className="group relative w-full">
    <button
      onClick={onClick}
      className={`w-full text-left p-2 sm:p-2.5 rounded-lg mb-1 transition-colors flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium truncate ${isActive
        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
    >
      <MessageSquare className="flex-shrink-0" size={14} />
      <span className="flex-1 truncate">
        {session.title || 'New Conversation'}
      </span>
    </button>
    {/* Delete button appears on hover */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        onDelete(session);
      }}
      className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
      title="Delete chat"
    >
      <Trash2 size={16} />
    </button>
  </div>
);


export function ChatSidebar({ isOpen, onToggle }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { sessions } = useSelector((state) => state.chat);
  const { user, isAnonymous } = useSelector((state) => state.auth);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, session: null, isLoading: false });

  const groupedSessions = useMemo(() => groupSessionsByDate(sessions), [sessions]);

  useEffect(() => {
    dispatch(fetchSessions());
  }, [dispatch]);

  const handleNewChat = () => {
    dispatch(setActiveSession(null));
    dispatch(clearMessages());
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

  const handleDeleteClick = (session) => {
    setDeleteModal({ isOpen: true, session, isLoading: false });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.session) return;
    
    setDeleteModal(prev => ({ ...prev, isLoading: true }));
    
    try {
      await dispatch(deleteSession(deleteModal.session.id)).unwrap();
      setDeleteModal({ isOpen: false, session: null, isLoading: false });
      
      // If the deleted session is the active one, navigate back to chat
      if (sessionId === deleteModal.session.id) {
        navigate('/chat');
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleCancelDelete = () => {
    setDeleteModal({ isOpen: false, session: null, isLoading: false });
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
        className={
          `bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full transition-all duration-300
          fixed inset-y-0 left-0 z-40 w-64 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:z-auto md:transform-none ${isOpen ? 'md:w-64' : 'md:w-14'}`
        }
      >

        <div className="flex-shrink-0">
          <div className="flex items-center h-[65px] px-3 sm:px-4 border-b border-gray-200 dark:border-gray-700">
            {isOpen ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 overflow-hidden min-w-0">
                  <Bot className="text-orange-500 flex-shrink-0" size={20} />
                  <span className="font-bold text-base sm:text-lg whitespace-nowrap truncate dark:text-white">AI Arena</span>
                </div>
                <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0">
                  <PanelLeftClose size={18} className="dark:text-gray-300" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <button onClick={onToggle} className="relative group p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Bot size={20} className="text-orange-500 transition-transform duration-300 group-hover:scale-0" />
                  <PanelLeftOpen size={18} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-700 dark:text-gray-300 transition-transform duration-300 scale-0 group-hover:scale-100" />
                </button>
              </div>
            )}
          </div>

          <div className="p-2">
            <SidebarItem icon={Plus} text="New Chat" isOpen={isOpen} onClick={handleNewChat} bordered={isOpen} />
              <div className="relative group">
                <SidebarItem
                  icon={Trophy}
                  text="Leaderboard"
                  isOpen={isOpen}
                  onClick={handleLeaderboard}
                  arrow={true}
                />

                  <div className="
                    absolute top-0 left-full  ml-4 min-w-[210px] z-50
                    bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-lg rounded-lg py-1
                    invisible opacity-0 -translate-x-2
                    group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
                    transition-all duration-200 delay-300 border border-gray-200 dark:border-gray-700
                  ">
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => navigate('/leaderboard/overview')}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition text-left w-full"
                      >
                        <Grid2x2 size={18}/>
                        <span className="text-sm">Overview</span>
                      </button>
                      <button 
                        onClick={() => navigate('/leaderboard/text')}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition text-left w-full"
                      >
                        <ScrollText size={18}/>
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

        <div className={`flex-1 overflow-y-auto min-h-0 transition-opacity duration-200 ${isOpen ? 'opacity-100 p-2' : 'opacity-0'} ${isOpen ? '' : 'pointer-events-none md:pointer-events-auto'}`}>
          {isOpen && (
            groupedSessions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center mt-4 px-2">
                Your chat history will appear here.
              </p>
            ) : (
              groupedSessions.map((group) => (
                <div key={group.title} className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase px-2.5 mb-2">
                    {group.title}
                  </h3>
                  {group.sessions.map((session) => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={sessionId === session.id}
                      onClick={() => handleSelectSession(session)}
                      onDelete={handleDeleteClick}
                    />
                  ))}
                </div>
              ))
            )
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-2 flex-shrink-0">
          {isAnonymous ? (
            <SidebarItem icon={LogIn} text="Sign in to save" isOpen={isOpen} onClick={() => setShowAuthModal(true)} />
          ) : (
            <SidebarItem icon={LogOut} text="Logout" isOpen={isOpen} onClick={handleLogout} />
          )}

          <div className={`flex items-center justify-center p-1.5 sm:p-2 mt-1 rounded-lg cursor-pointer ${isOpen ? "gap-2 sm:gap-3" : ""}`}>
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isAnonymous ? 'bg-gray-200 dark:bg-gray-700' : 'bg-orange-500 text-white'}`}>
              <User size={16} className="sm:w-[18px] sm:h-[18px] dark:text-gray-300" />
            </div>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-w-[120px] sm:max-w-[150px]" : "max-w-0"}`}>
              <p className="text-xs sm:text-sm font-semibold whitespace-nowrap truncate dark:text-gray-200">
                {isAnonymous ? 'Guest User' : (user?.email || user?.username)}
              </p>
            </div>
          </div>
        </div>
      </div>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <DeleteChatModal
        isOpen={deleteModal.isOpen}
        chatTitle={deleteModal.session?.title}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={deleteModal.isLoading}
      />
    </>
  );
}