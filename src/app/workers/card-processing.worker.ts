/// <reference lib="webworker" />

import { AICardConfig, CardField } from '../models/card.model';

export interface WorkerMessage {
  id: string;
  type: 'PROCESS_CARDS' | 'VALIDATE_CONFIG' | 'GENERATE_ANALYTICS' | 'OPTIMIZE_IMAGES' | 'FILTER_CARDS' | 'SORT_CARDS';
  payload: any;
}

export interface WorkerResponse {
  id: string;
  type: string;
  payload: any;
  error?: string;
  processingTime: number;
}

// Worker context
const ctx: Worker = self as any;

// Message handler
ctx.addEventListener('message', ({ data }: MessageEvent<WorkerMessage>) => {
  const startTime = performance.now();
  
  try {
    switch (data.type) {
      case 'PROCESS_CARDS':
        processCards(data);
        break;
      case 'VALIDATE_CONFIG':
        validateCardConfig(data);
        break;
      case 'GENERATE_ANALYTICS':
        generateAnalytics(data);
        break;
      case 'OPTIMIZE_IMAGES':
        optimizeImages(data);
        break;
      case 'FILTER_CARDS':
        filterCards(data);
        break;
      case 'SORT_CARDS':
        sortCards(data);
        break;
      default:
        sendError(data.id, `Unknown message type: ${data.type}`);
    }
  } catch (error) {
    sendError(data.id, error instanceof Error ? error.message : 'Unknown error', performance.now() - startTime);
  }
});

function processCards(message: WorkerMessage): void {
  const cards: AICardConfig[] = message.payload.cards;
  const startTime = performance.now();
  
  const processedCards = cards.map(card => ({
    ...card,
    processedAt: Date.now(),
    complexity: calculateComplexity(card),
    searchableText: generateSearchableText(card),
    performance: {
      renderWeight: calculateRenderWeight(card),
      memoryEstimate: estimateMemoryUsage(card),
      loadPriority: calculateLoadPriority(card)
    }
  }));

  sendResponse(message.id, 'CARDS_PROCESSED', {
    cards: processedCards,
    statistics: {
      totalProcessed: processedCards.length,
      averageComplexity: processedCards.reduce((sum, card) => sum + card.complexity, 0) / processedCards.length,
      processingTime: performance.now() - startTime
    }
  }, performance.now() - startTime);
}

function validateCardConfig(message: WorkerMessage): void {
  const config: AICardConfig = message.payload.config;
  const startTime = performance.now();
  
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Validation logic
  if (!config.cardTitle || config.cardTitle.trim().length === 0) {
    errors.push('Card title is required');
  }

  if (!config.sections || config.sections.length === 0) {
    warnings.push('Card has no sections');
  }

  if (config.sections) {
    config.sections.forEach((section, index) => {
      if (!section.title) {
        warnings.push(`Section ${index + 1} has no title`);
      }
      
      if (!section.fields || section.fields.length === 0) {
        warnings.push(`Section ${index + 1} has no fields`);
      }
    });
  }

  // Performance suggestions
  if (config.sections && config.sections.length > 10) {
    suggestions.push('Consider reducing the number of sections for better performance');
  }

  const totalFields = config.sections?.reduce((sum, section) => sum + (section.fields?.length || 0), 0) || 0;
  if (totalFields > 50) {
    suggestions.push('High field count may impact rendering performance');
  }

  sendResponse(message.id, 'CONFIG_VALIDATED', {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    complexity: calculateComplexity(config),
    performanceScore: calculatePerformanceScore(config)
  }, performance.now() - startTime);
}

function generateAnalytics(message: WorkerMessage): void {
  const cards: AICardConfig[] = message.payload.cards;
  const startTime = performance.now();
  
  const analytics = {
    overview: {
      totalCards: cards.length,
      totalSections: cards.reduce((sum, card) => sum + (card.sections?.length || 0), 0),
      totalFields: cards.reduce((sum, card) => 
        sum + (card.sections?.reduce((sectionSum, section) => 
          sectionSum + (section.fields?.length || 0), 0) || 0), 0),
      averageComplexity: cards.reduce((sum, card) => sum + calculateComplexity(card), 0) / cards.length
    },
    
    sectionTypes: countSectionTypes(cards),
    fieldTypes: countFieldTypes(cards),
    
    performance: {
      averageRenderWeight: cards.reduce((sum, card) => sum + calculateRenderWeight(card), 0) / cards.length,
      totalMemoryEstimate: cards.reduce((sum, card) => sum + estimateMemoryUsage(card), 0),
      highComplexityCards: cards.filter(card => calculateComplexity(card) > 0.7).length
    },
    
    distribution: {
      complexityDistribution: calculateComplexityDistribution(cards),
      sizeDistribution: calculateSizeDistribution(cards),
      typeDistribution: calculateTypeDistribution(cards)
    },
    
    trends: {
      dailyCreation: calculateDailyCreationTrend(cards),
      popularFieldTypes: getPopularFieldTypes(cards),
      performanceMetrics: calculatePerformanceMetrics(cards)
    },
    
    generatedAt: Date.now()
  };

  sendResponse(message.id, 'ANALYTICS_GENERATED', analytics, performance.now() - startTime);
}

