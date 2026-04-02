import { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PromptSidebar({ messages }) {
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const userMessages = messages.filter(m => m.role === 'user');
  const popoverRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (userMessages.length === 0) return;

    // Use IntersectionObserver to track which prompt is currently closest to the top
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter(e => e.isIntersecting);
        if (visibleEntries.length > 0) {
          const topEntry = visibleEntries.reduce((prev, current) => {
            return (prev.boundingClientRect.top < current.boundingClientRect.top) ? prev : current;
          });
          const id = topEntry.target.id.replace('message-', '');
          setActiveMessageId(id);
        }
      },
      {
        root: null, 
        rootMargin: '-5% 0px -75% 0px', 
        threshold: 0,
      }
    );

    userMessages.forEach(msg => {
      const el = document.getElementById(`message-${msg.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [userMessages]);

  const handleSelectMessage = (id) => {
    const el = document.getElementById(`message-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveMessageId(id);
      setIsOpen(false);
    }
  };

  if (userMessages.length === 0) return null;

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden xl:flex flex-row-reverse items-center gap-4" ref={popoverRef}>
      
      {/* The Dynamic Lines Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="flex flex-col gap-2.5 items-end py-4 px-2 bg-transparent focus:outline-none shrink-0 hover:opacity-100 transition-opacity"
        title="Prompt History"
      >
        {userMessages.map(msg => {
          const isActive = activeMessageId === msg.id;
          return (
            <motion.div
              key={msg.id}
              initial={false}
              animate={{
                width: isActive ? 24 : (isHovered ? 20 : 16),
                backgroundColor: isActive ? '#000000' : (isHovered ? '#9CA3AF' : '#D1D5DB')
              }}
              className="h-[3px] rounded-full"
              transition={{ type: "spring", stiffness: 450, damping: 30 }}
            />
          );
        })}
      </button>

      {/* The Hovering Prompt History Menu component to the left */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="popover"
            initial={{ opacity: 0, scale: 0.95, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: 10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="w-80 bg-white border border-gray-200 shadow-xl rounded-xl max-h-[65vh] flex flex-col overflow-hidden origin-right"
          >
            <div className="overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 scrollbar-track-transparent space-y-0.5">
              {userMessages.map(msg => {
                const isActive = activeMessageId === msg.id;
                return (
                  <button
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg.id)}
                    className={`w-full text-left px-3 py-2.5 text-sm transition-colors duration-200 flex items-center gap-2 rounded-lg
                      ${isActive ? 'bg-orange-50/80 shadow-sm border border-orange-100' : 'hover:bg-gray-50 border border-transparent'}`}
                    title={msg.content}
                  >
                    <div className="w-5 shrink-0 flex justify-center">
                      {isActive && <Check size={16} className="text-orange-500 stroke-[3]" />}
                    </div>
                    <span className={`truncate w-full text-[13px] ${isActive ? 'text-orange-800 font-medium' : 'text-gray-600'}`}>
                      {msg.content}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
