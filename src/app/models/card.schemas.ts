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
export const cardFieldSchema = z
  .object({
    id: z.string().optional(),
    label: z.string().optional(),
    value: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
    icon: z.string().optional(),
    format: z.enum(['currency', 'percentage', 'number', 'text', 'date', 'datetime']).optional(),
    trend: z.enum(['up', 'down', 'stable', 'neutral']).optional(),
    change: z.number().optional(),
    percentage: z.number().min(0).optional(), // Removed max(100) to allow values > 100 (e.g., 120%, 185%)
    performance: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['completed', 'in-progress', 'pending', 'error', 'confirmed']).optional(),
    priority: z.enum(['high', 'medium', 'low']).optional(),
    type: z.string().optional(),
    meta: z.record(z.unknown()).optional(),
  })
  .passthrough(); // Allow additional properties

/**
 * Card Item Schema
 */
export const cardItemSchema = z
  .object({
    id: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    value: z.union([z.string(), z.number()]).optional(),
    status: z.string().optional(),
    role: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    avatar: z.string().url().optional(),
    meta: z
      .object({
        source: z.string().optional(),
        platform: z.string().optional(),
        likes: z.number().optional(),
        comments: z.number().optional(),
        publishedAt: z.string().optional(),
        avatar: z.string().url().optional(),
        author: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

/**
 * Card Action Schema
 * Supports multiple action types: website, agent, question, mail, and legacy types
 */
export const cardActionSchema = z
  .object({
    id: z.string().optional(),
    label: z.string(),
    type: z.enum([
      'primary',
      'secondary',
      'tertiary',
      'link',
      'mail',
      'phone',
      'url',
      'command',
      'website',
      'agent',
      'question',
    ]),
    icon: z.string().optional(),
    variant: z.enum(['primary', 'secondary', 'outline', 'ghost']).optional(),
    // action is optional - only required for legacy types (primary, secondary, link, etc.)
    action: z.string().optional(),
    // Email configuration - supports both legacy (to) and new (contact) structures
    email: z
      .object({
        // Legacy structure: direct 'to' field
        to: z.string().email().optional(),
        // New structure: contact object with email
        contact: z
          .object({
            name: z.string().optional(),
            email: z.string().email(),
            role: z.string().optional(),
          })
          .optional(),
        subject: z.string().optional(),
        body: z.string().optional(),
        cc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
        bcc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
      })
      .refine(
        (data) => {
          // Either 'to' or 'contact.email' must be present
          return data.to !== undefined || data.contact?.email !== undefined;
        },
        { message: "Email must have either 'to' or 'contact.email'" }
      )
      .optional(),
    phone: z.string().optional(),
    url: z.string().url().optional(),
    command: z.string().optional(),
    // Agent-specific fields
    agentId: z.string().optional(),
    agentContext: z.record(z.unknown()).optional(),
    // Question-specific fields
    question: z.string().optional(),
    disabled: z.boolean().optional(),
    meta: z.record(z.unknown()).optional(),
  })
  .passthrough()
  .refine(
    (data) => {
      // For website type, url or action must be present
      if (data.type === 'website') {
        return data.url !== undefined || data.action !== undefined;
      }
      // For mail type, email must be present
      if (data.type === 'mail') {
        return data.email !== undefined;
      }
      // For legacy types (primary, secondary, link, etc.), action should be present
      if (
        ['primary', 'secondary', 'tertiary', 'link', 'phone', 'url', 'command'].includes(data.type)
      ) {
        return data.action !== undefined;
      }
      return true;
    },
    {
      message:
        'Action type requires corresponding fields (url for website, email for mail, action for legacy types)',
    }
  );

/**
 * Card Section Schema
 */
export const cardSectionSchema = z
  .object({
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
      'social-media',
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
    chartData: z
      .object({
        labels: z.array(z.string()).optional(),
        datasets: z
          .array(
            z.object({
              label: z.string().optional(),
              data: z.array(z.number()),
              backgroundColor: z.union([z.string(), z.array(z.string())]).optional(),
              borderColor: z.union([z.string(), z.array(z.string())]).optional(),
              borderWidth: z.number().optional(),
            })
          )
          .optional(),
      })
      .optional(),
    meta: z.record(z.unknown()).optional(),
  })
  .passthrough();

/**
 * AI Card Config Schema
 */
export const aiCardConfigSchema = z.object({
  id: z.string().optional(),
  cardTitle: z.string().min(1, 'Card title is required'),
  cardType: z.string().optional(),
  description: z.string().optional(),
  columns: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  sections: z.array(cardSectionSchema).min(1, 'At least one section is required'),
  actions: z.array(cardActionSchema).optional(),
  meta: z.record(z.unknown()).optional(),
  processedAt: z.number().optional(),
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
