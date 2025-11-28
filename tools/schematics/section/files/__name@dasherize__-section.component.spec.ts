import { ComponentFixture, TestBed } from '@angular/core/testing';
import { <%= className %> } from './<%= name %>-section.component';
import { CardSection<% if (usesFields && !usesItems) { %>, CardField<% } else if (usesItems && !usesFields) { %>, CardItem<% } %> } from '../../../../../models';

describe('<%= className %>', () => {
  let component: <%= className %>;
  let fixture: ComponentFixture<<%= className %>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [<%= className %>]
    }).compileComponents();

    fixture = TestBed.createComponent(<%= className %>);
    component = fixture.componentInstance;
    
    // Initialize with test data
    component.section = {
      id: 'test-section',
      title: 'Test Section',
      type: '<%= type %>',
      <% if (usesFields && !usesItems) { %>
      fields: [
        { label: 'Test Field', value: 'Test Value' }
      ]
      <% } else if (usesItems && !usesFields) { %>
      items: [
        { title: 'Test Item', description: 'Test Description' }
      ]
      <% } %>
    } as CardSection;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display section title', () => {
    const titleElement = fixture.nativeElement.querySelector('.ai-section__title');
    expect(titleElement?.textContent.trim()).toBe('Test Section');
  });

  <% if (usesFields && !usesItems) { %>
  it('should display fields when available', () => {
    expect(component.hasFields).toBe(true);
    expect(component.fields.length).toBe(1);
  });

  it('should handle empty fields state', () => {
    component.section = {
      ...component.section,
      fields: []
    };
    fixture.detectChanges();
    expect(component.hasFields).toBe(false);
  });
  <% } %>

  <% if (usesItems && !usesFields) { %>
  it('should display items when available', () => {
    expect(component.hasItems).toBe(true);
    expect(component.items.length).toBe(1);
  });

  it('should handle empty items state', () => {
    component.section = {
      ...component.section,
      items: []
    };
    fixture.detectChanges();
    expect(component.hasItems).toBe(false);
  });
  <% } %>
});

