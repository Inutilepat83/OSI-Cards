// src/components/ui/MasonryGrid.tsx
import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { SectionRenderer } from '../SectionRenderer';

// Get colSpan from section component
function getSectionColSpan(section: any): number {
  // Import section components to get their colSpan
  const { OverviewSection } = require('../sections/OverviewSection');
  const { InfoSection } = require('../sections/InfoSection');
  const { AnalyticsSection } = require('../sections/AnalyticsSection');
  const { MapSection } = require('../sections/MapSection');
  const { FinancialsSection } = require('../sections/FinancialsSection');
  const { ContactCardSection } = require('../sections/ContactCardSection');
  const { NetworkCardSection } = require('../sections/NetworkCardSection');
  const { ListSection } = require('../sections/ListSection');
  const { ChartSection } = require('../sections/ChartSection');
  const { EventSection } = require('../sections/EventSection');
  const { ProductSection } = require('../sections/ProductSection');
  const { SolutionsSection } = require('../sections/SolutionsSection');
  
  const SECTION_COMPONENTS: Record<string, React.FC<any> & { colSpan?: number }> = {
    info: InfoSection,
    analytics: AnalyticsSection,
    map: MapSection,
    financials: FinancialsSection,
    'contact-card': ContactCardSection,
    'network-card': NetworkCardSection,
    list: ListSection,
    chart: ChartSection,
    event: EventSection,
    product: ProductSection,
    solutions: SolutionsSection,
    locations: InfoSection,
    project: InfoSection,
  };

  // Check for explicit colSpan first
  if (section.colSpan) {
    return section.colSpan;
  }

  // Check for preferredColumns from template data
  if (section.preferredColumns) {
    return section.preferredColumns;
  }

  // Special-case for "overview" section type
  if (
    section.type === 'info' &&
    section.title &&
    section.title.toLowerCase().includes('overview')
  ) {
    return OverviewSection.colSpan || 2;
  }
  
  // Use component's default colSpan
  const Component = SECTION_COMPONENTS[section.type] || InfoSection;
  return Component.colSpan || 1;
}

export interface MasonryGridProps extends React.HTMLAttributes<HTMLDivElement> {
  sections: any[];
  gap?: number;
  minColWidth?: number;
  onFieldInteraction?: (data: any) => void;
}

export const MasonryGrid: React.FC<MasonryGridProps> = ({
  sections,
  gap = 24,
  minColWidth = 280,
  className = '',
  onFieldInteraction,
  ...props
}) => {
  const [containerWidth, setContainerWidth] = useState(1200);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function updateWidth() {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    }
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const columns = useMemo(() => {
    // Columns = max 1, or as many fit at minColWidth+gap
    return Math.max(
      1,
      Math.floor((containerWidth + gap) / (minColWidth + gap))
    );
  }, [containerWidth, gap, minColWidth]);

  // Algorithm for masonry positioning
  const positioned = useMemo(() => {
    const colHeights = Array(columns).fill(0);
    
    return sections.map(section => {
      const colSpan = Math.min(getSectionColSpan(section), columns);
      let bestCol = 0, minY = Infinity;
      
      for (let c = 0; c <= columns - colSpan; c++) {
        const groupY = Math.max(...colHeights.slice(c, c + colSpan));
        if (groupY < minY) {
          minY = groupY;
          bestCol = c;
        }
      }
      
      // We don't know the actual height yet, so we'll use a placeholder
      // The actual height will be set after the component renders
      const placeholderHeight = 200; // Will be updated by ResizeObserver
      
      for (let c = bestCol; c < bestCol + colSpan; c++) {
        colHeights[c] = minY + placeholderHeight + gap;
      }
      
      const totalGap = gap * (columns - 1);
      const colWidth = `calc((100% - ${totalGap}px) / ${columns})`;
      const width =
        colSpan === 1
          ? colWidth
          : `calc(${colWidth} * ${colSpan} + ${gap * (colSpan - 1)}px)`;
      const left = `calc((${colWidth} + ${gap}px) * ${bestCol})`;
      
      return {
        section,
        left,
        width,
        top: minY,
        colSpan,
        bestCol,
        id: section.id || section.title,
      };
    });
  }, [sections, columns, gap]);

  // Use ResizeObserver to update layout when items change height
  useEffect(() => {
    if (!containerRef.current) return;

    let timeoutId: number;
    const observer = new ResizeObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(updateLayout, 100);
    });

    const items = containerRef.current.querySelectorAll('.masonry-section');
    items.forEach(item => observer.observe(item));

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [positioned]);

  const updateLayout = useCallback(() => {
    if (!containerRef.current) return;

    const items = Array.from(containerRef.current.querySelectorAll('.masonry-section')) as HTMLElement[];
    const colHeights = Array(columns).fill(0);

    items.forEach((item, index) => {
      const positionedItem = positioned[index];
      if (!positionedItem) return;

      const colSpan = positionedItem.colSpan;
      let bestCol = 0, minY = Infinity;
      
      for (let c = 0; c <= columns - colSpan; c++) {
        const groupY = Math.max(...colHeights.slice(c, c + colSpan));
        if (groupY < minY) {
          minY = groupY;
          bestCol = c;
        }
      }

      const actualHeight = item.offsetHeight;
      
      for (let c = bestCol; c < bestCol + colSpan; c++) {
        colHeights[c] = minY + actualHeight + gap;
      }

      // Update position
      item.style.top = `${minY}px`;
      
      const totalGap = gap * (columns - 1);
      const colWidth = `calc((100% - ${totalGap}px) / ${columns})`;
      const left = `calc((${colWidth} + ${gap}px) * ${bestCol})`;
      item.style.left = left;
    });

    // Set container height
    const maxHeight = Math.max(...colHeights);
    if (containerRef.current) {
      containerRef.current.style.height = `${maxHeight}px`;
    }
  }, [columns, positioned, gap]);

  // Update layout when columns change
  useEffect(() => {
    const timer = setTimeout(updateLayout, 100);
    return () => clearTimeout(timer);
  }, [columns, positioned]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{ height: 'auto', minHeight: '200px' }}
      {...props}
    >
      {positioned.map((item, index) => (
        <div
          key={item.id}
          className="masonry-section absolute"
          style={{
            left: item.left,
            width: item.width,
            top: item.top,
            transition: 'all 0.3s cubic-bezier(.23,1.13,.84,.86)',
          }}
        >
          <SectionRenderer 
            section={item.section} 
            onFieldInteraction={onFieldInteraction}
          />
        </div>
      ))}
    </div>
  );
};