describe('OSI Cards Application', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display the main application', () => {
    cy.contains('OSI Cards').should('be.visible');
  });

  it('should navigate to cards page', () => {
    cy.contains('Cards').click();
    cy.url().should('include', '/cards');
  });

  it('should load cards successfully', () => {
    cy.visit('/cards');
    // Wait for cards to load
    cy.get('[data-cy="card-container"]', { timeout: 10000 }).should('be.visible');
  });
});
