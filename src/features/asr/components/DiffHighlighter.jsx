import { useMemo } from 'react';
import DiffMatchPatch from 'diff-match-patch';

/**
 * DiffHighlighter component
 * Compares two texts and highlights word-level differences with light orange background
 * Used for ASR model comparison to show transcription differences
 */
export function DiffHighlighter({ text1, text2, currentText }) {
  const highlightedContent = useMemo(() => {
    if (!text1 || !text2) {
      console.log('DiffHighlighter: Missing text', { text1, text2, currentText });
      return <span>{currentText}</span>;
    }

    console.log('DiffHighlighter: Comparing texts', { 
      text1: text1.substring(0, 50), 
      text2: text2.substring(0, 50), 
      currentText: currentText.substring(0, 50) 
    });

    // Initialize diff-match-patch
    const dmp = new DiffMatchPatch();
    
    // Determine which text is the current one
    const isText1 = currentText === text1;
    const otherText = isText1 ? text2 : text1;
    
    // Split texts into words (including punctuation as part of words)
    const currentWords = currentText.match(/\S+|\s+/g) || [];
    const otherWords = otherText.match(/\S+|\s+/g) || [];
    
    // Join with special delimiter for word-level diff
    const currentWordStr = currentWords.join('\n');
    const otherWordStr = otherWords.join('\n');
    
    // Compute diffs at word level
    const diffs = dmp.diff_main(currentWordStr, otherWordStr);
    dmp.diff_cleanupSemantic(diffs);
    
    console.log('DiffHighlighter: Diffs computed', diffs.length);
    
    // Build the highlighted JSX
    const elements = [];
    let key = 0;
    
    diffs.forEach((diff) => {
      const [operation, text] = diff;
      
      // Split back into words/spaces
      const parts = text.split('\n');
      
      parts.forEach((part, idx) => {
        if (!part) return; // Skip empty strings
        
        const isSpace = /^\s+$/.test(part);
        
        // operation: -1 = delete (in current but not in other), 0 = equal, 1 = insert (in other but not in current)
        if (operation === 0) {
          // Text is the same in both - no highlighting
          elements.push(<span key={key++}>{part}</span>);
        } else if (operation === -1) {
          // Text exists in current but not in other - highlight entire word
          if (!isSpace) {
            elements.push(
              <span 
                key={key++} 
                className="bg-orange-100 text-gray-900 px-0.5 rounded"
                style={{ backgroundColor: '#FFF200' }}
              >
                {part}
              </span>
            );
          } else {
            elements.push(<span key={key++}>{part}</span>);
          }
        }
        // operation === 1 means text is in other but not in current, so we skip it (don't render)
      });
    });
    
    return <>{elements}</>;
  }, [text1, text2, currentText]);
  
  return <div className="whitespace-pre-wrap break-words">{highlightedContent}</div>;
}
