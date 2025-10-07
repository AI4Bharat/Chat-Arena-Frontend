// API endpoint constants
export const endpoints = {
    // Auth endpoints
    auth: {
      google: '/auth/google/',
      anonymous: '/auth/anonymous/',
      refresh: '/auth/refresh/',
      currentUser: '/users/me/',
      updatePreferences: '/users/update_preferences/',
      deleteAccount: '/users/delete_account/',
    },
    
    // Model endpoints
    models: {
      list: '/models/',
      test: (id) => `/models/${id}/test/`,
      compare: '/models/compare/',
      leaderboard: '/leaderboard/',
    },
    
    // Session endpoints
    sessions: {
      create: '/sessions/',
      list: '/sessions/',
      detail: (id) => `/sessions/${id}/`,
      share: (id) => `/sessions/${id}/share/`,
      export: (id) => `/sessions/${id}/export/`,
      shared: (token) => `/shared/${token}/`,
    },
    
    // Message endpoints
    messages: {
      stream: '/messages/stream/',
      tree: (id) => `/messages/${id}/tree/`,
      branch: (id) => `/messages/${id}/branch/`,
      regenerate: (id) => `/messages/${id}/regenerate/`,
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