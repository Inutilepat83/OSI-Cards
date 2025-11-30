# MagneticTiltService

3D tilt effect for card interactions.

## Overview

`MagneticTiltService` provides magnetic hover and tilt effects for cards.

## Import

```typescript
import { MagneticTiltService } from 'osi-cards-lib';
```

## Methods

### attach(element, options?)

Attach tilt effect to element.

```typescript
tiltService.attach(cardElement, {
  maxTilt: 10,
  scale: 1.02,
  speed: 300
});
```

### detach(element)

Remove tilt effect from element.

### setEnabled(enabled)

Enable/disable all tilt effects.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxTilt` | number | 15 | Maximum tilt angle |
| `scale` | number | 1 | Scale on hover |
| `speed` | number | 400 | Transition speed (ms) |
| `glare` | boolean | false | Enable glare effect |
| `perspective` | number | 1000 | 3D perspective |

## Usage in Component

```typescript
@Component({...})
export class CardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('card') cardRef: ElementRef;
  private tiltService = inject(MagneticTiltService);
  
  ngAfterViewInit() {
    this.tiltService.attach(this.cardRef.nativeElement, {
      maxTilt: 8,
      scale: 1.01
    });
  }
  
  ngOnDestroy() {
    this.tiltService.detach(this.cardRef.nativeElement);
  }
}
```
