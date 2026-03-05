import BookPage from '../../support/pages/bookPage';

describe('updated tests', () => {

  beforeEach(() => {
    BookPage.visitTest();
});

  it('check book title', () => {
    BookPage.checkTitle('tig')
  })

  it.only('save page data', () => {
    BookPage.savePageData();
  });

  it.only('delete page data', () => {
    BookPage.clearPageData();
  });

})