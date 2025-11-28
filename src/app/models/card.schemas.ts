/**
 * Zod Validation Schemas for Card Models
 * 
 * Provides runtime type validation for card configurations using Zod.
 * These schemas ensure data integrity and provide better error messages.
 */

import { z } from 'zod';

/**
 * Card Field Schema
 */
export const cardFieldSchema = z.object({
  id: z.string().optional(),
  label: z.string().optional(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
  icon: z.string().optional(),
  format: z.enum(['currency', 'percentage', 'number', 'text', 'date', 'datetime']).optional(),
  trend: z.enum(['up', 'down', 'stable', 'neutral']).optional(),
  change: z.number().optional(),
  percentage: z.number().min(0).max(100).optional(),
  performance: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['completed', 'in-progress', 'pending', 'error']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  type: z.string().optional(),
  meta: z.record(z.unknown()).optional()
}).passthrough(); // Allow additional properties

/**
 * Card Item Schema
 */
export const cardItemSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  value: z.union([z.string(), z.number()]).optional(),
  status: z.string().optional(),
  role: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
  meta: z.object({
    source: z.string().optional(),
    platform: z.string().optional(),
    likes: z.number().optional(),
    comments: z.number().optional(),
    publishedAt: z.string().optional(),
    avatar: z.string().url().optional(),
    author: z.string().optional()
  }).passthrough().optional()
}).passthrough();

/**
 * Card Action Schema
 */
export const cardActionSchema = z.object({
  id: z.string().optional(),
  label: z.string(),
  type: z.enum(['primary', 'secondary', 'tertiary', 'link', 'mail', 'phone', 'url', 'command']),
  icon: z.string().optional(),
  action: z.string(),
  email: z.object({
    to: z.string().email(),
    subject: z.string().optional(),
    body: z.string().optional()
  }).optional(),
  phone: z.string().optional(),
  url: z.string().url().optional(),
  command: z.string().optional(),
  disabled: z.boolean().optional(),
  meta: z.record(z.unknown()).optional()
}).passthrough();

/**
 * Card Section Schema
 */
export const cardSectionSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  type: z.enum([
    'info',
    'timeline',
    'analytics',
    'metrics',
    'contact-card',
    'network-card',
    'map',
    'financials',
    'locations',
    'event',
    'project',
    'list',
    'table',
    'chart',
    'product',
    'solutions',
    'overview',
    'stats',
    'quotation',
    'reference',
    'text-reference',
    'text-ref',
    'brand-colors',
    'news',
    'social-media'
  ]),
  description: z.string().optional(),
  subtitle: z.string().optional(),
  columns: z.number().int().min(1).max(4).optional(),
  colSpan: z.number().int().min(1).max(4).optional(),
  width: z.number().optional(),
  collapsed: z.boolean().optional(),
  emoji: z.string().optional(),
  fields: z.array(cardFieldSchema).optional(),
  items: z.array(cardItemSchema).optional(),
  chartType: z.enum(['bar', 'line', 'pie', 'doughnut']).optional(),
  chartData: z.object({
    labels: z.array(z.string()).optional(),
    datasets: z.array(z.object({
      label: z.string().optional(),
      data: z.array(z.number()),
      backgroundColor: z.union([z.string(), z.array(z.string())]).optional(),
      borderColor: z.union([z.string(), z.array(z.string())]).optional(),
      borderWidth: z.number().optional()
    })).optional()
  }).optional(),
  meta: z.record(z.unknown()).optional()
}).passthrough();

/**
 * AI Card Config Schema
 */
export const aiCardConfigSchema = z.object({
  id: z.string().optional(),
  cardTitle: z.string().min(1, 'Card title is required'),
  cardSubtitle: z.string().optional(),
  cardType: z.string().optional(),
  description: z.string().optional(),
  columns: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  sections: z.array(cardSectionSchema).min(1, 'At least one section is required'),
  actions: z.array(cardActionSchema).optional(),
  meta: z.record(z.unknown()).optional(),
  processedAt: z.number().optional()
});

/**
 * Type exports for TypeScript inference
 */
export type CardFieldInput = z.input<typeof cardFieldSchema>;
export type CardItemInput = z.input<typeof cardItemSchema>;
export type CardActionInput = z.input<typeof cardActionSchema>;
export type CardSectionInput = z.input<typeof cardSectionSchema>;
export type AICardConfigInput = z.input<typeof aiCardConfigSchema>;

export type CardFieldOutput = z.output<typeof cardFieldSchema>;
export type CardItemOutput = z.output<typeof cardItemSchema>;
export type CardActionOutput = z.output<typeof cardActionSchema>;
export type CardSectionOutput = z.output<typeof cardSectionSchema>;
export type AICardConfigOutput = z.output<typeof aiCardConfigSchema>;

