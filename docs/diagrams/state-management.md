# State Management Diagram

This document describes the NgRx state management architecture using Mermaid diagrams.

## State Structure

```mermaid
classDiagram
    class AppState {
        +cards: CardsState
    }
    
    class CardsState {
        +ids: string[]
        +entities: Dictionary~AICardConfig~
        +currentCardId: string | null
        +cardType: CardType
        +cardVariant: number
        +jsonInput: string
        +isGenerating: boolean
        +isFullscreen: boolean
        +error: string | null
        +loading: boolean
        +lastChangeType: CardChangeType
    }
    
    AppState *-- CardsState
```

## Action Flow

```mermaid
graph LR
    A[Component] -->|Dispatch| B[Action]
    B --> C[Effect]
    C --> D[Service]
    D --> E[API/Provider]
    E -->|Success| F[Success Action]
    E -->|Error| G[Failure Action]
    F --> H[Reducer]
    G --> H
    H --> I[New State]
    I --> J[Selector]
    J --> K[Component]
```

## Selector Hierarchy

```mermaid
graph TD
    A[selectCardsState] --> B[selectCurrentCard]
    A --> C[selectCards]
    A --> D[selectFilteredCards]
    A --> E[selectSortedCards]
    A --> F[selectCardsByType]
    A --> G[selectCardsByTypeCount]
    
    C --> D
    C --> E
    C --> F
    F --> G
```

## Effects Flow

```mermaid
sequenceDiagram
    participant Component
    participant Action
    participant Effect
    participant Service
    participant API
    participant Reducer

    Component->>Action: Dispatch loadCards
    Action->>Effect: Intercept
    Effect->>Service: getAllCards()
    Service->>API: HTTP Request
    API-->>Service: Response
    Service-->>Effect: Observable
    Effect->>Action: Dispatch loadCardsSuccess
    Action->>Reducer: Process
    Reducer-->>Component: New State
```

## Meta-Reducers

```mermaid
graph TD
    A[Action] --> B[localStorageSyncReducer]
    B --> C[Reducer]
    C --> D[New State]
    D --> E[Save to localStorage]
    
    F[App Init] --> G[rehydrateState]
    G --> H[Load from localStorage]
    H --> I[Initial State]
```







