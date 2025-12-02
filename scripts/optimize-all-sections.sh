#!/bin/bash

# Optimize all section SCSS files with compact variables
cd projects/osi-cards-lib/src/lib/components/sections

for scss in */*.scss; do
  # Replace common patterns with compact versions
  sed -i '' 's/gap: var(--spacing-lg)/gap: var(--section-header-gap)/g' "$scss"
  sed -i '' 's/gap: var(--spacing-base)/gap: var(--spacing-compact-base)/g' "$scss"
  sed -i '' 's/padding: var(--spacing-lg)/padding: var(--spacing-compact-lg)/g' "$scss"
  sed -i '' 's/padding: var(--spacing-base)/padding: var(--spacing-compact-base) var(--spacing-compact-md)/g' "$scss"
  sed -i '' 's/padding: var(--spacing-xl)/padding: var(--spacing-compact-lg)/g' "$scss"
  sed -i '' 's/min-height: 120px/min-height: var(--section-card-compact-height)/g' "$scss"
  sed -i '' 's/min-height: 100px/min-height: var(--section-card-compact-height)/g' "$scss"
  
  echo "Optimized: $scss"
done

echo "✅ All sections optimized for compact display"
