describe('Register flow', () => {
  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.clear();
      }
    });
    cy.contains('button', 'Sign Up').click();
    cy.contains('Create Account').should('be.visible');
  });

  it('shows validation when passwords do not match', () => {
    cy.get('input[placeholder="example@email.com"]').type('newuser@example.com');
    cy.get('input[placeholder="Minimum 8 characters"]').type('Password1!');
    cy.get('input[placeholder="Re-enter password"]').type('Different1!');
    cy.contains('button', 'Sign Up').click();
    cy.contains('Passwords do not match!').should('be.visible');
  });

  it('registers successfully and displays QR code (mocked)', () => {
    cy.intercept('POST', '**/register', {
      statusCode: 200,
      body: { otp_uri: 'otpauth://totp/SmartChef:test?secret=ABCDEF' }
    }).as('registerReq');

    cy.get('input[placeholder="example@email.com"]').type('newuser@example.com');
    cy.get('input[placeholder="Minimum 8 characters"]').type('Password1!');
    cy.get('input[placeholder="Re-enter password"]').type('Password1!');

    cy.contains('button', 'Sign Up').click();
    cy.wait('@registerReq').its('request.body').should('include', { email: 'newuser@example.com' });

    cy.contains('Account created successfully!').should('be.visible');
    cy.contains('Scan the QR code with Google Authenticator:').should('be.visible');
    cy.get('svg').should('exist');
    cy.contains('button', 'Sign In').click();
    cy.contains('Welcome Back').should('be.visible');
  });
});
