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
    cy.fixture('smokeTest').then((book) => {
      BookPage.checkTitle(book.title)
      BookPage.checkBookText(book.text);
    })
  });



})