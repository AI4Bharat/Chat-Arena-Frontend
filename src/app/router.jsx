import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ChatLayout } from '../features/chat/components/ChatLayout';
import { SharedSessionView } from '../features/chat/components/SharedSessionView';
import { PrivacyPolicyPage, TermsOfServicePage } from '../features/legal/components';
import { AsrLayout } from '../features/asr/components/AsrLayout';
import { TtsLayout } from '../features/tts/components/TtsLayout';
import { TtsAcademicLayout } from '../features/tts/components/TtsAcademicLayout';
import { useTenant } from '../shared/context/TenantContext';

// Wrapper that extracts tenant from URL and sets context
function TenantRoute({ children }) {
  const { tenant } = useParams();
  const { setTenant } = useTenant();

  useEffect(() => {
    if (tenant) {
      setTenant(tenant);
    }
    return () => setTenant(null); // Clear on unmount
  }, [tenant, setTenant]);

  return children;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/chat" element={<ChatLayout />} />
      <Route path="/chat/:sessionId" element={<ChatLayout />} />
      <Route path="/leaderboard/chat" element={<ChatLayout />} />
      <Route path="/leaderboard/chat/:category" element={<ChatLayout />} />
      <Route path="/asr" element={<AsrLayout />} />
      <Route path="/asr/:sessionId" element={<AsrLayout />} />
      <Route path="/leaderboard/asr" element={<AsrLayout />} />
      <Route path="/leaderboard/asr/:category" element={<AsrLayout />} />
      <Route path="/tts" element={<TtsLayout />} />
      <Route path="/tts/academic" element={<TtsAcademicLayout />} />
      <Route path="/tts/:sessionId" element={<TtsLayout />} />
      <Route path="/leaderboard/tts" element={<TtsLayout />} />
      <Route path="/leaderboard/tts/:category" element={<TtsLayout />} />
      <Route path="/shared/:shareToken" element={<SharedSessionView />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />
      <Route path="/" element={<Navigate to="/chat" />} />
      <Route
        path="/:tenant/chat"
        element={
          <TenantRoute>
            <ChatLayout />
          </TenantRoute>
        }
      />
      <Route
        path="/:tenant/chat/:sessionId"
        element={
          <TenantRoute>
            <ChatLayout />
          </TenantRoute>
        }
      />
      <Route
        path="/:tenant/asr"
        element={
          <TenantRoute>
            <AsrLayout />
          </TenantRoute>
        }
      />
      <Route
        path="/:tenant/asr/:sessionId"
        element={
          <TenantRoute>
            <AsrLayout />
          </TenantRoute>
        }
      />
      <Route
        path="/:tenant/tts"
        element={
          <TenantRoute>
            <TtsLayout />
          </TenantRoute>
        }
      />
      <Route
        path="/:tenant/tts/academic"
        element={
          <TenantRoute>
            <TtsAcademicLayout />
          </TenantRoute>
        }
      />
      <Route
        path="/:tenant/tts/:sessionId"
        element={
          <TenantRoute>
            <TtsLayout />
          </TenantRoute>
        }
      />
      <Route
        path="/:tenant/leaderboard/chat"
        element={
          <TenantRoute>
            <ChatLayout />
          </TenantRoute>
        }
      />
      <Route
        path="/:tenant/leaderboard/chat/:category"
        element={
          <TenantRoute>
            <ChatLayout />
          </TenantRoute>
        }
      />
      <Route
        path="/:tenant/leaderboard/asr"
        element={
          <TenantRoute>
            <AsrLayout />
          </TenantRoute>
        }
      />
      <Route
        path="/:tenant/leaderboard/asr/:category"
        element={
          <TenantRoute>
            <AsrLayout />
          </TenantRoute>
        }
      />
      <Route
        path="/:tenant/leaderboard/tts"
        element={
          <TenantRoute>
            <TtsLayout />
          </TenantRoute>
        }
      />
      <Route
        path="/:tenant/leaderboard/tts/:category"
        element={
          <TenantRoute>
            <TtsLayout />
          </TenantRoute>
        }
      />
      <Route
        path="/:tenant/shared/:shareToken"
        element={
          <TenantRoute>
            <SharedSessionView />
          </TenantRoute>
        }
      />
    </Routes>
  );
}
