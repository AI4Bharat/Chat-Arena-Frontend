/**
 * Common languages supported by all TTS models
 * Pre-computed intersection of all models' supported languages
 */
export const COMMON_LANGUAGES = ["en", "hi", "mr", "ta", "te", "kn", "gu", "pa", "ml", "or"];

/**
 * Get intersection of supported languages from multiple models
 * @param {Array} models - Array of model objects with supported_languages
 * @returns {Array} - Array of common language codes
 */
export const getCommonLanguages = (models) => {
  if (!models || models.length === 0) return [];

  // Start with the first model's languages
  let common = models[0].supported_languages || [];

  // Find intersection with each subsequent model
  for (let i = 1; i < models.length; i++) {
    const modelLangs = models[i].supported_languages || [];
    common = common.filter(lang => modelLangs.includes(lang));
  }

  return common;
};

/**
 * Get available languages based on mode and selected models
 * @param {string} mode - Mode: 'direct', 'compare', 'random', 'academic'
 * @param {Array} models - All available models
 * @param {string} modelAId - Selected model A ID (for direct/compare mode)
 * @param {string} modelBId - Selected model B ID (for compare mode)
 * @returns {Array} - Array of available language codes
 */
export const getAvailableLanguages = (mode, models, modelAId, modelBId) => {
  if (!models || models.length === 0) return COMMON_LANGUAGES;

  switch (mode) {
    case 'direct': {
      // For direct mode, show languages supported by selected model
      if (!modelAId) return COMMON_LANGUAGES;
      const modelA = models.find(m => m.id === modelAId);
      return modelA?.supported_languages || COMMON_LANGUAGES;
    }

    case 'compare': {
      // For compare mode, show intersection of both models
      if (!modelAId || !modelBId) return COMMON_LANGUAGES;
      const modelA = models.find(m => m.id === modelAId);
      const modelB = models.find(m => m.id === modelBId);

      if (!modelA || !modelB) return COMMON_LANGUAGES;

      const common = getCommonLanguages([modelA, modelB]);

      // If no common languages, fallback to English if both support it
      if (common.length === 0) {
        const bothSupportEnglish =
          modelA.supported_languages?.includes('en') &&
          modelB.supported_languages?.includes('en');
        return bothSupportEnglish ? ['en'] : COMMON_LANGUAGES;
      }

      return common;
    }

    case 'random':{
      // For random mode, use pre-computed common languages
      return COMMON_LANGUAGES;
    }

    case 'academic': {
      return ["hi"];
    }

    default:
      return COMMON_LANGUAGES;
  }
};

/**
 * Check if a language is supported by the current selection
 * @param {string} languageCode - Language code to check
 * @param {Array} availableLanguages - Array of available language codes
 * @returns {boolean} - Whether the language is available
 */
export const isLanguageAvailable = (languageCode, availableLanguages) => {
  return availableLanguages && availableLanguages.includes(languageCode);
};

/**
 * Get the first available language from the available languages list
 * Prioritizes the current language if available, otherwise returns first available
 * @param {string} currentLanguage - Current selected language
 * @param {Array} availableLanguages - Array of available language codes
 * @returns {string} - Language code to use
 */
export const getValidLanguage = (currentLanguage, availableLanguages) => {
  if (!availableLanguages || availableLanguages.length === 0) {
    return currentLanguage || 'en';
  }

  // If current language is available, keep it
  if (availableLanguages.includes(currentLanguage)) {
    return currentLanguage;
  }

  // Otherwise, return first available language
  return availableLanguages[0];
};
