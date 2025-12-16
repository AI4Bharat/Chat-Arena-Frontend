import { MessageItem } from './MessageItem';
import { useSelector } from 'react-redux';

export function ConversationTurn({ turn, modelAName, modelBName, feedbackSelection, hoverPreview, onExpand, onRegenerate, isLastTurn, session }) {
  const { userMessage, modelAMessage, modelBMessage } = turn;
  const isRegenerating = useSelector((state) => state.chat.isRegenerating);
  let feedbackA = null;
  let feedbackB = null;
  if (feedbackSelection) {
    if (feedbackSelection === 'model_a') {
      feedbackA = 'winner';
      feedbackB = 'loser';
    } else if (feedbackSelection === 'model_b') {
      feedbackA = 'loser';
      feedbackB = 'winner';
    } else if (feedbackSelection === 'tie') {
      feedbackA = 'winner';
      feedbackB = 'winner';
    } else if (feedbackSelection === 'both_bad') {
      feedbackA = 'loser';
      feedbackB = 'loser';
    }
  }

  let previewA = null;
  let previewB = null;
  if (hoverPreview) {
    if (hoverPreview === 'model_a') {
      previewA = 'winner';
      previewB = 'loser';
    } else if (hoverPreview === 'model_b') {
      previewA = 'loser';
      previewB = 'winner';
    } else if (hoverPreview === 'tie') {
      previewA = 'winner';
      previewB = 'winner';
    } else if (hoverPreview === 'both_bad') {
      previewA = 'loser';
      previewB = 'loser';
    }
  }

  const allowRegeneration = isLastTurn && !turn.userMessage.feedback && modelAMessage && modelBMessage && !modelAMessage.isStreaming && !modelBMessage.isStreaming && !isRegenerating;

  return (
    <div className="space-y-4">
      {userMessage && <MessageItem message={userMessage} />}
      
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch">
        
        <div className="flex-1 min-w-0">
          {modelAMessage ? (
            <MessageItem 
              message={modelAMessage} 
              onExpand={onExpand} 
              onRegenerate={onRegenerate} 
              viewMode="compare" 
              modelName={modelAName} 
              feedbackState={feedbackA} 
              previewState={previewA} 
              canRegenerate={allowRegeneration}
              otherModelContent={modelBMessage?.content}
              session={session}
            />
          ) : (
            <div className="h-full rounded-lg border border-dashed bg-gray-100"></div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          {modelBMessage ? (
            <MessageItem 
              message={modelBMessage} 
              onExpand={onExpand} 
              onRegenerate={onRegenerate} 
              viewMode="compare" 
              modelName={modelBName} 
              feedbackState={feedbackB} 
              previewState={previewB} 
              canRegenerate={allowRegeneration}
              otherModelContent={modelAMessage?.content}
              session={session}
            />
          ) : (
            <div className="h-full rounded-lg border border-dashed bg-gray-100"></div>
          )}
        </div>
      </div>
    </div>
  );
}