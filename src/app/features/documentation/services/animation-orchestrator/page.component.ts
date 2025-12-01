import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# AnimationOrchestratorService

Coordinate card and section animations.

## Overview

\`AnimationOrchestratorService\` manages complex animation sequences for cards and sections.

## Import

\`\`\`typescript
import { AnimationOrchestratorService } from 'osi-cards-lib';
\`\`\`

## Methods

### animateCardEntry(element, options?)

Animate card entering the view.

\`\`\`typescript
orchestrator.animateCardEntry(cardElement, {
  duration: 300,
  delay: 100,
  easing: 'ease-out'
});
\`\`\`

### animateSectionComplete(element, index)

Animate section completion.

### animateStaggeredList(elements, options?)

Animate multiple elements with stagger.

\`\`\`typescript
orchestrator.animateStaggeredList(sectionElements, {
  stagger: 50,
  duration: 200
});
\`\`\`

### cancelAnimations()

Cancel all running animations.

## Animation Presets

| Preset | Description |
|--------|-------------|
| \`fadeIn\` | Simple fade in |
| \`slideUp\` | Slide from bottom |
| \`scaleIn\` | Scale from 0.9 to 1 |
| \`highlight\` | Flash highlight effect |
`;

@Component({
  selector: 'app-animation-orchestrator-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimationOrchestratorPageComponent {
  content = pageContent;
}

export default AnimationOrchestratorPageComponent;