function optimizeImages(message: WorkerMessage): void {
  const images: { url: string; quality: number }[] = message.payload.images;
  const startTime = performance.now();
  
  // Simulate image optimization
  const optimizedImages = images.map(image => ({
    ...image,
    optimized: true,
    compressionRatio: Math.random() * 0.5 + 0.3, // 30-80% compression
    webpUrl: image.url.replace(/\.(jpg|jpeg|png)$/i, '.webp'),
    avifUrl: image.url.replace(/\.(jpg|jpeg|png)$/i, '.avif')
  }));

  sendResponse(message.id, 'IMAGES_OPTIMIZED', {
    images: optimizedImages,
    totalSavings: optimizedImages.reduce((sum, img) => sum + (img.compressionRatio * 1000), 0) // Simulated KB savings
  }, performance.now() - startTime);
}

function filterCards(message: WorkerMessage): void {
  const { cards, filters } = message.payload;
  const startTime = performance.now();
  
  let filteredCards = [...cards];
  
  // Apply filters
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filteredCards = filteredCards.filter(card => 
      card.cardTitle.toLowerCase().includes(query) ||
      card.searchableText?.toLowerCase().includes(query)
    );
  }
  
  if (filters.complexity) {
    filteredCards = filteredCards.filter(card => {
      const complexity = calculateComplexity(card);
      return complexity >= filters.complexity.min && complexity <= filters.complexity.max;
    });
  }
  
  if (filters.types && filters.types.length > 0) {
    filteredCards = filteredCards.filter(card => 
      filters.types.includes(card.cardType || 'unknown')
    );
  }
  
  if (filters.dateRange) {
    filteredCards = filteredCards.filter(card => {
      const cardDate = new Date(card.processedAt || Date.now());
      return cardDate >= new Date(filters.dateRange.start) && 
             cardDate <= new Date(filters.dateRange.end);
    });
  }

  sendResponse(message.id, 'CARDS_FILTERED', {
    cards: filteredCards,
    totalFiltered: filteredCards.length,
    originalCount: cards.length
  }, performance.now() - startTime);
}

function sortCards(message: WorkerMessage): void {
  const { cards, sortBy, sortOrder } = message.payload;
  const startTime = performance.now();
  
  const sortedCards = [...cards].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'title':
        aValue = a.cardTitle;
        bValue = b.cardTitle;
        break;
      case 'complexity':
        aValue = calculateComplexity(a);
        bValue = calculateComplexity(b);
        break;
      case 'date':
        aValue = new Date(a.processedAt || 0);
        bValue = new Date(b.processedAt || 0);
        break;
      case 'performance':
        aValue = calculateRenderWeight(a);
        bValue = calculateRenderWeight(b);
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  sendResponse(message.id, 'CARDS_SORTED', {
    cards: sortedCards,
    sortedBy: sortBy,
    sortOrder
  }, performance.now() - startTime);
}

// Helper functions
function calculateComplexity(card: AICardConfig): number {
  const sectionCount = card.sections?.length || 0;
  const fieldCount = card.sections?.reduce((sum, section) => sum + (section.fields?.length || 0), 0) || 0;
  const hasImages = card.sections?.some(section => 
    section.fields?.some(field => field.type === 'image')
  ) || false;
  
  let complexity = 0;
  complexity += Math.min(sectionCount / 10, 0.3); // Max 0.3 for sections
  complexity += Math.min(fieldCount / 50, 0.4);   // Max 0.4 for fields
  complexity += hasImages ? 0.3 : 0;              // 0.3 for images
  
  return Math.min(complexity, 1);
}

function calculateRenderWeight(card: AICardConfig): number {
  const baseWeight = 100; // Base render weight
  const sectionWeight = (card.sections?.length || 0) * 20;
  const fieldWeight = card.sections?.reduce((sum, section) => 
    sum + (section.fields?.length || 0) * 10, 0) || 0;
  
  return baseWeight + sectionWeight + fieldWeight;
}

