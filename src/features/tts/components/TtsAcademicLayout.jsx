import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { TtsLayout } from './TtsLayout';
import { setSelectedMode } from '../store/chatSlice';

/**
 * TTS Academic Benchmarking Layout
 * Automatically sets the TTS mode to 'academic' when this route is accessed
 * This provides a direct entry point for academic benchmarking users
 */
export function TtsAcademicLayout() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Set the mode to academic when this layout mounts
    dispatch(setSelectedMode('academic'));
  }, [dispatch]);

  return <TtsLayout />;
}
