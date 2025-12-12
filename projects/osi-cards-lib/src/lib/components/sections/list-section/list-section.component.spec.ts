import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ListSectionComponent } from './list-section.component';

describe('ListSectionComponent', () => {
  let fixture: ComponentFixture<ListSectionComponent>;
  let component: ListSectionComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ListSectionComponent);
    component = fixture.componentInstance;
    component.section = {
      type: 'list',
      title: 'List',
      items: [
        { title: 'Item 1', description: 'Desc 1' },
        { title: 'Item 2', description: 'Desc 2' },
      ],
    } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle expandedIndex on click', () => {
    const items = fixture.debugElement.queryAll(By.css('.list-item'));
    expect(items.length).toBe(2);

    items[0]?.nativeElement.click();
    fixture.detectChanges();
    expect(component.expandedIndex).toBe(0);

    items[0]?.nativeElement.click();
    fixture.detectChanges();
    expect(component.expandedIndex).toBeNull();
  });

  it('should toggle expandedIndex on Enter/Space', () => {
    const items = fixture.debugElement.queryAll(By.css('.list-item'));
    const first = items[0];
    expect(first).toBeTruthy();

    first!.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(component.expandedIndex).toBe(0);

    first!.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: ' ' }));
    fixture.detectChanges();
    expect(component.expandedIndex).toBeNull();
  });
});

