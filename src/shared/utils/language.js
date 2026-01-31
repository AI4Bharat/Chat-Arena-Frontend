// language.js - Utility functions for language handling
// All the supported languages, we can add more later
export const LANGUAGES = [
    { value: 'en', label: 'English' }, { value: 'hi', label: 'Hindi' },
    { value: 'mr', label: 'Marathi' }, { value: 'ta', label: 'Tamil' },
    { value: 'te', label: 'Telugu' }, { value: 'kn', label: 'Kannada' },
    { value: 'gu', label: 'Gujarati' }, { value: 'pa', label: 'Punjabi' },
    { value: 'bn', label: 'Bengali' }, { value: 'ml', label: 'Malayalam' },
    { value: 'as', label: 'Assamese' }, { value: 'brx', label: 'Bodo' },
    { value: 'doi', label: 'Dogri' }, { value: 'ks', label: 'Kashmiri' },
    { value: 'mai', label: 'Maithili' }, { value: 'mni', label: 'Manipuri' },
    { value: 'ne', label: 'Nepali' }, { value: 'or', label: 'Odia' },
    { value: 'sd', label: 'Sindhi' }, { value: 'si', label: 'Sinhala' },
    { value: 'ur', label: 'Urdu' }, { value: 'sat', label: 'Santali' },
    { value: 'sa', label: 'Sanskrit' }, { value: 'gom', label: 'Goan Konkani' },
];

const LANGUAGE_MAP = LANGUAGES.reduce((acc, lang) => {
    acc[lang.value] = lang.label;
    return acc;
}, {});

export const getLanguageName = (code) => {
    if (!code) return 'Unknown';

    return LANGUAGE_MAP[code] || code;
};
