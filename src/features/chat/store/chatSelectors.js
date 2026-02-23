// src/features/chat/store/chatSelectors.js
import { createSelector } from '@reduxjs/toolkit';

// ── Base selectors ────────────────────────────────────────────────────────────
const selectSessions     = (state) => state.chat.sessions;
const selectSearchQuery  = (state) => state.chat.searchQuery;

// ── selectFilteredSessions ────────────────────────────────────────────────────
// • query.length < 2  → returns full sessions array (no filter overhead)
// • query.length >= 2 → case-insensitive substring match on session.title
// Uses createSelector so the filtered array is only recomputed when
// sessions or searchQuery actually change.
export const selectFilteredSessions = createSelector(
  [selectSessions, selectSearchQuery],
  (sessions, query) => {
    if (!query || query.trim().length < 2) {
      return sessions; // reference-stable pass-through
    }
    const lower = query.trim().toLowerCase();
    return sessions.filter((s) =>
      (s.title || '').toLowerCase().includes(lower)
    );
  }
);

export { selectSearchQuery };
