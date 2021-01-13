# %%
import numpy as np
import pandas as pd
from igraph import Graph
from itertools import combinations
from collections import Counter
from functools import reduce
import json

graph = Graph.Read_Ncol("data/gov_to_gov/edges.txt")
start_vertex = "cdc.gov"
start_sensitivity = 0.75


def labeled_pagerank(graph):
    result = zip(graph.vs["name"], graph.pagerank())
    return Counter(dict(result))


original_pagerank = labeled_pagerank(graph)
rankings = {
    page: rank + 1 for rank, (page, score) in enumerate(original_pagerank.most_common())
}


def base_normalize(sub, orig, sensitivity=0.75):
    return sub / (orig ** sensitivity)


def relative_pagerank(subgraph, normalize=base_normalize, sensitivity=0.75):
    subgraph_pagerank = labeled_pagerank(subgraph)
    # for each vertex v, normalize it's subgraph pagerank by its original pagerank
    # according to the normalization function
    return Counter(
        {
            v: normalize(subgraph_pagerank[v], original_pagerank[v], sensitivity)
            for v in subgraph_pagerank.keys()
        }
    )


def get_adjacent_subgraph(vertex, mode="ALL", include_self=False):
    vertex_id = graph.vs.find(name=vertex).index
    adjacent_vertices = graph.neighbors(vertex, mode=mode)
    if not include_self:
        proper_adjacents = [v for v in adjacent_vertices if v != vertex_id]
        return graph.subgraph(proper_adjacents)
    else:
        adjacent_vertices.append(vertex_id)
        return graph.subgraph(adjacent_vertices)


def adjacent_pagerank(vertex, mode="ALL", normalize=base_normalize, sensitivity=0.75):
    subgraph = get_adjacent_subgraph(vertex, mode=mode)
    return relative_pagerank(subgraph, normalize=normalize, sensitivity=sensitivity)


def get_processed_pagerank(
    vertex, mode="ALL", n=10, normalize=base_normalize, sensitivity=0.75
):
    vertex_ranks = adjacent_pagerank(
        vertex, mode=mode, normalize=normalize, sensitivity=sensitivity
    ).most_common(n)
    vertices, scores = zip(*vertex_ranks)
    scores = divide_by_max(scores)
    return list(vertices), list(scores)


def cocitation(g, vertices):
    A = np.array(g.get_adjacency().data)
    v_ids = [g.vs.find(name=v).index for v in vertices]
    return {
        (g.vs[i]["name"], g.vs[j]["name"]): A[i] @ A[j]
        for i, j in combinations(v_ids, 2)
    }


def biblio(g, vertices):
    A = np.array(g.get_adjacency().data)
    v_ids = [g.vs.find(name=v).index for v in vertices]
    return {
        (g.vs[i]["name"], g.vs[j]["name"]): A[:, i] @ A[:, j]
        for i, j in combinations(v_ids, 2)
    }


def get_hyperlink(website):
    return f"<a href='https://www.{website}'> {website}</a>"


def divide_by_max(X):
    A = np.array(list(X))
    m = np.max(A)
    A = 1 / m * A
    return A


def list_concat(lists):
    return reduce(lambda a, b: a + b, lists, [])


def get_top_edges_for_vertex(v, edge_weights):
    vertex_edge_weights = Counter(
        {edge: weight for edge, weight in edge_weights.items() if v in edge}
    )
    top_edges_for_vertex = [edge for edge, weight in vertex_edge_weights.most_common(2)]
    return top_edges_for_vertex


def get_subgraph_edge_weights(vertex, adjacent_subgraph, subgraph_vertices, mode):
    all_edge_weights = biblio(adjacent_subgraph, subgraph_vertices + [vertex])
    adjacent_edge_weights = {
        edge: max(weight, 0.1)
        for edge, weight in all_edge_weights.items()
        if vertex in edge
    }
    local_edge_weights = {
        edge: weight for edge, weight in all_edge_weights.items() if vertex not in edge
    }
    top_local_edges = list_concat(
        get_top_edges_for_vertex(v, local_edge_weights) for v in subgraph_vertices
    )
    top_local_edge_weights = {
        edge: max(weight, 0.1)
        for edge, weight in local_edge_weights.items()
        if edge in top_local_edges
    }
    return top_local_edge_weights, adjacent_edge_weights


def get_normalized_edge_weights(local_edge_weights, adjacent_edge_weights):
    edge_weights = {**local_edge_weights, **adjacent_edge_weights}
    m = max(edge_weights.values())
    normalized_edge_weights = {
        edge: weight / m for edge, weight in edge_weights.items()
    }
    return normalized_edge_weights
