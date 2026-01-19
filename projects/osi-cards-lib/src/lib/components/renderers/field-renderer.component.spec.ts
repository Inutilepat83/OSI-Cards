/**
 * Field Renderer Component Tests
 *
 * Unit tests for FieldRendererComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FieldRendererComponent, FieldData, FieldClickEvent } from './field-renderer.component';
import { By } from '@angular/platform-browser';

describe('FieldRendererComponent', () => {
  let component: FieldRendererComponent;
  let fixture: ComponentFixture<FieldRendererComponent>;

  const mockField: FieldData = {
    label: 'Email',
    value: 'test@example.com',
    type: 'email',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FieldRendererComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FieldRendererComponent);
    component = fixture.componentInstance;
    component.field = mockField;
  });

  describe('Basic Rendering', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render field label', () => {
      fixture.detectChanges();
      const label = fixture.debugElement.query(By.css('.field__label'));
      expect(label).toBeTruthy();
      expect(label.nativeElement.textContent.trim()).toContain('Email');
    });

    it('should render field value', () => {
      fixture.detectChanges();
      const value = fixture.debugElement.query(By.css('.field__value'));
      expect(value).toBeTruthy();
    });

    it('should render icon when provided', () => {
      component.field = { ...mockField, icon: '📧' };
      fixture.detectChanges();

      const icon = fixture.debugElement.query(By.css('.field__icon'));
      expect(icon).toBeTruthy();
    });

    it('should not render icon when not provided', () => {
      fixture.detectChanges();
      const icon = fixture.debugElement.query(By.css('.field__icon'));
      expect(icon).toBeFalsy();
    });
  });

  describe('Input Properties', () => {
    it('should accept field input', () => {
      expect(component.field).toEqual(mockField);
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
  });

  describe('Field Types', () => {
    it('should render URL field as link', () => {
      component.field = {
        label: 'Website',
        value: 'https://example.com',
        type: 'url',
      };
      fixture.detectChanges();

      const link = fixture.debugElement.query(By.css('a'));
      expect(link).toBeTruthy();
      expect(link.nativeElement.getAttribute('href')).toBe('https://example.com');
    });

    it('should render email field as mailto link', () => {
      component.field = {
        label: 'Email',
        value: 'test@example.com',
        type: 'email',
      };
      fixture.detectChanges();

      const link = fixture.debugElement.query(By.css('a'));
      expect(link).toBeTruthy();
      expect(link.nativeElement.getAttribute('href')).toContain('mailto:');
    });

    it('should render phone field as tel link', () => {
      component.field = {
        label: 'Phone',
        value: '123-456-7890',
        type: 'phone',
      };
      fixture.detectChanges();

      const link = fixture.debugElement.query(By.css('a'));
      expect(link).toBeTruthy();
      expect(link.nativeElement.getAttribute('href')).toBe('tel:123-456-7890');
    });

    it('should render boolean field with checkmark', () => {
      component.field = {
        label: 'Active',
        value: true,
        type: 'boolean',
      };
      fixture.detectChanges();

      const value = fixture.debugElement.query(By.css('.field__value'));
      expect(value.nativeElement.textContent).toContain('✓');
    });

    it('should render boolean field with cross when false', () => {
      component.field = {
        label: 'Active',
        value: false,
        type: 'boolean',
      };
      fixture.detectChanges();

      const value = fixture.debugElement.query(By.css('.field__value'));
      expect(value.nativeElement.textContent).toContain('✗');
    });
  });

  describe('Display Value Formatting', () => {
    it('should format currency values', () => {
      component.field = {
        label: 'Price',
        value: 1234.56,
        type: 'currency',
      };
      fixture.detectChanges();

      expect(component.displayValue).toContain('$');
      expect(component.displayValue).toContain('1,234.56');
    });

    it('should format percentage values', () => {
      component.field = {
        label: 'Growth',
        value: 25,
        type: 'percentage',
      };
      fixture.detectChanges();

      expect(component.displayValue).toBe('25%');
    });

    it('should format date values', () => {
      const date = new Date('2024-01-15');
      component.field = {
        label: 'Date',
        value: date.toISOString(),
        type: 'date',
      };
      fixture.detectChanges();

      expect(component.displayValue).toBeTruthy();
    });

    it('should format number values', () => {
      component.field = {
        label: 'Count',
        value: 1234567,
        type: 'number',
      };
      fixture.detectChanges();

      expect(component.displayValue).toContain(',');
    });

    it('should return dash for null values', () => {
      component.field = {
        label: 'Value',
        value: null,
      };
      fixture.detectChanges();

      expect(component.displayValue).toBe('-');
    });

    it('should return dash for undefined values', () => {
      component.field = {
        label: 'Value',
        value: undefined,
      };
      fixture.detectChanges();

      expect(component.displayValue).toBe('-');
    });
  });

  describe('Copy Functionality', () => {
    it('should render copy button when copyable is true', () => {
      component.field = { ...mockField, copyable: true };
      fixture.detectChanges();

      const copyButton = fixture.debugElement.query(By.css('.field__copy'));
      expect(copyButton).toBeTruthy();
    });

    it('should not render copy button when copyable is false', () => {
      component.field = { ...mockField, copyable: false };
      fixture.detectChanges();

      const copyButton = fixture.debugElement.query(By.css('.field__copy'));
      expect(copyButton).toBeFalsy();
    });

    it('should copy value to clipboard when copy button is clicked', async () => {
      component.field = { ...mockField, copyable: true };
      fixture.detectChanges();

      spyOn(navigator.clipboard, 'writeText');
      spyOn(component.copied, 'emit');

      const copyButton = fixture.debugElement.query(By.css('.field__copy'));
      const event = new MouseEvent('click', { bubbles: true });
      copyButton.nativeElement.dispatchEvent(event);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test@example.com');
      expect(component.copied.emit).toHaveBeenCalledWith('test@example.com');
    });

    it('should stop event propagation when copying', () => {
      component.field = { ...mockField, copyable: true };
      fixture.detectChanges();

      const copyButton = fixture.debugElement.query(By.css('.field__copy'));
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      spyOn(event, 'stopPropagation');

      copyButton.nativeElement.dispatchEvent(event);
      component.onCopy(event);

      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('Click Events', () => {
    it('should emit fieldClick when clickable and clicked', () => {
      component.clickable = true;
      fixture.detectChanges();

      spyOn(component.fieldClick, 'emit');
      component.onClick();

      expect(component.fieldClick.emit).toHaveBeenCalledWith({
        field: mockField,
        index: 0,
      });
    });

    it('should not emit fieldClick when not clickable', () => {
      component.clickable = false;
      fixture.detectChanges();

      spyOn(component.fieldClick, 'emit');
      component.onClick();

      expect(component.fieldClick.emit).not.toHaveBeenCalled();
    });

    it('should have clickable class when clickable is true', () => {
      component.clickable = true;
      fixture.detectChanges();

      const field = fixture.debugElement.query(By.css('.field'));
      expect(field.nativeElement.classList.contains('field--clickable')).toBe(true);
    });

    it('should have role button when clickable', () => {
      component.clickable = true;
      fixture.detectChanges();

      const field = fixture.debugElement.query(By.css('.field'));
      expect(field.nativeElement.getAttribute('role')).toBe('button');
    });

    it('should have tabindex when clickable', () => {
      component.clickable = true;
      fixture.detectChanges();

      const field = fixture.debugElement.query(By.css('.field'));
      expect(field.nativeElement.getAttribute('tabindex')).toBe('0');
    });
  });

  describe('getOutlookEmailUrl Method', () => {
    it('should return mailto URL', () => {
      const url = component.getOutlookEmailUrl('test@example.com');
      expect(url).toContain('mailto:');
      expect(url).toContain('test@example.com');
    });

    it('should handle email without special characters', () => {
      const url = component.getOutlookEmailUrl('user@domain.com');
      expect(url).toBe('mailto:user@domain.com');
    });
  });

  describe('stringValue Getter', () => {
    it('should convert value to string', () => {
      component.field = { label: 'Value', value: 123 };
      expect(component.stringValue).toBe('123');
    });

    it('should return empty string for null', () => {
      component.field = { label: 'Value', value: null };
      expect(component.stringValue).toBe('');
    });

    it('should return empty string for undefined', () => {
      component.field = { label: 'Value', value: undefined };
      expect(component.stringValue).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle field with only label', () => {
      component.field = { label: 'Label' };
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should handle very long field values', () => {
      component.field = {
        label: 'Long Value',
        value: 'A'.repeat(1000),
      };
      fixture.detectChanges();

      expect(component.stringValue.length).toBe(1000);
    });

    it('should handle special characters in values', () => {
      component.field = {
        label: 'Special',
        value: '<script>alert("xss")</script>',
      };
      fixture.detectChanges();

      expect(component.stringValue).toContain('<script>');
    });
  });
});
