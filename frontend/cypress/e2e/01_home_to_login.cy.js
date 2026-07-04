describe('Home to login navigation', () => {
  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.clear();
      },
    });
  });

  it('navigates from the home page to the login page', () => {
    cy.contains('button', 'Log In').click();

    cy.contains('Welcome Back').should('be.visible');
    cy.contains('Sign in to your SmartChef account').should('be.visible');
    cy.contains('button', 'Sign In').should('be.visible');
  });
});

