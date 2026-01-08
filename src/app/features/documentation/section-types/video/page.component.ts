import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';
import { DocsDemoComponent } from '../../components';

const pageContent = `# Video Section

Displays video content with thumbnails, durations, and playback controls.

## Overview

The **Video Section** (\`type: "video"\`) is used for displays video content with thumbnails, durations, and playback controls.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | \`video\` |
| Uses Fields | No |
| Uses Items | Yes |
| Default Columns | 2 |
| Supports Collapse | Yes |
| Aliases | \`videos\`, \`media\` |


## Use Cases

- Product demos
- Training videos
- Webinar recordings
- Customer testimonials
- Tutorial content

## Data Schema



### Items Schema

| Property | Type | Description |
|----------|------|-------------|
| \`title\` | string | Video title |
| \`description\` | string | Video description |
| \`meta\` | object | - |

## Complete Example

\`\`\`json
{
  "title": "Video Resources",
  "type": "video",
  "description": "Product demos, tutorials, and webinar recordings",
  "items": [
    {
      "title": "Nexus Analytics Platform Overview",
      "description": "Complete walkthrough of the Nexus platform capabilities, AI features, and enterprise integrations",
      "meta": {
        "url": "https://www.youtube.com/watch?v=jNQXAC9IVRw",
        "thumbnail": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop",
        "duration": "12:45",
        "views": 45000,
        "category": "Product Demo"
      }
    },
    {
      "title": "Getting Started with Nexus in 5 Minutes",
      "description": "Quick-start guide covering account setup, data connection, and your first dashboard",
      "meta": {
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "thumbnail": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop",
        "duration": "5:23",
        "views": 125000,
        "category": "Tutorial"
      }
    }
  ]
}
\`\`\`

## Minimal Example

\`\`\`json
{
  "title": "Videos",
  "type": "video",
  "items": [
    {
      "title": "Video Title"
    }
  ]
}
\`\`\`

## Best Practices

1. Include video thumbnails
2. Show duration information
3. Add descriptive titles
4. Provide video URLs
5. Group by category

## Component Information

- **Selector:** \`lib-video-section\`
- **Component Path:** \`./lib/components/sections/video-section/video-section.component\`
- **Style Path:** \`./lib/components/sections/video-section/video-section.scss\`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

const demoConfig = {
  title: 'Video Resources',
  type: 'video',
  description: 'Product demos, tutorials, and webinar recordings',
  items: [
    {
      title: 'Nexus Analytics Platform Overview',
      description:
        'Complete walkthrough of the Nexus platform capabilities, AI features, and enterprise integrations',
      meta: {
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        duration: '12:45',
        views: 45000,
        category: 'Product Demo',
      },
    },
    {
      title: 'Getting Started with Nexus in 5 Minutes',
      description:
        'Quick-start guide covering account setup, data connection, and your first dashboard',
      meta: {
        url: 'https://www.youtube.com/embed/jNQXAC9IVRw',
        thumbnail: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
        duration: '5:23',
        views: 125000,
        category: 'Tutorial',
      },
    },
    {
      title: 'AI-Powered Insights Demo',
      description:
        'See how our AI engine automatically discovers insights and explains metric changes',
      meta: {
        url: 'https://www.youtube.com/embed/9bZkp7q19f0',
        thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg',
        duration: '8:15',
        views: 67000,
        category: 'Product Demo',
      },
    },
  ],
};

/**
 * Video Section documentation page with live demo
 * Auto-generated - modifications may be overwritten
 */
@Component({
  selector: 'app-video-page',
  standalone: true,
  imports: [DocPageComponent, DocsDemoComponent],
  template: `
    <div class="section-docs">
      <app-docs-demo
        [config]="demo"
        [type]="'video'"
        demoTitle="Live Preview"
        height="350px"
      ></app-docs-demo>
      <app-doc-page [content]="content"></app-doc-page>
    </div>
  `,
  styles: [
    `
      .section-docs {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoPageComponent {
  content = pageContent;
  demo = demoConfig;
}

export default VideoPageComponent;
