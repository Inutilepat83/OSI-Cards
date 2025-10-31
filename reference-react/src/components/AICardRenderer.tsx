// src/components/AICardRenderer.tsx
import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { TiltWrapper } from './TiltWrapper';
import { MasonryGrid } from './ui/MasonryGrid';
import { AICardRendererProps, MousePosition } from '../types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader } from './ui/card';
import { Maximize2, Minimize2 } from 'lucide-react';

export const AICardRenderer: React.FC<AICardRendererProps> = ({
  cardConfig,
  onFieldInteraction,
  onCardInteraction,
  className = '',
  isFullscreen = false,
  onFullscreenToggle,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [bounds, setBounds] = useState<DOMRect | null>(null);

  useEffect(() => {
    const upd = () => cardRef.current && setBounds(cardRef.current.getBoundingClientRect());
    upd();
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && isFullscreen && onFullscreenToggle?.(false);
    if (isFullscreen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isFullscreen, onFullscreenToggle]);

  const onMove = useCallback((e: React.MouseEvent) => setMousePosition({ x: e.clientX, y: e.clientY }), []);
  const onEnter = useCallback((e: React.MouseEvent) => {
    setIsHovered(true);
    setMousePosition({ x: e.clientX, y: e.clientY });
    cardRef.current && setBounds(cardRef.current.getBoundingClientRect());
  }, []);
  const onLeave = useCallback(() => setIsHovered(false), []);

  const onFieldClick = useCallback(
    (sectionId: string, fieldId: string) => onFieldInteraction?.({ sectionId, fieldId, action: 'click' }),
    [onFieldInteraction]
  );

  const onAction = useCallback(
    (aid: string, url: string) =>
      onCardInteraction?.('action_click', {
        ...cardConfig,
        actionId: aid,
        actionUrl: url,
      }),
    [onCardInteraction, cardConfig]
  );

  const toggleFS = useCallback(() => onFullscreenToggle?.(!isFullscreen), [isFullscreen, onFullscreenToggle]);

  const getSectionPriority = useCallback((type: string, title: string): number => {
    if (type === 'contact-card') return 1;
    if (title.toLowerCase().includes('overview')) return 2;
    if (type === 'analytics') return 3;
    if (type === 'map') return 4;
    if (type === 'chart') return 5;
    if (type === 'list') return 6;
    if (type === 'info') return 7;
    if (type === 'financials') return 8;
    if (type === 'event') return 9;
    return 10;
  }, []);

  const processedSections = useMemo(() => {
    return (cardConfig.sections || [])
      .map((section, i) => ({
        section,
        key: `${section.title}-${i}`,
        priority: getSectionPriority(section.type, section.title),
      }))
      .sort((a, b) => a.priority - b.priority);
  }, [cardConfig.sections, getSectionPriority]);

  return (
    <TiltWrapper mousePosition={mousePosition} cardRef={cardRef} isActive={isHovered}>
      <Card
        ref={cardRef}
        className={[
          'relative overflow-hidden bg-gradient-to-br from-card via-card to-muted/20',
          'border-2 border-border/50 hover:border-primary/50 transition-all duration-500',
          'shadow-2xl h-full flex flex-col',
          isFullscreen && 'border-primary/70 scale-100 shadow-3xl',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        onMouseMove={onMove}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        style={{
          transformOrigin: 'center top',
          ...(isFullscreen ? { minHeight: 'fit-content', height: 'auto' } : {}),
        }}
      >
        <div className="card-reflection" />

        {onFullscreenToggle && (
          <Button
            onClick={toggleFS}
            variant="outline"
            size="sm"
            className="absolute top-4 right-4 z-20 bg-card/90 border-primary/60 hover:border-primary text-primary hover:bg-primary/10 backdrop-blur-sm transition-all duration-300"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        )}

        <CardHeader className="relative z-10 pb-6">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pr-12">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-4 mb-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                    {cardConfig.cardTitle}
                  </h1>
                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/30 px-3 py-1 font-medium"
                  >
                    {cardConfig.cardType}
                  </Badge>
                </div>
                {cardConfig.cardSubtitle && (
                  <p className="text-muted-foreground leading-relaxed">
                    {cardConfig.cardSubtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent
          className="relative z-10 px-4 sm:px-6 flex-1"
          style={{
            maxHeight: isFullscreen ? 'none' : undefined,
            overflowY: isFullscreen ? 'visible' : undefined,
            height: isFullscreen ? 'auto' : undefined,
          }}
        >
          <MasonryGrid
            sections={processedSections.map(({ section }) => section)}
            gap={24}
            minColWidth={280}
            className="w-full"
            onFieldInteraction={onFieldInteraction}
          />

          {cardConfig.actions?.length > 0 && (
            <div className="flex flex-wrap gap-3 sm:gap-4 pt-8 mt-8 border-t border-border/50">
              {cardConfig.actions.map((action, i) => (
                <Button
                  key={`${action.label}-${i}`}
                  variant={action.type === 'primary' ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => onAction(action.label, action.action)}
                  className="group relative overflow-hidden bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground border-primary shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-medium px-4 sm:px-6 py-2 sm:py-3 rounded-xl"
                >
                  <span className="relative z-10 flex items-center gap-2 sm:gap-3">
                    <span className="text-base sm:text-lg">{action.icon}</span>
                    <span>{action.label}</span>
                  </span>
                  <div className="absolute inset-0 from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Button>
              ))}
            </div>
          )}

          <div className="flex justify-center pt-8 border-t border-border/20 mt-8">
            <span className="text-xs text-muted-foreground/70 font-medium">
              Powered by Orange Sales Intelligence
            </span>
          </div>
        </CardContent>
      </Card>
    </TiltWrapper>
  );
};