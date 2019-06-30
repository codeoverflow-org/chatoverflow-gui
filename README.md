# ChatOverflow GUI

This is the chat overflow web GUI. For more information about the chat overflow project, please visit [chatoverflow.org](http://chatoverflow.org).

## Technical details

This GUI is based on the [angular dashboard](https://github.com/CreativeIT/material-angular-dashboard) from CreativeIT. 
It relies on [Material IO](https://material.io/tools/icons/?icon=fiber_new&style=baseline) and Angular. The bindings to the chat overflow server are generated using OpenAPI and Swagger and are hosted on npm: https://www.npmjs.com/package/chatoverflow-api

## Status

The frontend is in active development right now and not yet finished. But there is a feature complete minimal version available, called "Better REPL". 
You can navigate to the this WIP-GUI trough the menu.

## Installation

Since this is a node project, you can build and run it like every other package using:

```
npm install
npm start
```

Then, start the framework and navigate to (default) [http://localhost:2400](http://localhost:2400).
