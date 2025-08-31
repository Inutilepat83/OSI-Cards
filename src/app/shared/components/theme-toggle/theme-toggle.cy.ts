import { ThemeToggleComponent } from './theme-toggle.component';

// Add mount to Cypress global
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof import('cypress/angular').mount;
    }
  }
}

describe('ThemeToggleComponent', () => {
  beforeEach(() => {
    cy.mount(ThemeToggleComponent, {
      componentProperties: {
        showDropdown: false,
      },
    });
  });

  it('should display the theme toggle button', () => {
    cy.get('.theme-toggle-btn').should('be.visible');
  });

  it('should have correct initial state', () => {
    cy.get('.theme-toggle-btn').should('not.have.class', 'dark');
  });

  it('should toggle theme when clicked', () => {
    cy.get('.theme-toggle-btn').click();
    // Verify theme change (would need theme service integration)
  });

  it('should show dropdown when showDropdown is true', () => {
    cy.mount(ThemeToggleComponent, {
      componentProperties: {
        showDropdown: true,
      },
    });

    cy.get('.theme-dropdown').should('be.visible');
  });

  it('should have proper accessibility attributes', () => {
    cy.get('.theme-toggle-btn').should('have.attr', 'aria-label');
  });
});
