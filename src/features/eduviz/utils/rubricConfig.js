export const TASK_TYPES = [
    'Elementary - Practise',
    'Elementary - Assessment',
    'Middle - Writing',
    'Middle - Drawing',
    'Middle - Graphing',
    'Middle - Math',
    'Middle - Formulae',
    'Middle - Assessment',
];

export const getRubricsForTaskType = (taskType) => {
    const commonRubrics = [
        { key: 'accuracy', label: 'Detection Accuracy' },
        { key: 'labeling', label: 'Labeling Correctness' },
        { key: 'completeness', label: 'Completeness' },
    ];

    switch (taskType) {
        case 'Elementary - Practise':
            return [
                { key: 'letter_formation', label: 'Letter Formation' },
                { key: 'alignment', label: 'Alignment' },
                { key: 'task_correctness', label: 'Task Correctness' },
            ];
        case 'Elementary - Assessment':
            return [
                { key: 'question_score', label: 'Question-wise Score' },
                { key: 'instruction_following', label: 'Instruction Following' },
            ];
        case 'Middle - Writing':
            return [
                { key: 'legibility', label: 'Legibility' },
                { key: 'spelling_accuracy', label: 'Spelling Accuracy' },
                { key: 'grammar_correctness', label: 'Grammar Correctness' },
                { key: 'content_correctness', label: 'Content Correctness' },
                { key: 'coherence', label: 'Coherence' },
            ];
        case 'Middle - Drawing':
        case 'Middle - Graphing':
            return [
                { key: 'label_correctness', label: 'Label Correctness' },
                { key: 'completeness', label: 'Completeness' },
                { key: 'conceptual_correctness', label: 'Conceptual Correctness' },
            ];
        case 'Middle - Math':
            return [
                { key: 'legibility', label: 'Legibility' },
                { key: 'final_answer', label: 'Final Answer Correctness' },
                { key: 'step_correctness', label: 'Step Correctness' },
                { key: 'method_correctness', label: 'Method Correctness' },
            ];
        case 'Middle - Formulae':
            return [
                { key: 'symbol_accuracy', label: 'Symbol Accuracy' },
                { key: 'structural_correctness', label: 'Structural Correctness' },
                { key: 'completeness', label: 'Completeness' },
            ];
        case 'Middle - Assessment':
            return [
                { key: 'question_score', label: 'Question-wise Score' },
                { key: 'concept_mastery', label: 'Concept Mastery' },
            ];
        // Legacy types for backward compatibility
        case 'Handwriting OCR':
            return [
                { key: 'accuracy', label: 'Detection Accuracy' },
                { key: 'labeling', label: 'Labeling Correctness' },
                { key: 'completeness', label: 'Completeness' },
                { key: 'transcription', label: 'Transcription Quality' },
                { key: 'illegible', label: 'Handling of Illegible Text' },
            ];
        case 'Math OCR':
            return [
                { key: 'accuracy', label: 'Detection Accuracy' },
                { key: 'labeling', label: 'Labeling Correctness' },
                { key: 'completeness', label: 'Completeness' },
                { key: 'math_accuracy', label: 'Mathematical Logic' },
                { key: 'symbol_recognition', label: 'Symbol Recognition' },
            ];
        default:
            return [
                { key: 'accuracy', label: 'Detection Accuracy' },
                { key: 'labeling', label: 'Labeling Correctness' },
                { key: 'completeness', label: 'Completeness' },
            ];
    }
};
