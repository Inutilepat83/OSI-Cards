# Contact Card Section

Displays person information with avatars, roles, contact details, and social links.

## Overview

The Contact Card Section displays contact information in a card format with support for avatars, roles, email, phone, and social media links.

**Component:** `lib-contact-card-section`
**Type:** `contact-card`
**Aliases:** `contacts`, `team`
**Uses Fields:** Yes
**Default Columns:** 2

## Use Cases

- Team members
- Key contacts
- Leadership profiles
- Stakeholder directory
- Sales contacts

## Best Practices

- Include name, role, and contact info
- Add avatar images when available
- Include social media links
- Group by department or role
- Show location for distributed teams

## Field Schema

| Property | Type | Description |
|----------|------|-------------|
| `title` | string | Contact name |
| `value` | string | Role or description |
| `role` | string | Job role/title |
| `email` | string | Email address |
| `phone` | string | Phone number |
| `avatar` | string | Avatar image URL |
| `department` | string | Department name |
| `location` | string | Office location |
| `linkedIn` | string | LinkedIn profile URL |
| `twitter` | string | Twitter handle |

## Examples

### Basic Contact Card

```typescript
const section: CardSection = {
  type: 'contact-card',
  title: 'Leadership Team',
  fields: [
    {
      title: 'Jane Doe',
      value: 'Chief Executive Officer',
      email: 'jane@company.com',
      phone: '+1 555-0100'
    }
  ]
};
```

### With Avatar and Socials

```typescript
const section: CardSection = {
  type: 'contact-card',
  title: 'Team',
  fields: [
    {
      title: 'John Smith',
      role: 'CTO',
      email: 'john@company.com',
      avatar: '/avatars/john.jpg',
      department: 'Engineering',
      location: 'San Francisco',
      linkedIn: 'https://linkedin.com/in/johnsmith'
    }
  ]
};
```

## Component Files

- `contact-card-section.component.ts` - Component logic and styles
- `contact-card-section.component.html` - Template
- `contact-card.definition.json` - Section metadata and schema
- `README.md` - This documentation


