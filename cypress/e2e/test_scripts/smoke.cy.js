import BookPage from '../../support/pages/bookPage';

describe('basic tests', () => {

  beforeEach(() => {
    BookPage.visitTest();
});

  it('check book title', () => {
    BookPage.checkTitle('tig')
  })

  it('check book text', () => {
    BookPage.checkBookText('unqusiug');
  })

  it('check book title using fixtures', () => {
    cy.fixture('smokeTest').then((data) => {
      BookPage.checkTitle(data.title)
      BookPage.checkBookText(data.text);
    })
  });

  it('check bookmark is updated via command', () => {
    cy.updateBookmark('bookmarkTest.json');
  });

  it('post bookmark api request', () => {
    const bookmarkApiUrl = Cypress.env('BOOKMARK_API_URL') || 'https://georgeansell.co.uk/bookmark';
    cy.fixture('smokeTest').then((data) => {
      BookPage.checkBookText(data.text);
      cy.url().then((currentURL) => {
        cy.request('POST', bookmarkApiUrl, {
          booktext: data.text,
          url: currentURL
        }).then((response) => {
          expect(response.status).to.eq(201);
          cy.task('logToTerminal', `Bookmark logged with ID: ${response.body.id}`);
        });
      });
    });
  });

  it.only('post bookmark api request 2', () => {
    BookPage.checkFixtureAndLogBookmark('smokeTest.json')
  });

})