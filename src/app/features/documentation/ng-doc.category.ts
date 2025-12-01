import { NgDocCategory } from '@ng-doc/core';

/**
 * Root documentation category
 * Groups all documentation pages in the sidebar
 */
const DocsCategory: NgDocCategory = {
  title: 'OSI Cards Documentation',
  expandable: true,
  expanded: true,
  order: 1,
};

export default DocsCategory;
