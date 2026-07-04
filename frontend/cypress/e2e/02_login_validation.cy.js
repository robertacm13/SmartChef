describe('Login validation', () => {
  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.clear();
      },
    });

    cy.contains('button', 'Log In').click();
    cy.contains('Welcome Back').should('be.visible');
  });

  it('shows validation errors when login fields are empty', () => {
    cy.contains('button', 'Sign In').click();

    cy.contains('Please fill in all fields!').should('be.visible');
  });

  it('shows email validation when email is invalid', () => {
    cy.get('input[placeholder="example@email.com"]').type('not-an-email');
    cy.get('input[placeholder="Enter password"]').type('Password1!');
    cy.get('input[placeholder="Code from Google Authenticator"]').type('123456');

    cy.contains('button', 'Sign In').click();

    cy.contains('Email address is not valid!').should('be.visible');
  });
});

