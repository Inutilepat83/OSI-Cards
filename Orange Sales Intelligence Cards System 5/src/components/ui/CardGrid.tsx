// src/components/ui/CardGrid.tsx - Enhanced Figma-inspired flexible grid
import React from 'react'

export interface CardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: {
    base?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: 'sm' | 'md' | 'lg'
}

export const CardGrid: React.FC<CardGridProps> = ({
  columns = { base: 1, sm: 2, md: 3, lg: 3, xl: 3 },
  gap = 'md',
  className = '',
  children,
  ...props
}) => {
  const cols = [
    `grid-cols-${columns.base}`,
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`,
  ]
    .filter(Boolean)
    .join(' ')

  const gaps = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  }[gap]

  return (
    <div
      className={`grid ${cols} ${gaps} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

// New Figma-inspired flexible grid container
export interface FlexGridContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxColumns?: number
  gap?: number
  minItemWidth?: number
}

export const FlexGridContainer: React.FC<FlexGridContainerProps> = ({
  maxColumns = 3,
  gap = 24,
  minItemWidth = 320,
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`flex-grid-container ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${maxColumns}, 1fr)`,
        gap: `${gap}px`,
        alignItems: 'start',
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  )
}

// Grid item wrapper with dynamic column span
export interface FlexGridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3
  children: React.ReactNode
}

export const FlexGridItem: React.FC<FlexGridItemProps> = ({
  columns = 1,
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`flex-grid-item ${className}`}
      style={{
        gridColumn: `span ${columns}`,
        height: 'fit-content',
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  )
}