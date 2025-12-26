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
      return <span>{currentText}</span>;
    }

    // Initialize diff-match-patch
    const dmp = new DiffMatchPatch();

    // Determine which text is the current one
    const isText1 = currentText === text1;
    const otherText = isText1 ? text2 : text1;

    // Tokenizer: split into words and whitespace sequences
    const tokenizer = (text) => text.match(/\S+|\s+/g) || [];

    const words1 = tokenizer(currentText);
    const words2 = tokenizer(otherText);

    // Map unique words to unicode characters to enforce atomic diffs
    const wordToChar = new Map();
    const charToWord = [];
    let nextCharCode = 0;

    const encode = (words) => {
      let str = '';
      for (const word of words) {
        let charCode;
        if (wordToChar.has(word)) {
          charCode = wordToChar.get(word);
        } else {
          charCode = nextCharCode++;
          wordToChar.set(word, charCode);
          charToWord[charCode] = word;
        }
        // Use a safe range starting from unicode 2000 to avoid control chars/conflicts
        str += String.fromCharCode(charCode + 2000);
      }
      return str;
    };

    const chars1 = encode(words1);
    const chars2 = encode(words2);

    // Compute diffs on the encoded strings
    const diffs = dmp.diff_main(chars1, chars2);
    dmp.diff_cleanupSemantic(diffs);
    
    // Build the highlighted JSX
    const elements = [];
    let key = 0;

    diffs.forEach((diff) => {
      const [operation, encodedText] = diff;

      let decodedText = "";
      for (let i = 0; i < encodedText.length; i++) {
        const code = encodedText.charCodeAt(i) - 2000;
        decodedText += charToWord[code] || "";
      }

      // Tokenize again just to render safely (though decodedText is already sequence of tokens)
      // Actually decodedText is the exact original substrings joined.
      // We can split it by the same regex or just use the known structure potentially, 
      // but re-tokenizing is safest for rendering to ensure we catch the generic structure.
      // Better: we know decodedText is just a concatenation of the atoms.
      // But for the purpose of valid wrapping and atomic highlighting, we should split it.
      const parts = decodedText.match(/\S+|\s+/g) || [];

      parts.forEach((part) => {
        const isSpace = /^\s+$/.test(part);

        if (operation === 0) {
          // Equal
          elements.push(<span key={key++}>{part}</span>);
        } else if (operation === -1) {
          // Delete (exists in current, not in other) -> Highlight
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
        // operation === 1 (Insert) is ignored as we only show what's in 'currentText'
      });
    });

    return <>{elements}</>;
  }, [text1, text2, currentText]);

  return <div className="whitespace-pre-wrap break-words">{highlightedContent}</div>;
}
