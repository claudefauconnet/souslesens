# Souslesens

Souslesens is a tool to visualize and manipulate graphs. It is based on Neo4j, D3js and Nodejs
- [example] (example.png)
- [demo] (http://vps254642.ovh.net/toutlesens/index.html?subGraph=hist-antiq)

## Getting Started

To run Souslesens you need to have  [Node.js](https://nodejs.org/en/) and  [Neo4j](https://neo4j.com/download/) working on you server server or laptop

### Prerequisites

- Node.js with npm
- Neo4j
- a browser that support D3.Js
- an access to internet to install Node dependencies
  
### Installing
1. download Souslesesens, unzip it and rename it as you want.
2. install  Node.js dependencies:
  1. open a command line and move to the root directory of toutlesens where the package.json file is located.
  2. run command : **npm install --save**
3. configure  url and login/password for neo4j 
  -edit file ./bin/serverParams and modify neo4jUrl value
4. click on **souslesens.bat** (Windows) : this command does **node ./bin/www**
5. browse to http:/localhost:3002/toutlesens 
  - 3002 is the default port, you can change it in ./bin/www file
6. you can manage node and app startup using [PM2] (http://pm2.keymetrics.io/)


## Contributing


## Versioning
version 1.0.0
## Authors
[Claude Fauconnet] (mailto:claude.fauconnet@neuf.fr)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments
 Jean-François Meuriot
