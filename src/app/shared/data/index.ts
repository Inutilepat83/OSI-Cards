export { companyTemplateVariants } from './company-template-variants';
export { contactTemplateVariants } from './contact-template-variants';
export { opportunityTemplateVariants } from './opportunity-template-variants';
export { productTemplateVariants } from './product-template-variants';
export { analyticsTemplateVariants } from './analytics-template-variants';
export { eventTemplateVariants } from './event-template-variants';
export { projectTemplateVariants } from './project-template-variants';

// Combined export for convenience
import { companyTemplateVariants } from './company-template-variants';
import { contactTemplateVariants } from './contact-template-variants';
import { opportunityTemplateVariants } from './opportunity-template-variants';
import { productTemplateVariants } from './product-template-variants';
import { analyticsTemplateVariants } from './analytics-template-variants';
import { eventTemplateVariants } from './event-template-variants';
import { projectTemplateVariants } from './project-template-variants';

export const allTemplateVariants = [
  ...companyTemplateVariants,
  ...contactTemplateVariants,
  ...opportunityTemplateVariants,
  ...productTemplateVariants,
  ...analyticsTemplateVariants,
  ...eventTemplateVariants,
  ...projectTemplateVariants
];
