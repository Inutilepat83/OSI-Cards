# osi-cards-lib

Standalone OSI Cards library for Angular applications with CSS Layer support for easy style overrides

## Installation

```bash
npm install osi-cards-lib
```

## Quick Start

```typescript
import { AICardRendererComponent, AICardConfig } from 'osi-cards-lib';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [AICardRendererComponent],
  template: `
    <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
  `
})
export class ExampleComponent {
  card: AICardConfig = {
    cardTitle: 'Example Card',
    sections: [
      {
        title: 'Info',
        type: 'info',
        fields: [
          { label: 'Name', value: 'Example' }
        ]
      }
    ]
  };
}
```

## Documentation

For complete documentation, visit: https://github.com/Inutilepat83/OSI-Cards

## Version

1.4.0
