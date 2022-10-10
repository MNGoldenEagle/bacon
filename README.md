# Bacon - A Bacon Number Seeker

Ever wondered what the [Bacon Number](https://en.wikipedia.org/wiki/Bacon_Number) for Ewan McGregor is?  How about the founder of C++?  Or the ancient Egyptian chancellor, Imhotep?  This small program attempts to answer those questions by using Wikipedia to dive as deeply as possible until it's able to find [Kevin Bacon](https://en.wikipedia.org/wiki/Kevin_Bacon).

## Installation

This program is written in [NodeJS](https://nodejs.org) and utilizes NPM for package management.  Please install both beforehand using the preferred installation method for your platform and then install the modules required for this program by doing:

```bash
npm install
```

This will install all package dependencies needed in order to build and run the program.

## Compiling

Because the application is written in TypeScript, some compilation is needed first before it's able to be run by the interpreter.  You can run the compiler either through the default TypeScript task in Visual Studio Code, or by running the following:

```bash
npx tsc -p ./tsconfig.json
```

Once built, you can run the program by executing:
```bash
npm run start <arguments>
```

## Running the Program

The program accepts the following arguments:

`<starting topic> [--debug]`

* **starting topic** - The topic URL or name to find the Bacon Number for.
* **-d | --debug** - Shows debugging output.  Can be useful to monitor the progress of the application.

Because of the nature of the Bacon Number, the number of Wikipedia topics that need to be explored can grow near exponentially the higher the eventual Bacon Number ends up being.  Although the program is not strictly capped in terms of how far it will search, it does have some limitations.  In particular, it could run out of memory while attempting to search, or it could take an infeasible amount of time to scan all the pages at its current depth level.
