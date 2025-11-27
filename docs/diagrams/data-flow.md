# Data Flow Diagram

This document describes the data flow through the OSI Cards application using Mermaid diagrams.

## Complete Data Flow

```mermaid
sequenceDiagram
    participant User
    participant HomePage
    participant CardDataService
    participant JsonFileProvider
    participant NgRxStore
    participant AICardRenderer
    participant SectionRenderer
    participant SectionComponent
    participant MasonryGrid

    User->>HomePage: Input JSON / Select Type
    HomePage->>CardDataService: Request Cards
    CardDataService->>JsonFileProvider: Load Cards
    JsonFileProvider-->>CardDataService: Card Data
    CardDataService->>NgRxStore: Dispatch loadCardsSuccess
    NgRxStore-->>HomePage: Select Cards
    HomePage->>AICardRenderer: Pass Card Config
    AICardRenderer->>SectionRenderer: Render Sections
    SectionRenderer->>SectionComponent: Render Section
    SectionComponent-->>SectionRenderer: Section Rendered
    SectionRenderer->>MasonryGrid: Layout Sections
    MasonryGrid-->>User: Display Cards
```

## Streaming Data Flow

```mermaid
sequenceDiagram
    participant LLM
    participant HomePage
    participant StreamingChannel
    participant AICardRenderer
    participant SectionRenderer
    participant SectionComponent

    LLM->>HomePage: Stream JSON Chunks
    HomePage->>HomePage: Parse Partial JSON
    HomePage->>StreamingChannel: Emit Update
    StreamingChannel->>AICardRenderer: Update Card
    AICardRenderer->>SectionRenderer: Update Sections
    SectionRenderer->>SectionComponent: Update Fields/Items
    SectionComponent-->>User: Progressive Rendering
```

## State Management Flow

```mermaid
graph TD
    A[User Action] --> B[Component]
    B --> C[Action Dispatch]
    C --> D[NgRx Store]
    D --> E[Reducer]
    E --> F[New State]
    F --> G[Selector]
    G --> H[Component Update]
    H --> I[UI Update]
    
    J[Effect] --> D
    D --> K[Side Effect]
    K --> L[Service Call]
    L --> M[API/Provider]
    M --> N[Response]
    N --> O[Action Dispatch]
    O --> D
```

## Card Generation Flow

```mermaid
flowchart TD
    A[JSON Input] --> B{Valid JSON?}
    B -->|No| C[Show Error]
    B -->|Yes| D[Parse JSON]
    D --> E[Validate Structure]
    E --> F{Valid Card?}
    F -->|No| C
    F -->|Yes| G[Sanitize Config]
    G --> H[Ensure IDs]
    H --> I[Generate Card]
    I --> J[Update Store]
    J --> K[Render Card]
```







