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

### Warning on subGraph property
in order to facilitate navigation in different graphs , Souslesens introduces  the consept of "subGraph". subGraph defines a subset of a Neo4j database by adding a properties on all nodes of the subset of the graph (it is a kind ofa partition of the global graph)  . to add this attribute to your database (or a subset) you just need to run this cypher command in neo4j console :

      Match (n)  [where xxx] set n.subGraph="mySubGraph"
      
 and to work with this subGraph in souslesens you specify the subGraph name in the url 
 
 http://localhost:3002/toutlesens/?subGraph=mySubGraph
      
  
### Installing
1. download Souslesesens, unzip it and rename it as you want.
2. install  Node.js dependencies:
 -open a command line and move to the root directory of toutlesens where the package.json file is located.
 -run command : **npm install --save**
3. configure  url and login/password for neo4j :edit file ./bin/serverParams and modify neo4jUrl value  neo4jUrl: 'http://neo4j:souslesens@127.0.0.1:7474' (here "neo4j" is the login and "souslesens" is the password of your Neo4j database)
4. click on **souslesens.bat** (Windows) : this command does **node ./bin/www**
5. browse to http:/localhost:3002/toutlesens 
  - 3002 is the default port, you can change it in ./bin/www file
  -the first time you load a subGraph souslesens creates a schema (/schema/subGraphName.json). Edit this file to configure graphe appearence, specifically the fields "defaultNodeNameProperty": "name" . This field sets the neo4j property used to name the nodes in souslesens. You can also set a property "isName:1" on each object discribing the nodes properties .
  
  example :
  "properties": {
        "labelName": {
            "propertyName": {
                "type": "text",
                **iName:1**
            }...
  You can also set node colors and icons in this file
  
6. you can manage node and app startup using [PM2] (http://pm2.keymetrics.io/)


## Contributing


## Versioning
version 2.0.1
## Authors
[Claude Fauconnet] (mailto:claude.fauconnet@neuf.fr)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments
 Jean-François Meuriot
