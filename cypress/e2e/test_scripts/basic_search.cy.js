import BookPage from '../../support/pages/bookPage';

describe('basic search', () => {

    beforeEach(() => {
        BookPage.visitBookmark('bookmark.json');
    });

    afterEach(() => {
        cy.updateBookmark('bookmark.json');
    });

  it('check book text', () => {
    BookPage.checkFixtureAndLogBookmark('bookText')
  });

})