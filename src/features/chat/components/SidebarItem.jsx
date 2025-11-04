import { ChevronRight } from "lucide-react";

export function SidebarItem({ icon: Icon, text, active, isOpen, onClick, bordered = false, arrow }) {
    return (
      <button
        onClick={onClick}
        className={`
          relative flex items-center w-full h-11
          font-medium rounded-lg cursor-pointer
          transition-colors group my-1 border
          ${isOpen ? 'px-4' : 'justify-center'}
          ${active
            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-700'
            : bordered
            ? 'border-2 border-orange-400 dark:border-orange-600 text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20'
            : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }
        `}
      >
        <Icon size={20} />
        <span className={`overflow-hidden transition-all text-start ${isOpen ? "w-40 ml-3" : "w-0"}`}>
          {text}
        </span>
  
        {!isOpen && (
          <div className={`
            absolute left-full rounded-md px-2 py-1 ml-6
            bg-gray-800 dark:bg-gray-700 text-white text-sm
            invisible opacity-20 -translate-x-3 transition-all
            group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
          `}>
            {text}
          </div>
        )}

         {arrow && isOpen && (
            <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-50 delay-100">
              <ChevronRight size={20}/>
            </span>
          )}

      </button>
    );
  }