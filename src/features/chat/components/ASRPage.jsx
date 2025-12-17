import { useState } from 'react';
import { ServiceNavigationTile } from './ServiceNavigationTile';

export function ASRPage() {
    const [isInputActive, setIsInputActive] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-3xl w-full">
                {/* Service Navigation Tile */}
                <ServiceNavigationTile isInputActive={isInputActive} />

                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
                        Voice{' '}
                        <span className="bg-gradient-to-r from-orange-500 via-slate-300 to-green-600 bg-clip-text text-transparent">
                            Transcription
                        </span>
                    </h1>
                    <p className="text-lg text-slate-600">
                        Automatic Speech Recognition for Indian Languages
                    </p>
                </div>

                {/* ASR Interface Placeholder */}
                <div className="bg-white rounded-2xl shadow-sm border-2 border-orange-500 p-8">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-green-600 mb-6">
                            <svg
                                className="w-10 h-10 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-semibold text-slate-800 mb-3">
                            ASR Service Coming Soon
                        </h2>
                        <p className="text-slate-600 mb-6">
                            We're working on bringing you the best automatic speech recognition
                            experience for Indian languages.
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
                            <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span>Check back soon for updates</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
