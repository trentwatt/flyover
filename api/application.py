# %%
import aiohttp
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
pagerank_rankings = {
    vertex: i + i for i, (vertex, _) in enumerate(original_pagerank.items())
}
num_vertices_in_original = len(original_pagerank)
# %%


def get_subgraph_data(vertex, mode="ALL"):
    subgraph = get_adjacent_subgraph(vertex, mode=mode)
    num_vertices = len(subgraph.vs)

    subgraph_pageranks = labeled_pagerank(subgraph)
    return {
        "num_vertices": num_vertices,
        "subgraph_pageranks": subgraph_pageranks,
    }


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
def get_node_data(node):
    incoming = get_subgraph_data(node, mode="IN")
    outgoing = get_subgraph_data(node, mode="OUT")
    pagerank_in_original = {
        "rank": pagerank_rankings[node],
        "total": num_vertices_in_original,
    }
    return {
        "node": node,
        "pagerank_in_original": pagerank_in_original,
        "incoming": incoming,
        "outgoing": outgoing,
    }


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


async def fetch(session, url):
    async with session.get(url, headers={"User-Agent": user_agent}) as response:
        return await response.text()


@app.get("/proxy/{site}")
async def get_proxied_site(site):
    async with aiohttp.ClientSession() as session:
        try:
            html = await fetch(session, f"http://{site}")
            html_content = (
                html.strip()
                .replace('href="/', f'href="https://{site}/ ')  # target="_blank"
                .replace('src="/', f'src="https://{site}/')
                .replace("url('/", f"url('https://{site}/")
                .replace("url('../", f"url('https://{site}/..")
                .replace("'/", f"'/{site}")
            )
            with open("h.html", "w") as f:
                f.write(html_content)
            return HTMLResponse(content=html_content, status_code=200)
        except:
            return HTMLResponse(
                content="<h2>Unable to retrieve preview</h2>", status_code=200
            )


# %%
