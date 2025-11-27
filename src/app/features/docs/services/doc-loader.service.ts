import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface DocMetadata {
  id: string;
  title: string;
  description?: string;
  category?: string;
  order?: number;
  icon?: string;
}

/**
 * Service for loading markdown documentation files with metadata
 */
@Injectable({
  providedIn: 'root'
})
export class DocLoaderService {
  private readonly http = inject(HttpClient);

  private readonly docMetadata: DocMetadata[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Installation, setup, and quick start guide',
      category: 'Getting Started',
      order: 1,
      icon: 'rocket'
    },
    {
      id: 'installation',
      title: 'Installation',
      description: 'Install from npm or GitHub',
      category: 'Getting Started',
      order: 2,
      icon: 'download'
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      description: 'Complete API documentation',
      category: 'Reference',
      order: 3,
      icon: 'code-2'
    },
    {
      id: 'improvement-plan',
      title: 'Improvement Plan',
      description: 'Comprehensive roadmap for enhancements',
      category: 'Development',
      order: 4,
      icon: 'target'
    },
    {
      id: 'implementation-summary',
      title: 'Implementation Summary',
      description: 'Summary of implemented improvements',
      category: 'Development',
      order: 5,
      icon: 'check-circle-2'
    },
    {
      id: 'improvements-implemented',
      title: 'Improvements Implemented',
      description: 'List of completed improvements',
      category: 'Development',
      order: 6,
      icon: 'sparkles'
    },
    {
      id: 'typescript-strict-migration',
      title: 'TypeScript Strict Migration',
      description: 'Migration guide for strict TypeScript',
      category: 'Development',
      order: 7,
      icon: 'settings'
    }
  ];

  /**
   * Load a markdown file from the docs directory
   * @param docName Name of the documentation file (without .md extension)
   * @returns Observable of the markdown content as string
   */
  loadDoc(docName: string): Observable<string> {
    // Map doc names to actual file names
    const fileNameMap: Record<string, string> = {
      'getting-started': 'GETTING_STARTED',
      'installation': 'INSTALLATION',
      'api-reference': 'API_REFERENCE',
      'implementation-summary': 'IMPLEMENTATION_SUMMARY',
      'improvement-plan': 'IMPROVEMENT_PLAN',
      'improvements-implemented': 'IMPROVEMENTS_IMPLEMENTED',
      'typescript-strict-migration': 'TYPESCRIPT_STRICT_MIGRATION'
    };
    
    const fileName = fileNameMap[docName] || docName.toUpperCase().replace(/-/g, '_');
    const docPath = `assets/docs/${fileName}.md`;
    
    return this.http.get(docPath, { responseType: 'text' }).pipe(
      catchError(() => {
        // Fallback: try loading from root docs folder
        return this.http.get(`/docs/${fileName}.md`, { responseType: 'text' }).pipe(
          catchError(() => {
            return of(`# Documentation Not Found\n\nThe documentation file "${docName}.md" could not be loaded.\n\nPlease ensure the file exists in the assets/docs directory.`);
          })
        );
      })
    );
  }

  /**
   * Get list of available documentation files
   */
  getAvailableDocs(): string[] {
    return this.docMetadata.map(doc => doc.id);
  }

  /**
   * Get all documentation metadata
   */
  getAllDocsMetadata(): DocMetadata[] {
    return [...this.docMetadata].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * Get metadata for a specific document
   */
  getDocMetadata(docId: string): DocMetadata | undefined {
    return this.docMetadata.find(doc => doc.id === docId);
  }

  /**
   * Get previous and next documents
   */
  getAdjacentDocs(currentDocId: string): { previous: DocMetadata | null; next: DocMetadata | null } {
    const allDocs = this.getAllDocsMetadata();
    const currentIndex = allDocs.findIndex(doc => doc.id === currentDocId);
    
    if (currentIndex === -1) {
      return { previous: null, next: null };
    }

    return {
      previous: currentIndex > 0 ? allDocs[currentIndex - 1] || null : null,
      next: currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] || null : null
    };
  }

  /**
   * Get docs grouped by category
   */
  getDocsByCategory(): Record<string, DocMetadata[]> {
    const grouped: Record<string, DocMetadata[]> = {};
    
    this.getAllDocsMetadata().forEach(doc => {
      const category = doc.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(doc);
    });

    return grouped;
  }
}
