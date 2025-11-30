# Contact Card Section

Displays person information with avatars, roles, contact details, and social links.

## Overview

The **Contact Card Section** (`type: "contact-card"`) is used for displays person information with avatars, roles, contact details, and social links.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | `contact-card` |
| Uses Fields | Yes |
| Uses Items | No |
| Default Columns | 2 |
| Supports Collapse | Yes |
| Aliases | None |


## Use Cases

- Team members
- Key contacts
- Leadership
- Stakeholders

## Data Schema

### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
| `title` | string | Contact name |
| `label` | string | Contact label |
| `value` | string | Role or description |
| `role` | string | Job role/title |
| `email` | string | Email address |
| `phone` | string | Phone number |
| `avatar` | string | Avatar image URL |
| `department` | string | Department name |
| `linkedIn` | string | LinkedIn profile URL |



## Complete Example

```json
{
  "title": "Key Contacts",
  "type": "contact-card",
  "description": "Primary contacts and stakeholders",
  "fields": [
    {
      "label": "Primary Contact",
      "title": "Jane Doe",
      "value": "Product Manager",
      "email": "jane.doe@example.com",
      "phone": "+1 555 0100",
      "role": "Product Manager",
      "department": "Product",
      "linkedIn": "https://linkedin.com/in/janedoe"
    },
    {
      "label": "Technical Lead",
      "title": "John Smith",
      "value": "Engineering Director",
      "email": "john.smith@example.com",
      "phone": "+1 555 0101",
      "role": "Engineering Director",
      "department": "Engineering"
    }
  ]
}
```

## Minimal Example

```json
{
  "title": "Contact",
  "type": "contact-card",
  "fields": [
    {
      "title": "Contact Name",
      "email": "contact@example.com"
    }
  ]
}
```

## Best Practices

1. Include name, role, and contact info
2. Add avatar images when available
3. Include social media links
4. Group by department or role

## Component Information

- **Selector:** `app-contact-card-section`
- **Component Path:** `./lib/components/sections/contact-card-section/contact-card-section.component`
- **Style Path:** `./lib/styles/components/sections/_contact.scss`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
