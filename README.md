# Souslesens



## This location is obsolete, Souslesens is now available at https://github.com/souslesens

This version is obsolete


Souslesens is a tool to visualize and manipulate graphs. It is based on Neo4j,Visjs and Nodejs
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
      
  


## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details


