Cypress.Commands.add('updateBookmark', (fixtureName) => {
  const maxPages = 410;
  const maxVolumes = 32;
  const maxShelves = 5;
  const maxWalls = 4;

  cy.fixture(fixtureName).then((bookmark) => {
    let { hexagon, wall, shelf, volume, page } = bookmark;

    page++;
    if (page > maxPages) {
      page = 1;
      volume++;
      if (volume > maxVolumes) {
        volume = 1;
        shelf++;
        if (shelf > maxShelves) {
          shelf = 1;
          wall++;
          if (wall > maxWalls) {
            wall = 1;
            hexagon++;
          }
        }
      }
    }

    const updatedBookmark = { hexagon, wall, shelf, volume, page };
    cy.writeFile(`cypress/fixtures/${fixtureName}`, updatedBookmark);
  });
});

Cypress.Commands.add('getBookmark', (fixtureName) => {
  cy.fixture(fixtureName).then((bookmark) => {
    let { hexagon, wall, shelf, volume, page } = bookmark;
    const url = `https://libraryofbabel.info/book.cgi?${hexagon}-w${wall}-s${shelf}-v${String(volume).padStart(2, '0')}:${page}`;
    return url
  });
});
