/**
 * Web Worker for heavy card processing operations
 * Offloads expensive computations to background thread
 */

// Card processing functions
function processCardDiff(oldCard: any, newCard: any): any {
  // Simplified diff logic - can be expanded
  const changes: string[] = [];
  
  if (oldCard.cardTitle !== newCard.cardTitle) {
    changes.push('title');
  }
  
  if (oldCard.sections?.length !== newCard.sections?.length) {
    changes.push('sections');
  }
  
  return {
    hasChanges: changes.length > 0,
    changes
  };
}

function normalizeCardData(card: any): any {
  // Normalize card structure
  return {
    ...card,
    sections: card.sections?.map((section: any) => ({
      ...section,
      id: section.id || `${section.type}-${Date.now()}`
    })) || []
  };
}

// Worker message handler
self.addEventListener('message', (event: MessageEvent) => {
  const { type, payload } = event.data;
  
  try {
    let result: any;
    
    switch (type) {
      case 'PROCESS_CARD_DIFF':
        result = processCardDiff(payload.oldCard, payload.newCard);
        break;
        
      case 'NORMALIZE_CARD':
        result = normalizeCardData(payload.card);
        break;
        
      case 'BATCH_PROCESS':
        result = payload.cards.map((card: any) => normalizeCardData(card));
        break;
        
      default:
        throw new Error(`Unknown worker task: ${type}`);
    }
    
    self.postMessage({
      type: `${type}_RESULT`,
      payload: result,
      requestId: event.data.requestId
    });
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: event.data.requestId
    });
  }
});


