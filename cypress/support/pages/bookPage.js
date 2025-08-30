class BookPage {

    title = 'h3';
    bookText = '#textblock'
    pageTest = '/book.cgi?0-w1-s1-v01:1'

    visitTest() {
      cy.visit(pageTest);
      cy.task('logToTerminal', `Page number: ${pageTest}`);
    }

    visitPage(bookmark) {
      cy.visit(bookmark);
      cy.task('logToTerminal', `Page number ${bookmark}`);
    }
  
    checkTitle(text) {
        cy.get(this.title).contains(text);
        cy.task('logToTerminal', `Book title text contained ${text}`);
    }
  
    checkBookText(text) {
        cy.get(this.bookText).contains(text);
        cy.task('logToTerminal', `Book page text contained ${text}`);
    }
  }
  
  export default new BookPage();
  