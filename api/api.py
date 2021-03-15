# %%
from typing import Optional
from igraph import Graph
from collections import Counter
from fastapi import FastAPI
from pydantic import BaseModel  # pylint: disable=no-name-in-module
from fastapi.middleware.cors import CORSMiddleware
import requests
from fastapi.responses import HTMLResponse


app = FastAPI()

origins = [
    "http://10.0.0.81:3000",
    "http://localhost:3000",
    "http://localhost:1234",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:1234",
    "http://localhost",
    "http://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

graph = Graph.Read_Ncol("data/gov_to_gov/edges.txt")
start_vertex = "cdc.gov"
start_sensitivity = 0.75


def labeled_pagerank(graph):
    result = zip(graph.vs["name"], graph.pagerank())
    return dict(Counter(dict(result)).most_common())


original_pagerank = labeled_pagerank(graph)

# %%


def get_subgraph_pagerank(vertex, mode="ALL"):
    subgraph = get_adjacent_subgraph(vertex, mode=mode)
    return labeled_pagerank(subgraph)


def get_adjacent_subgraph(vertex, mode="ALL", include_self=False):
    vertex_id = graph.vs.find(name=vertex).index
    adjacent_vertices = graph.neighbors(vertex, mode=mode)
    if not include_self:
        proper_adjacents = [v for v in adjacent_vertices if v != vertex_id]
        return graph.subgraph(proper_adjacents)
    else:
        adjacent_vertices.append(vertex_id)
        return graph.subgraph(adjacent_vertices)


@app.get("/")
def get_original_pagerank():
    return original_pagerank


@app.get("/nodes/{node}")
def get_subgraph_data(node):
    incoming = get_subgraph_pagerank(node, mode="IN")
    outgoing = get_subgraph_pagerank(node, mode="OUT")
    return {"node": node, "incoming": incoming, "outgoing": outgoing}


# def base_normalize(sub, orig, sensitivity=0.75):
#     return sub / (orig ** sensitivity)


# def relative_pagerank(subgraph, normalize=base_normalize, sensitivity=0.75):
#     subgraph_pagerank = labeled_pagerank(subgraph)
#     # for each vertex v, normalize it's subgraph pagerank by its original pagerank
#     # according to the normalization function
#     return Counter(
#         {
#             v: normalize(subgraph_pagerank[v], original_pagerank[v], sensitivity)
#             for v in subgraph_pagerank.keys()
#         }
#     )

# def adjacent_pagerank(vertex, mode="ALL", normalize=base_normalize, sensitivity=0.75):
#     subgraph = get_adjacent_subgraph(vertex, mode=mode)
#     return relative_pagerank(subgraph, normalize=normalize, sensitivity=sensitivity)

user_agent = "Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B137 Safari/601.1"


@app.get("/proxy/{site}")
def get_proxied_site(site):
    r = requests.get(f"http://{site}", headers={"User-Agent": user_agent})
    html_content = r.text.strip()
    html_content = html_content.replace('href="/', f'href="https://{site}/')
    html_content = html_content.replace('src="/', f'src="https://{site}/')
    with open("h.html", "w") as f:
        f.write(html_content)

    return HTMLResponse(content=html_content, status_code=200)

