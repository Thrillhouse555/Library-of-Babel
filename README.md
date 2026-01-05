# Library-of-Babel

## Brief

Recently during a fishing trip a friend of mine told me about a short story he'd read called 'A Short Stay in Hell' and he couldn't stop thinking about it. It was about a man who after dying finds himself trapped in a hell which is filled with rows upon rows of books filled with gibberish. Known as the 'Libary of Babel' it's filled with every book that can be possibly written on 410 pages, with 40 lines and 80 characters on each page. The only way out of this hell is to find a book that exactly retells his earthly life story. 

The book fastinated me too, and I soon found myself thinking about the book all the time and recommending it to others to read. It's around this time my brother read the book from my recommendation, and told me that someone had made a Library of Babel online. A library where at present contains all possible pages of 3200 character in about 10^4677 books. That's a 1 followed by 4677 zeros. My brother excitedly told me about the forums online of people who had been searching.

I wondered if it would be possible to use my skills in test automation to find a book which would tell the story of my life. An impossible task, but how this passion project began, this is the story of my short stay in hell. 


## The Concept

My first thoughts is this could be a near impossible task, there was more books than atoms in the universe so building an automation suite which will search a book a second to find the story of my life was out of the question.

However finding something which wasn't gibberish, that could be something worth building.

The plan was to use **Cypress** as I knew cy.prompt was at beta stages and could be handy to use a LLM in finding languages in gibberish.
**Jenkins** would be used to run the tests in a continuous loop.
And any discovered books which contained anything valuable would be logged and saved to a **mySQL** database.

## Jenkins

Access to Jenkins is on http://georgeansell.co.uk:8080/ and user account details are below. The guest account access is read only and just for the purpose of demostrating the processes in action.

Username - guest   
Password - (on request)

## Cypress

A copy of my Cypress tests is saved in this repo.

They are simple tests to check if each page contains text which matches. For simplity I'm currently only searching for my name 'george' rather than the book of my life.

If a test is successful it will save the page by sending it's url string to my database via the API using cy.request.

If you'd like to see better examples of automation for testing using Cypress and other tools check out my portfolio demos.
https://github.com/stars/Thrillhouse555/lists/demos

## mySQL

The mySQL database can be viewed via an API I built and following this link it will show all the bookmarks logged which showed discovery of something which weren't gibberish.

[georgeansell.co.uk/bookmarks](https://georgeansell.co.uk/bookmarks.html)
