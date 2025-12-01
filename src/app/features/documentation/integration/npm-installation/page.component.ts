import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# NPM Installation

Install OSI Cards from npm.

## Standard Installation

\`\`\`bash
npm install osi-cards-lib
\`\`\`

## With Peer Dependencies

\`\`\`bash
npm install osi-cards-lib @angular/animations lucide-angular
\`\`\`

## Legacy Peer Deps

If you encounter peer dependency conflicts:

\`\`\`bash
npm install osi-cards-lib --legacy-peer-deps
\`\`\`

## From GitHub

\`\`\`bash
npm install git+https://github.com/Inutilepat83/OSI-Cards.git
\`\`\`

## Verify Installation

\`\`\`typescript
import { AICardRendererComponent } from 'osi-cards-lib';
// Should compile without errors
\`\`\`
`;

@Component({
  selector: 'app-npm-installation-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NpmInstallationPageComponent {
  content = pageContent;
}

export default NpmInstallationPageComponent;
