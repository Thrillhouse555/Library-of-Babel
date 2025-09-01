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
      cy.fixture(fixtureName).then((data) => {
        this.checkBookText(data.text);
        cy.url().then((currentURL) => {
          cy.request('POST', 'http://172.236.28.233:3000/bookmark', {
            booktext: data.text,
            url: currentURL
          }).then((response) => {
            expect(response.status).to.eq(201);
            cy.task('logToTerminal', `Bookmark logged with ID: ${response.body.id}`);
          });
        });
      });
    }

  }
  
  export default new BookPage();
  