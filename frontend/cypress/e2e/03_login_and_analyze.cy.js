describe('Login and analyze food flow', () => {
  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.clear();
      },
    });
  });

  it('logs in successfully and uploads an image for analysis', () => {
    cy.intercept('POST', '**/login', {statusCode: 200, body: { token: 'cypress-token' }, }).as('loginRequest');

    cy.contains('button', 'Log In').click();

    cy.get('input[placeholder="example@email.com"]').type('user@example.com');
    cy.get('input[placeholder="Enter password"]').type('Password1!');
    cy.get('input[placeholder="Code from Google Authenticator"]').type('123456');

    cy.clock();
    cy.contains('button', 'Sign In').click();
    cy.wait('@loginRequest').its('request.body').should('include', {email: 'user@example.com',password: 'Password1!',otp_code: '123456',    });
    cy.tick(2000);

    cy.contains('Dashboard Statistics', { timeout: 10000 }).should('be.visible');

    cy.intercept('GET', '**/analysis_history/*', {statusCode: 200, body: { status: 'success', analyses: [] },}).as('analysisHistory');
    cy.intercept('GET', '**/streak/*', {statusCode: 200, body: { status: 'success', current_streak: 0, longest_streak: 0 },}).as('streak');
    cy.intercept('GET', '**/user_goals/*', {statusCode: 200, body: { status: 'success', goals: null }, }).as('goals');
    cy.intercept('GET', '**/get_water_intake/*', {statusCode: 200, body: { status: 'success', total: 0 },}).as('water');
    cy.intercept('GET', '**/vitamin_advice/*', {statusCode: 200, body: { status: 'success', advice: 'Mock advice' }, }).as('vitamins');
    cy.intercept('GET', '**/suggest_meals/*', {statusCode: 200, body: { status: 'success', suggestions: [] }, }).as('suggestions');

    cy.contains('button', 'Analyze').click();
    cy.contains('Upload a Food Image', { timeout: 10000 }).should('be.visible');

    cy.intercept('POST', '**/analyze_food/', {
      statusCode: 200,
      body: {
        status: 'success',
        analysis_id: 'analysis-123',
        food_name: 'pizza',
        confidence: 97,
        ingredients: ['cheese', 'tomato'],
        nutrition: {
          total_nutrition: {
            calories: 338,
            protein: 19,
            carbs: 6,
            fats: 24.2,
          },
        },
      },
    }).as('analyzeFood');

    cy.get('#file-upload').selectFile('cypress/fixtures/food.svg', { force: true });
    cy.contains('button', 'Analyze Food').should('not.be.disabled').click();

    cy.wait('@analyzeFood');
    cy.contains('Analysis Results', { timeout: 10000 }).should('be.visible');
    cy.contains(/pizza/i).should('be.visible');
    cy.contains('Analysis saved to history!').should('be.visible');
  });
});
