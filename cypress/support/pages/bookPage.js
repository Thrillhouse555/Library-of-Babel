class BookPage {

    title = 'h3';
    bookText = '#textblock'
    pageTest = '/book.cgi?0-w1-s1-v01:1'

    visitTest() {
      cy.visit(this.pageTest);
      cy.task('logToTerminal', `Page number: ${this.pageTest}`);
    }

    visitBookmark(fixtureName) {
      cy.getBookmark(fixtureName).then((url) => {
        cy.visit(url);
        cy.task('logToTerminal', `Page number ${url}`);
      });
    }
  
    checkTitle(text) {
        cy.get(this.title).contains(text);
        cy.task('logToTerminal', `Book title text contained ${text}`);
    }
  
    checkBookText(text) {
        cy.get(this.bookText).contains(text);
        cy.task('logToTerminal', `Book page text contained ${text}`);
    }

    checkFixtureAndLogBookmark (fixtureName) {
      const bookmarkApiUrl = Cypress.env('BOOKMARK_API_URL') || 'https://georgeansell.co.uk/bookmark';
      cy.fixture(fixtureName).then((data) => {
        this.checkBookText(data.text);
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
    }

    savePageData() {
      cy.fixture('pageData').then((data) => {
        if (!data.pages) {
          data.pages = [];
        }
        cy.get(this.bookText).then(($el) => {
          const pageText = $el.text();
          cy.url().then((currentUrl) => {
            data.pages.push({
              url: currentUrl,
              text: pageText
            });
            cy.writeFile(`cypress/fixtures/pageData.json`, data);
          });
        });
      });
    }

    clearPageData() {
      const emptyData = { pages: [] };
      cy.writeFile('cypress/fixtures/pageData.json', emptyData);
      cy.task('logToTerminal', 'Cleared pageData.json fixture');
    }

    saveBookmark(text) {
     const bookmarkApiUrl = Cypress.env('BOOKMARK_API_URL') || 'https://georgeansell.co.uk/bookmark';
     cy.fixture('pageData').then((pages) => {
          cy.request('POST', bookmarkApiUrl, {
            booktext: text,
            url: currentURL
          }).then((response) => {
            expect(response.status).to.eq(201);
            cy.task('logToTerminal', `Bookmark logged with ID: ${response.body.id}`);
          });
        });
    }


  }
  
  export default new BookPage();
  