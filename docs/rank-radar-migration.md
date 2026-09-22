# Rank Radar migration and downstream audit

Issue: [BWB03/datadive-adapter#3](https://github.com/BWB03/datadive-adapter/issues/3).
Reviewed September 22, 2026.

## Contract and verification status

The issue announces nested, paginated keyword details (20 keywords by default,
100 maximum) and removal of PPC/SQP fields. The published
[Data Dive OpenAPI documentation](https://developer.datadive.tools/docs#/)
(`swagger-external/swagger-ui-init.js`, inspected September 22) still describes
the legacy keyword detail array with no pagination parameters. Consequently,
the new `data.data` layout and `currentPage`, `total`, `hasNext`, and `pageSize`
names are based on the announcement plus Data Dive's existing paginated APIs.
They have fixture-based regression coverage, but need confirmation against the
live rollout. Legacy flat keyword responses remain accepted.

The same published spec confirms these dedicated GET endpoints:

- `/v1/niches/rank-radars/{rankRadarId}/ppc`: required `startDate` and `endDate`,
  optional `includeCampaigns` (default false), an array of per-keyword PPC rows.
- `/v1/niches/rank-radars/{rankRadarId}/sqp`: required `startDate` and `endDate`,
  an array of per-keyword SQP rows.

Metrics are retained as native Data Dive fields inside the universal envelope.
The old normalized ranking history already omitted `adData` and `sqpData`; its
shape is unchanged. Raw endpoint consumers that read those removed fields must
switch to the dedicated methods and join rows by keyword `id`.

No live API verification was performed because `DATADIVE_API_KEY` was not
configured in this workspace. Unit tests use mocked HTTP responses, including
multi-page results, short intermediate pages, empty results, legacy responses,
page-size bounds, malformed or stalled pagination, and later-page failures.
They also exercise the OpenClaw methods, MCP handlers, and tool manifest.

Before release, run `npm run test:integration` with a configured API key, and
verify a tracker with more than 20 keywords returns the complete keyword set.
Confirm the live pagination field names, both metric response shapes, and a PPC
request with `includeCampaigns: true`. Integration tests skip without a key.

## Downstream findings

### Helm: separate adapter copy requires migration

At commit `e7e1aafd2dd28c174e9998b2f0b50bcd9b30ce2f`,
[BWB03/helm's vendored adapter](https://github.com/BWB03/helm/blob/e7e1aafd2dd28c174e9998b2f0b50bcd9b30ce2f/packages/datadive-adapter/src/adapter/endpoints.ts)
still makes a single keyword-detail request in `getRankRadar()` and uses the
legacy response schema. This repository's update does not automatically update
that copy. Port the schemas, endpoint pagination, new metric readers, MCP and
OpenClaw surfaces, and regression tests before relying on Helm Rank Radar reads.

The inspected
[amazon-intelligence Data Dive datasource](https://github.com/BWB03/helm/blob/e7e1aafd2dd28c174e9998b2f0b50bcd9b30ce2f/packages/amazon-intelligence/src/datasources/datadive.ts)
uses niche keyword and competitor endpoints, not Rank Radar keyword detail.
Those calls are outside this specific breaking change.

### Keyword growth report: workflow dependency, no direct reader found

At commit `83a74a12613d7c7ffca6b3eb4b53538e67d468fd`, the reviewed scripts and
Markdown documents in
[BWB03/claude-mcp-keyword-growth-report](https://github.com/BWB03/claude-mcp-keyword-growth-report/tree/83a74a12613d7c7ffca6b3eb4b53538e67d468fd)
do not contain a direct Rank Radar HTTP client or adapter import. The playbook
and Claude project instructions recommend Data Dive/Rank Radar as the ranking
source. That workflow must use an updated installed MCP adapter (or updated Helm
copy); source changes here do not replace an already installed MCPB package.

This audit covers those two repositories' relevant sources. Neither downstream
repository was modified as part of this adapter change.
