import { ChevronRight } from "lucide-react";

export function SidebarItem({ icon: Icon, text, active, isOpen, onClick, bordered = false, arrow }) {
    return (
      <button
        onClick={onClick}
        className={`
          relative flex items-center w-full h-11
          font-medium rounded-xl cursor-pointer
          transition-all duration-200 group my-1.5
          ${isOpen ? 'px-3.5' : 'justify-center'}
          ${active
            ? 'bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-900/20 text-orange-700 dark:text-orange-300 shadow-sm'
            : bordered
            ? 'border-2 border-orange-400/60 dark:border-orange-600/60 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-500/80 dark:hover:border-orange-500/80 shadow-sm hover:shadow-md'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-800 dark:hover:text-gray-200'
          }
        `}
      >
        <Icon size={20} className={active ? 'text-orange-600 dark:text-orange-400' : ''} />
        <span className={`overflow-hidden transition-all text-start text-[15px] ${isOpen ? "w-40 ml-3" : "w-0"}`}>
          {text}
        </span>
  
        {!isOpen && (
          <div className={`
            absolute left-full rounded-xl px-3 py-2 ml-6 z-50
            bg-gray-800 dark:bg-gray-700 text-white text-sm shadow-lg
            invisible opacity-0 -translate-x-3 transition-all
            group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
          `}>
            {text}
          </div>
        )}

         {arrow && isOpen && (
            <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100">
              <ChevronRight size={18}/>
            </span>
          )}

      </button>
    );
  }