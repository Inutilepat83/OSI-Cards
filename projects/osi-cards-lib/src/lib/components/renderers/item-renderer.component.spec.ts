/**
 * Item Renderer Component Tests
 *
 * Unit tests for ItemRendererComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItemRendererComponent, ItemData, ItemClickEvent } from './item-renderer.component';
import { By } from '@angular/platform-browser';

describe('ItemRendererComponent', () => {
  let component: ItemRendererComponent;
  let fixture: ComponentFixture<ItemRendererComponent>;

  const mockItem: ItemData = {
    id: 'item-1',
    title: 'Test Item',
    description: 'Test description',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemRendererComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemRendererComponent);
    component = fixture.componentInstance;
    component.item = mockItem;
  });

  describe('Basic Rendering', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render item title', () => {
      fixture.detectChanges();
      const title = fixture.debugElement.query(By.css('.item__title'));
      expect(title).toBeTruthy();
      expect(title.nativeElement.textContent.trim()).toBe('Test Item');
    });

    it('should render item description when provided', () => {
      fixture.detectChanges();
      const description = fixture.debugElement.query(By.css('.item__description'));
      expect(description).toBeTruthy();
      expect(description.nativeElement.textContent.trim()).toBe('Test description');
    });

    it('should not render description when not provided', () => {
      component.item = { title: 'Item' };
      fixture.detectChanges();
      const description = fixture.debugElement.query(By.css('.item__description'));
      expect(description).toBeFalsy();
    });
  });

  describe('Input Properties', () => {
    it('should accept item input', () => {
      expect(component.item).toEqual(mockItem);
    });

    it('should have default index value', () => {
      expect(component.index).toBe(0);
    });

    it('should accept custom index value', () => {
      component.index = 5;
      expect(component.index).toBe(5);
    });

    it('should have default clickable value', () => {
      expect(component.clickable).toBe(false);
    });

    it('should accept clickable input', () => {
      component.clickable = true;
      expect(component.clickable).toBe(true);
    });

    it('should have default compact value', () => {
      expect(component.compact).toBe(false);
    });

    it('should accept compact input', () => {
      component.compact = true;
      expect(component.compact).toBe(true);
    });

    it('should have default showIndex value', () => {
      expect(component.showIndex).toBe(false);
    });

    it('should accept showIndex input', () => {
      component.showIndex = true;
      expect(component.showIndex).toBe(true);
    });
  });

  describe('Icon and Image Rendering', () => {
    it('should render image when provided', () => {
      component.item = { ...mockItem, image: 'https://example.com/image.jpg' };
      fixture.detectChanges();

      const image = fixture.debugElement.query(By.css('.item__image img'));
      expect(image).toBeTruthy();
      expect(image.nativeElement.getAttribute('src')).toBe('https://example.com/image.jpg');
    });

    it('should render icon when image is not provided', () => {
      component.item = { ...mockItem, icon: '📦' };
      fixture.detectChanges();

      const icon = fixture.debugElement.query(By.css('.item__icon'));
      expect(icon).toBeTruthy();
    });

    it('should render index when neither image nor icon provided and showIndex is true', () => {
      component.item = { title: 'Item' };
      component.showIndex = true;
      component.index = 2;
      fixture.detectChanges();

      const index = fixture.debugElement.query(By.css('.item__index'));
      expect(index).toBeTruthy();
      expect(index.nativeElement.textContent.trim()).toBe('3');
    });

    it('should prioritize image over icon', () => {
      component.item = {
        ...mockItem,
        image: 'https://example.com/image.jpg',
        icon: '📦',
      };
      fixture.detectChanges();

      const image = fixture.debugElement.query(By.css('.item__image'));
      const icon = fixture.debugElement.query(By.css('.item__icon'));
      expect(image).toBeTruthy();
      expect(icon).toBeFalsy();
    });
  });

  describe('Badge Rendering', () => {
    it('should render badge when provided', () => {
      component.item = { ...mockItem, badge: 'New' };
      fixture.detectChanges();

      const badge = fixture.debugElement.query(By.css('.item__badge'));
      expect(badge).toBeTruthy();
      expect(badge.nativeElement.textContent.trim()).toBe('New');
    });

    it('should apply badge color when provided', () => {
      component.item = { ...mockItem, badge: 'New', badgeColor: '#ff0000' };
      fixture.detectChanges();

      const badge = fixture.debugElement.query(By.css('.item__badge'));
      expect(badge.nativeElement.style.backgroundColor).toBe('rgb(255, 0, 0)');
    });

    it('should not render badge when not provided', () => {
      fixture.detectChanges();
      const badge = fixture.debugElement.query(By.css('.item__badge'));
      expect(badge).toBeFalsy();
    });
  });

  describe('Value Rendering', () => {
    it('should render value when provided', () => {
      component.item = { ...mockItem, value: '$100' };
      fixture.detectChanges();

      const value = fixture.debugElement.query(By.css('.item__value'));
      expect(value).toBeTruthy();
      expect(value.nativeElement.textContent.trim()).toBe('$100');
    });

    it('should render numeric value', () => {
      component.item = { ...mockItem, value: 42 };
      fixture.detectChanges();

      const value = fixture.debugElement.query(By.css('.item__value'));
      expect(value.nativeElement.textContent.trim()).toBe('42');
    });

    it('should not render value when not provided', () => {
      fixture.detectChanges();
      const value = fixture.debugElement.query(By.css('.item__value'));
      expect(value).toBeFalsy();
    });
  });

  describe('Click Events', () => {
    it('should emit itemClick when clickable and clicked', () => {
      component.clickable = true;
      fixture.detectChanges();

      spyOn(component.itemClick, 'emit');
      component.onClick();

      expect(component.itemClick.emit).toHaveBeenCalledWith({
        item: mockItem,
        index: 0,
      });
    });

    it('should emit itemClick when item has URL', () => {
      component.item = { ...mockItem, url: 'https://example.com' };
      fixture.detectChanges();

      spyOn(component.itemClick, 'emit');
      spyOn(window, 'open');
      component.onClick();

      expect(window.open).toHaveBeenCalledWith('https://example.com', '_blank');
      expect(component.itemClick.emit).toHaveBeenCalled();
    });

    it('should not emit itemClick when not clickable and no URL', () => {
      component.clickable = false;
      component.item = { title: 'Item' };
      fixture.detectChanges();

      spyOn(component.itemClick, 'emit');
      component.onClick();

      expect(component.itemClick.emit).not.toHaveBeenCalled();
    });

    it('should have clickable class when clickable is true', () => {
      component.clickable = true;
      fixture.detectChanges();

      const item = fixture.debugElement.query(By.css('.item'));
      expect(item.nativeElement.classList.contains('item--clickable')).toBe(true);
    });

    it('should have role button when clickable', () => {
      component.clickable = true;
      fixture.detectChanges();

      const item = fixture.debugElement.query(By.css('.item'));
      expect(item.nativeElement.getAttribute('role')).toBe('button');
    });
  });

  describe('Compact Mode', () => {
    it('should apply compact class when compact is true', () => {
      component.compact = true;
      fixture.detectChanges();

      const item = fixture.debugElement.query(By.css('.item'));
      expect(item.nativeElement.classList.contains('item--compact')).toBe(true);
    });

    it('should hide description in compact mode', () => {
      component.compact = true;
      component.item = { ...mockItem, description: 'Description' };
      fixture.detectChanges();

      const description = fixture.debugElement.query(By.css('.item__description'));
      expect(description).toBeFalsy();
    });
  });

  describe('Arrow Rendering', () => {
    it('should render arrow when clickable', () => {
      component.clickable = true;
      fixture.detectChanges();

      const arrow = fixture.debugElement.query(By.css('.item__arrow'));
      expect(arrow).toBeTruthy();
    });

    it('should render arrow when item has URL', () => {
      component.item = { ...mockItem, url: 'https://example.com' };
      fixture.detectChanges();

      const arrow = fixture.debugElement.query(By.css('.item__arrow'));
      expect(arrow).toBeTruthy();
    });

    it('should not render arrow when not clickable and no URL', () => {
      component.clickable = false;
      component.item = { title: 'Item' };
      fixture.detectChanges();

      const arrow = fixture.debugElement.query(By.css('.item__arrow'));
      expect(arrow).toBeFalsy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle item with only title', () => {
      component.item = { title: 'Minimal Item' };
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should handle item without id', () => {
      component.item = { title: 'Item without ID' };
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should handle very long titles', () => {
      component.item = { title: 'A'.repeat(200) };
      fixture.detectChanges();

      const title = fixture.debugElement.query(By.css('.item__title'));
      expect(title).toBeTruthy();
    });

    it('should handle item with metadata', () => {
      component.item = {
        ...mockItem,
        metadata: { key: 'value' },
      };
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });
  });
});
