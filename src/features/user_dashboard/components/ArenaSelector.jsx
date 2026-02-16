import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, LayoutDashboard, Grid3x3, MessageSquare, Mic, Volume2 } from 'lucide-react';
import { cn } from '../../../shared/utils';

export const ARENA_OPTIONS = [
    { id: '', label: 'All Arenas', title: 'User Dashboard', icon: Grid3x3 },
    { id: 'LLM', label: 'LLM Arena', title: 'LLM Dashboard', icon: MessageSquare },
    { id: 'ASR', label: 'ASR Arena', title: 'ASR Dashboard', icon: Mic },
    { id: 'TTS', label: 'TTS Arena', title: 'TTS Dashboard', icon: Volume2 },
];

export function ArenaSelector({ selectedArena, onSelectArena }) {
    const [isHovered, setIsHovered] = useState(false);
    const [isClickedOpen, setIsClickedOpen] = useState(false);
    const dropdownRef = useRef(null);
    const closeTimeoutRef = useRef(null);

    const shouldShowDropdown = isHovered || isClickedOpen;
    const selectedOption = ARENA_OPTIONS.find(opt => opt.id === selectedArena) || ARENA_OPTIONS[0];

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsClickedOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleMouseEnter = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        closeTimeoutRef.current = setTimeout(() => {
            setIsHovered(false);
        }, 200);
    };

    const handleSelection = (id) => {
        onSelectArena(id);
        setIsClickedOpen(false);
        setIsHovered(false);
    };

    return (
        <div
            className="relative"
            ref={dropdownRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Dashboard Title & Dropdown Trigger */}
            <button
                onClick={() => setIsClickedOpen(!isClickedOpen)}
                className={cn(
                    "flex items-center gap-2 text-base font-medium text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors",
                    shouldShowDropdown && "bg-gray-100"
                )}
                aria-label="Filter dashboard arena"
            >
                <LayoutDashboard size={20} className="text-orange-500" />
                <span>{selectedOption.title}</span>
                <ChevronDown
                    size={16}
                    className={cn(
                        "text-gray-500 transition-transform duration-200",
                        shouldShowDropdown && "rotate-180"
                    )}
                />
            </button>

            {/* Dropdown Menu */}
            {shouldShowDropdown && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-max min-w-[140px] bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                    {ARENA_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const isSelected = selectedArena === option.id;
                        return (
                            <button
                                key={option.id}
                                onClick={() => handleSelection(option.id)}
                                className={cn(
                                    "w-full px-4 py-2.5 text-sm transition-colors flex items-center justify-center gap-2",
                                    isSelected ? "bg-orange-50 text-orange-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                                )}
                            >
                                <Icon size={16} className={isSelected ? "text-orange-500" : "text-gray-500"} />
                                <span>{option.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
