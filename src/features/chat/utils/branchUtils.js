/**
 * Utility functions for chat branching
 */

/**
 * Build a map of parent message ID to its children
 * @param {Array} messages - All messages in the session
 * @returns {Map} parentId -> [children]
 */
export function buildChildrenMap(messages) {
  const childrenMap = new Map();
  
  // Initialize with null key for root messages (no parent)
  childrenMap.set(null, []);
  
  messages.forEach(message => {
    const parentIds = message.parent_message_ids || [];
    
    if (parentIds.length === 0) {
      // Root message
      childrenMap.get(null).push(message);
    } else {
      // For each parent, add this message as a child
      parentIds.forEach(parentId => {
        if (!childrenMap.has(parentId)) {
          childrenMap.set(parentId, []);
        }
        childrenMap.get(parentId).push(message);
      });
    }
  });
  
  return childrenMap;
}

/**
 * Get the currently visible branch path based on branch selections
 * @param {Array} messages - All messages in the session
 * @param {Object} branchSelections - Current branch selections { parentId: selectedChildId }
 * @returns {Array} Messages to display in order
 */
export function getVisibleBranchPath(messages, branchSelections = {}) {
  if (!messages || messages.length === 0) {
    return [];
  }
  
  const childrenMap = buildChildrenMap(messages);
  const messagesById = new Map(messages.map(m => [m.id, m]));
  const result = [];
  const visited = new Set();
  
  // Start from root messages (no parent)
  const rootMessages = childrenMap.get(null) || [];
  
  // Sort by position for consistent ordering
  const sortByPosition = (a, b) => (a.position || 0) - (b.position || 0);
  
  function traverse(currentMessages) {
    if (!currentMessages || currentMessages.length === 0) return;
    
    // Sort siblings by position
    const sorted = [...currentMessages].sort(sortByPosition);
    
    // Determine which sibling to show
    let selectedMessage = sorted[0]; // Default to first
    
    // Check if we have a branch selection for this group
    if (sorted.length > 1) {
      // Find the parent ID for this group (use 'root' for messages without parent)
      const firstParentId = sorted[0].parent_message_ids?.[0] || 'root';
      
      if (branchSelections[firstParentId]) {
        const selectedId = branchSelections[firstParentId];
        const found = sorted.find(m => m.id === selectedId);
        if (found) {
          selectedMessage = found;
        }
      }
    }
    
    // Avoid cycles
    if (visited.has(selectedMessage.id)) return;
    visited.add(selectedMessage.id);
    
    // Add to result (use 'root' for messages without parent)
    result.push({
      ...selectedMessage,
      _siblings: sorted,
      _siblingIndex: sorted.indexOf(selectedMessage),
      _parentId: selectedMessage.parent_message_ids?.[0] || 'root'
    });
    
    // Continue with children of selected message
    const children = childrenMap.get(selectedMessage.id) || [];
    if (children.length > 0) {
      traverse(children);
    }
  }
  
  traverse(rootMessages);
  
  return result;
}

/**
 * Find sibling messages (messages with the same parent)
 * @param {Array} messages - All messages
 * @param {Object} message - Current message
 * @returns {Array} Sibling messages including current
 */
export function getSiblings(messages, message) {
  const parentId = message.parent_message_ids?.[0];
  
  return messages.filter(m => {
    const mParentId = m.parent_message_ids?.[0];
    // Same parent (or both root if no parent)
    return mParentId === parentId && m.role === message.role;
  }).sort((a, b) => (a.position || 0) - (b.position || 0));
}
