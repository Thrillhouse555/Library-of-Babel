import BookPage from '../../support/pages/bookPage';

describe('basic search', () => {

    beforeEach(() => {
        BookPage.visitBookmark('bookmark.json');
    });

    afterEach(() => {
        cy.updateBookmark('bookmark.json');
        cy.saveBookmarkAPI('bookmark.json');
    });

  it.only('save page data', () => {
      BookPage.savePageData();
  });

})