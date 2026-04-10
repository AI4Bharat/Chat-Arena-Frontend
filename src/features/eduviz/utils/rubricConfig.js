export const getRubricsForTaskType = (taskType) => {
    const commonRubrics = [
        { key: 'accuracy', label: 'Detection Accuracy' },
        { key: 'labeling', label: 'Labeling Correctness' },
        { key: 'completeness', label: 'Completeness' },
    ];

    switch (taskType) {
        case 'Handwriting OCR':
            return [
                ...commonRubrics,
                { key: 'transcription', label: 'Transcription Quality' },
                { key: 'illegible', label: 'Handling of Illegible Text' },
            ];
        case 'Math OCR':
            return [
                ...commonRubrics,
                { key: 'math_accuracy', label: 'Mathematical Logic' },
                { key: 'symbol_recognition', label: 'Symbol Recognition' },
            ];
        default:
            return commonRubrics;
    }
};
