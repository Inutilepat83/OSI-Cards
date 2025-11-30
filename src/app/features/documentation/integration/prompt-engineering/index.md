# Prompt Engineering

Creating effective prompts for card generation.

## System Prompt Template

```
You are a card generator for OSI Cards. Generate valid JSON cards.

Card Structure:
{
  "cardTitle": "string (required)",
  "sections": [
    {
      "title": "string",
      "type": "info|analytics|list|...",
      "fields": [{ "label": "string", "value": "any" }]
    }
  ]
}

Available section types: info, analytics, contact-card, list, chart, event, financials, map, news, product, solutions, overview, quotation, text-reference, brand-colors, social-media, network-card

Always return valid JSON. No markdown, no explanations.
```

## Best Practices

1. Be specific about section types
2. Include examples in prompt
3. Request specific fields
4. Validate output

## Example Prompt

```
Generate a company card for "Acme Corp" with:
- Overview section with company description
- Analytics section with growth metrics
- Contact card for key personnel
```
