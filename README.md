# Host Agent

_Under construction_

## Artifact sorting

Artifact lists can be sorted by mined income or profit. Sorting is applied
after filtering and before pagination, so every page belongs to the globally
sorted result set.

```http
GET /api/artifacts?sort=income&order=desc&page=1&limit=20
GET /api/artifacts?sort=profit&order=asc&page=1&limit=20
GET /api/artifacts/by-flight/:flightId?sort=income&order=desc
```

`sort` accepts `income` or `profit`. `order` accepts `asc` or `desc` and
defaults to `desc` when sorting is requested. Unsupported values return HTTP 400. Artifacts without a finite value for the selected field are placed last
in either direction.
