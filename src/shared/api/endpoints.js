// API endpoint constants
export const endpoints = {
    // Auth endpoints
    auth: {
      google: '/auth/google/',
      phone: '/auth/phone/',
      anonymous: '/auth/anonymous/',
      refresh: '/auth/refresh/',
      currentUser: '/users/me/',
      updatePreferences: '/users/update_preferences/',
      deleteAccount: '/users/delete_account/',
      stats: '/users/stats/',
    },
    
    // Model endpoints
    models: {
      list: '/models/',
      list_llm: '/models/type/?model_type=LLM',
      list_asr: '/models/type/?model_type=ASR',
      list_tts: '/models/type/?model_type=TTS',
      list_ocr: '/models/type/?model_type=OCR',
      test: (id) => `/models/${id}/test/`,
      compare: '/models/compare/',
      leaderboard: (arena_type, org = 'ai4b', language) => {
        let url = `/leaderboard/${arena_type}/?org=${org}`;
        if (language) {
          url += `&language=${language}`;
        }
        return url;
      },
      contributors: '/leaderboard/contributors/',
    },
    
    // Session endpoints
    sessions: {
      create: '/sessions/',
      list: '/sessions/',
      list_llm: '/sessions/type/?session_type=LLM',
      list_asr: '/sessions/type/?session_type=ASR',
      list_tts: '/sessions/type/?session_type=TTS',
      list_ocr: '/sessions/type/?session_type=OCR',
      list_eduviz: '/sessions/type/?session_type=EDUVIZ',
      detail: (id) => `/sessions/${id}/`,
      share: (id) => `/sessions/${id}/share/`,
      export: (id) => `/sessions/${id}/export/`,
      shared: (token) => `/shared/${token}/`,
    },
    
    // Message endpoints
    messages: {
      stream: '/messages/stream/',
      upload_audio: '/messages/upload_audio/',
      upload_image: '/messages/upload_image/',
      upload_ocr_image: '/messages/upload_ocr_image/',
      tree: (id) => `/messages/${id}/tree/`,
      branch: (id) => `/messages/${id}/branch/`,
      regenerate: (id) => `/messages/${id}/regenerate/`,
      saveAnnotations: (id) => `/messages/${id}/save_annotations/`,
      submitAssessment: (id) => `/messages/${id}/submit_assessment/`,
      extractRegionText: (id) => `/messages/${id}/extract_region_text/`,
    },
    
    // Feedback endpoints
    feedback: {
      submit: '/feedback/',
      sessionSummary: (sessionId) => `/feedback/session_summary/?session_id=${sessionId}`,
      modelComparison: (modelA, modelB) => `/feedback/model_comparison/?model_a=${modelA}&model_b=${modelB}`,
    },
    
    // Metrics endpoints
    metrics: {
      leaderboard: '/leaderboard/',
      categories: '/leaderboard/categories/',
      modelPerformance: (id) => `/models/${id}/performance/`,
      compare: (modelA, modelB) => `/compare/?model_a=${modelA}&model_b=${modelB}`,
    },
  };
