import React from 'react';
import { FlexGridContainer, FlexGridItem } from './ui/CardGrid';
import { AISectionConfig } from '../types';
import { InfoSection } from './sections/InfoSection';
import { AnalyticsSection } from './sections/AnalyticsSection';
import { MapSection } from './sections/MapSection';
import { FinancialsSection } from './sections/FinancialsSection';
import { ContactCardSection } from './sections/ContactCardSection';
import { NetworkCardSection } from './sections/NetworkCardSection';
import { ListSection } from './sections/ListSection';
import { ChartSection } from './sections/ChartSection';
import { EventSection } from './sections/EventSection';
import { ProductSection } from './sections/ProductSection';
import { SolutionsSection } from './sections/SolutionsSection';
import { OverviewSection } from './sections/OverviewSection';

interface SectionRendererProps {
  section: AISectionConfig;
  onFieldInteraction?: (data: any) => void;
}

export const SectionRenderer: React.FC<SectionRendererProps> = ({
  section,
  onFieldInteraction
}) => {
  const commonProps = {
    section,
    onFieldInteraction
  };

  const sectionContent = (() => {
    // Check if this is an overview section based on title
    const isOverviewSection = section.title.toLowerCase().includes('overview');
    
    switch (section.type) {
      case 'info':
        if (isOverviewSection) {
          return <OverviewSection {...commonProps} />;
        }
        return <InfoSection {...commonProps} />;
      
      case 'analytics':
        return <AnalyticsSection {...commonProps} />;
      
      case 'map':
        return <MapSection {...commonProps} />;
      
      case 'financials':
        return <FinancialsSection {...commonProps} />;
      
      case 'contact-card':
        return <ContactCardSection {...commonProps} />;
      
      case 'network-card':
        return <NetworkCardSection {...commonProps} />;
      
      case 'list':
        return <ListSection {...commonProps} />;
      
      case 'chart':
        return <ChartSection {...commonProps} />;
      
      case 'event':
        return <EventSection {...commonProps} />;
      
      case 'product':
        return <ProductSection {...commonProps} />;
      
      case 'solutions':
        return <SolutionsSection {...commonProps} />;
      
      case 'locations':
        return <InfoSection {...commonProps} />; // Fallback to info
      
      case 'project':
        return <InfoSection {...commonProps} />; // Fallback to info
      
      default:
        console.warn(`Unknown section type: ${section.type}`);
        return <InfoSection {...commonProps} />;
    }
  })();

  return (
    <div className="h-full">
      {sectionContent}
    </div>
  );
};