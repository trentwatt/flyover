# Flyover

Exploring Networks from Above

![preview](/assets/flyover.gif)

For detailed overview, (incl reasoning) see [the writeup](https://logspace.io/projects/flyover)

## Specifics

Generates a Map as you survey dense graph datasets.

Whenever you click on a vertex, it expands the map with the next two vertices (you can click multiple times) with the highest score for the subgraph of vertices with edges to the vertex AND the subgraph of vertices with edges from the vertex, where

![eqn](/assets/eqn.png)

and sensitivity is a number between 0 and 1 (calibrated in the UI).  

Whenever you change the sensitivity, it replaces each parent vertex’s `n` childless children with the `n` with the highest score relative to said parent for the new sensitivity. Any vertices with children remain. In the interface, sensitivity is labeled with α and interpreted as altitude for reasons explained in the writeup.

## Running locally

`git clone https://github.com/trentwatt/flyover`

then

`cd api`  
`python3 -m venv .venv`  
`source .venv/bin/activate`  
`pip install -r -requirements.txt`  
`uvicorn main:app --reload`  

take note of url  
open `/client/src/config.js`    
change the line `export const baseUrl = ...` to reflect the url you noted

new terminal session:
`cd client`  
`npm init`  
`npm i`  
`npm start`  

## Configurating

To make this work with an alternative common crawl subgraph, the following steps are before you:

- Swap out the edgelist in /api/data/edges.txt with an edgelist of your choosing
- Make the appropriate modifications to /client/src/config.js
  - change base url
  - change start node
  - change display text for nodes

To make it work with a non-common crawl dataset, the main difference will be that the vertices are not websites. The sidebar generates an iframe preview of the sites, which doesn't make sense for non-website vertices. Best to comment out the iframe in `/client/src/components/Sidebar.js`, or replace with suitable alternative.
