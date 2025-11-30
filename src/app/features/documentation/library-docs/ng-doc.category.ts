import { NgDocCategory } from '@ng-doc/core';
import DocsCategory from '../ng-doc.category';

/**
 * Library documentation category
 * Groups API and service documentation
 */
const LibraryDocsCategory: NgDocCategory = {
  title: 'Library Reference',
  expandable: true,
  expanded: false,
  order: 2,
  category: DocsCategory
};

export default LibraryDocsCategory;

