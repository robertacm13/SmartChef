describe('Recipe Generator (no-login)', () => {
  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('authToken', 'cypress-token');
        win.localStorage.setItem('userEmail', 'testuser@example.com');

        const originalFetch = win.fetch.bind(win);
        win.fetch = (input, init) => {
          const url = typeof input === 'string' ? input : input.url;
          if (url && url.includes('/generate_recipes')) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({
                status: 'success',
                recipes: [
                  { name: 'Tomato Pasta', recipe: '1. Boil pasta. 2. Add sauce.', missing_ingredients: ['basil'] }
                ]
              })
            });
          }
          return originalFetch(input, init);
        };
      }
    });
  });

  it('navigates to Recipe Generator and generates recipes (mocked)', () => {
    cy.contains('🍳 Recipe Generator').click();
    cy.contains('🍳 Recipe Generator').should('be.visible');

    cy.get('textarea[placeholder="Enter ingredients separated by commas (e.g., eggs, tomato, cheese, pasta)"]').type('tomato, pasta');
    cy.contains('button', '✨ Generate Recipes').click();

    cy.contains('Tomato Pasta', { timeout: 8000 }).should('be.visible');

    cy.contains('Tomato Pasta').should('be.visible');
    cy.contains('Tomato Pasta').click();
    cy.contains('Missing Ingredients').should('be.visible');
    cy.contains('basil').should('be.visible');
  });
});
