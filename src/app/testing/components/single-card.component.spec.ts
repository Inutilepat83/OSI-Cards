import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideMockStore } from '@ngrx/store/testing';

import { SingleCardComponent } from '../../features/cards/components/single-card/single-card.component';
import { TestingUtilities, TestDataFactory } from '../testing-utilities';
import { MemoryManagementService } from '../../core/services/memory-management.service';
import { FeatureFlagService } from '../../core/services/feature-flag.service';

describe('SingleCardComponent', () => {
  let component: SingleCardComponent;
  let fixture: ComponentFixture<SingleCardComponent>;
  let memoryService: jasmine.SpyObj<MemoryManagementService>;
  let featureFlagService: jasmine.SpyObj<FeatureFlagService>;

  beforeEach(async () => {
    const memorySpy = jasmine.createSpyObj('MemoryManagementService', [
      'manageSubscription', 'cleanupComponent', 'getPooledObject', 'returnToPool', 'setCachedValue', 'getCachedValue'
    ]);
    const featureFlagSpy = jasmine.createSpyObj('FeatureFlagService', [
      'isEnabled', 'getFlag$'
    ]);

    await TestBed.configureTestingModule({
      imports: [SingleCardComponent, NoopAnimationsModule],
      providers: [
        provideMockStore({}),
        { provide: MemoryManagementService, useValue: memorySpy },
        { provide: FeatureFlagService, useValue: featureFlagSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SingleCardComponent);
    component = fixture.componentInstance;
    memoryService = TestBed.inject(MemoryManagementService) as jasmine.SpyObj<MemoryManagementService>;
    featureFlagService = TestBed.inject(FeatureFlagService) as jasmine.SpyObj<FeatureFlagService>;
  });

  afterEach(() => {
    TestingUtilities.mockLocalStorage().clear();
  });

  it('should create successfully and initialize basic observables', () => {
    expect(component).toBeTruthy();
    expect(component.card).toBeNull();
    expect(component.isLoading$).toBeDefined();
    expect(component.error$).toBeDefined();
  });

  it('should accept card assignment and handle null/card changes without error', () => {
    const testCard = TestDataFactory.createCard();

    component.card = testCard;
    fixture.detectChanges();

    expect(component.card).toEqual(testCard);

    component.card = null;
    expect(() => fixture.detectChanges()).not.toThrow();

    component.card = ({ id: 'incomplete' } as any);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('should use memory service for icon lookups via getFieldIconClass/getFieldIcon', () => {
    // Return a fixed value instead of executing the factory to avoid needing iconService
    memoryService.getPooledObject.and.returnValue('cached-icon');

    const iconClass = component.getFieldIconClass('email');
    const icon = component.getFieldIcon('email');

    expect(memoryService.getPooledObject).toHaveBeenCalledWith('iconClass', jasmine.any(Function));
    expect(memoryService.getPooledObject).toHaveBeenCalledWith('icon', jasmine.any(Function));
    expect(iconClass).toBe('cached-icon');
    expect(icon).toBe('cached-icon');
  });

  it('should have a working trackByFieldId implementation', () => {
    const f1 = { id: 'f1' } as any;
    const f2 = { id: 'f2' } as any;

    const track = component.trackByFieldId;
    expect(track(0, f1)).toBe('f1');
    expect(track(1, f2)).toBe('f2');
    expect(track(0, f1)).not.toBe(track(0, f2));
  });
});
