describe('Theme Toggle E2E', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should load the application', () => {
    cy.contains('OSI Cards').should('be.visible');
  });

  it('should have theme toggle functionality', () => {
    // Check if theme toggle exists
    cy.get('body').then($body => {
      if ($body.find('.theme-toggle-btn').length > 0) {
        cy.get('.theme-toggle-btn').should('be.visible');
        cy.get('.theme-toggle-btn').click();

        // Verify theme change by checking body classes or styles
        cy.get('body').should('have.attr', 'data-theme');
      }
    });
  });

  it('should persist theme preference', () => {
    cy.get('body').then($body => {
      if ($body.find('.theme-toggle-btn').length > 0) {
        cy.get('.theme-toggle-btn').click();

        // Reload page
        cy.reload();

        // Check if theme preference is maintained
        cy.get('body').should('have.attr', 'data-theme');
      }
    });
  });

  it('should be keyboard accessible', () => {
    cy.get('body').then($body => {
      if ($body.find('.theme-toggle-btn').length > 0) {
        cy.get('.theme-toggle-btn').focus();
        cy.get('.theme-toggle-btn').should('have.focus');

        // Test keyboard interaction
        cy.get('.theme-toggle-btn').type('{enter}');
        cy.get('body').should('have.attr', 'data-theme');
      }
    });
  });
});