function estimateMemoryUsage(card: AICardConfig): number {
  const baseMemory = 5000; // 5KB base
  const sectionMemory = (card.sections?.length || 0) * 1000; // 1KB per section
  const fieldMemory = card.sections?.reduce((sum, section) => 
    sum + (section.fields?.length || 0) * 500, 0) || 0; // 500B per field
  
  return baseMemory + sectionMemory + fieldMemory;
}

function calculateLoadPriority(card: AICardConfig): 'high' | 'medium' | 'low' {
  const complexity = calculateComplexity(card);
  if (complexity < 0.3) return 'high';
  if (complexity < 0.7) return 'medium';
  return 'low';
}

function generateSearchableText(card: AICardConfig): string {
  const texts: string[] = [card.cardTitle];
  
  card.sections?.forEach(section => {
    if (section.title) texts.push(section.title);
    section.fields?.forEach(field => {
      if (field.label) texts.push(field.label);
      if (field.value) texts.push(field.value.toString());
    });
  });
  
  return texts.join(' ').toLowerCase();
}

function countSectionTypes(cards: AICardConfig[]): Record<string, number> {
  const types: Record<string, number> = {};
  
  cards.forEach(card => {
    card.sections?.forEach(section => {
      const type = section.type || 'unknown';
      types[type] = (types[type] || 0) + 1;
    });
  });
  
  return types;
}

function countFieldTypes(cards: AICardConfig[]): Record<string, number> {
  const types: Record<string, number> = {};
  
  cards.forEach(card => {
    card.sections?.forEach(section => {
      section.fields?.forEach(field => {
        const type = field.type || 'unknown';
        types[type] = (types[type] || 0) + 1;
      });
    });
  });
  
  return types;
}

function calculateComplexityDistribution(cards: AICardConfig[]): Record<string, number> {
  const distribution = { low: 0, medium: 0, high: 0 };
  
  cards.forEach(card => {
    const complexity = calculateComplexity(card);
    if (complexity < 0.3) distribution.low++;
    else if (complexity < 0.7) distribution.medium++;
    else distribution.high++;
  });
  
  return distribution;
}

function calculateSizeDistribution(cards: AICardConfig[]): Record<string, number> {
  const distribution = { small: 0, medium: 0, large: 0 };
  
  cards.forEach(card => {
    const weight = calculateRenderWeight(card);
    if (weight < 500) distribution.small++;
    else if (weight < 1500) distribution.medium++;
    else distribution.large++;
  });
  
  return distribution;
}

function calculateTypeDistribution(cards: AICardConfig[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  
  cards.forEach(card => {
    const type = card.cardType || 'unknown';
    distribution[type] = (distribution[type] || 0) + 1;
  });
  
  return distribution;
}

function calculateDailyCreationTrend(cards: AICardConfig[]): Record<string, number> {
  const trend: Record<string, number> = {};
  
  cards.forEach(card => {
    const date = new Date(card.processedAt || Date.now()).toISOString().split('T')[0];
    trend[date] = (trend[date] || 0) + 1;
  });
  
  return trend;
}

function getPopularFieldTypes(cards: AICardConfig[]): { type: string; count: number }[] {
  const fieldTypes = countFieldTypes(cards);
  return Object.entries(fieldTypes)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function calculatePerformanceMetrics(cards: AICardConfig[]): any {
  return {
    averageRenderWeight: cards.reduce((sum, card) => sum + calculateRenderWeight(card), 0) / cards.length,
    averageMemoryUsage: cards.reduce((sum, card) => sum + estimateMemoryUsage(card), 0) / cards.length,
    averageComplexity: cards.reduce((sum, card) => sum + calculateComplexity(card), 0) / cards.length
  };
}

function calculatePerformanceScore(config: AICardConfig): number {
  const complexity = calculateComplexity(config);
  const renderWeight = calculateRenderWeight(config);
  const memoryUsage = estimateMemoryUsage(config);
  
  // Higher score is better (inverse of complexity and resource usage)
  return Math.max(0, 100 - (complexity * 50) - (renderWeight / 100) - (memoryUsage / 1000));
}

function sendResponse(id: string, type: string, payload: any, processingTime: number): void {
  const response: WorkerResponse = {
    id,
    type,
    payload,
    processingTime
  };
  
  ctx.postMessage(response);
}

function sendError(id: string, error: string, processingTime = 0): void {
  const response: WorkerResponse = {
    id,
    type: 'ERROR',
    payload: null,
    error,
    processingTime
  };
  
  ctx.postMessage(response);
}
