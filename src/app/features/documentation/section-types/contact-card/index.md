# Contact Card Section

Displays person information with avatars, roles, contact details, and social links.

## Overview

The **Contact Card Section** is used for displays person information with avatars, roles, contact details, and social links.

## Use Cases

- Team members
- Key contacts
- Leadership
- Stakeholders

## Data Schema

```typescript
interface CardSection {
  title: string;
  type: 'contact-card';
  fields?: CardField[];
  
}
```

## Example

```json
{
  "title": "Contact Card Section Example",
  "type": "contact-card",
  "fields": [
    {
      "label": "Example Label",
      "value": "Example Value"
    }
  ]
}
```

## Best Practices

1. Include name, role, and contact info
1. Add avatar images when available
1. Include social media links
1. Group by department or role

## Component Properties




## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
