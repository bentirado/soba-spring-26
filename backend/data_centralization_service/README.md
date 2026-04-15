# Data Centralization Service

ETL pipeline that ingests disconnected museum data sources (JSON, Excel) and normalizes them into a shared canonical schema. Designed to run standalone via CLI or orchestrated by n8n over HTTP.

## Project Structure

```
data_centralization_service/
├── config.py              # Settings (paths, env vars)
├── main.py                # CLI entrypoint
├── schema.py              # CanonicalPayload, ExtractedDataset
├── api/
│   └── routes.py          # FastAPI endpoints called by n8n
├── pipeline/
│   ├── extractor.py       # Reads JSON + Excel from dummy_data/
│   ├── transformer.py     # Normalizes data into canonical schema
│   ├── loader.py          # Loader protocol + TerminalLoader
│   └── etl.py             # TransactionLayer + ETLPipeline orchestrator
└── n8n/
    ├── client.py           # n8n API client (stubbed)
    ├── workflow_deployer.py
    ├── workflow_registry.py
    └── workflows/
        ├── node_factory.py          # Reusable n8n node builders
        ├── manual/
        │   ├── mock_data_terminal_etl.py   # Terminal ETL workflow
        │   ├── nas_files_excel.py          # (stubbed)
        │   ├── nas_files_word.py           # (stubbed)
        │   └── volgistics_backfill.py      # (stubbed)
        └── automated/
            ├── data_quality_monitor.py     # (stubbed)
            ├── nas_file_watcher.py         # (stubbed)
            └── volgistics_watcher.py       # (stubbed)
```

## How It Works

### Pipeline Stages

1. **Extract** (`pipeline/extractor.py`) -- Reads raw files from `backend/dummy_data/`. Parses JSON directly and Excel via openpyxl (all sheets, header-keyed rows).

2. **Transform** (`pipeline/transformer.py`) -- Normalizes each extracted dataset into a `CanonicalPayload`. For volunteer JSON, derives analytics (overview stats, charts by month/gender/city). For Excel files, flattens all sheets into records with a sheet summary.

3. **Load** (`pipeline/loader.py`) -- `TerminalLoader` prints payloads to stdout. The `Loader` protocol defines the contract for future sink adapters (Postgres, API, file, etc.).

4. **Orchestration** (`pipeline/etl.py`) -- `TransactionLayer` owns loader selection. `ETLPipeline` wires extract, transform, and transaction together.

### Canonical Schema

Every dataset passes through the pipeline as a `CanonicalPayload` (`schema.py`):

```
source_name          what it is ("mock_volunteers")
source_type          format ("json_records", "excel_file")
classification       data category ("volunteer_operational_data")
fields               column definitions inferred from the data
sample_records       the actual records
derived_outputs      analytics (charts, summaries)
transformed_payload  the processed data
metadata             path, row counts, etc.
```

All loaders consume this shape unchanged. The extractor doesn't know where data will go. The loader doesn't know where data came from.

### n8n Integration

Workflows are defined as Python code (not built in the n8n UI). The `node_factory.py` provides builder classes that output n8n-compatible JSON with deterministic node IDs.

n8n acts as a thin orchestrator, calling Python over HTTP:

```
Manual Trigger
  -> POST /etl/extract       (returns extracted datasets)
  -> POST /etl/transform     (returns canonical payloads)
  -> POST /etl/load          (loads via TransactionLayer)
```

The same Python code runs whether you use the CLI or n8n.

## Usage

### CLI (standalone, no server needed)

```bash
cd backend

# Run the full ETL pipeline (extract -> transform -> print to terminal)
python -m data_centralization_service.main run-pipeline

# Generate n8n workflow JSON
python -m data_centralization_service.main generate-workflows
```

### FastAPI Server (needed for n8n)

```bash
cd backend
uvicorn main:app --reload
```

Endpoints:
- `POST /etl/extract` -- Run extraction, returns datasets as JSON
- `POST /etl/transform` -- Accepts `{"datasets": [...]}`, returns canonical payloads
- `POST /etl/load` -- Accepts `{"payloads": [...]}`, loads via TransactionLayer


## Configuration

Environment variables (all optional, defaults shown):

| Variable | Default | Description |
|----------|---------|-------------|
| `DATA_CENTRALIZATION_AI_PROVIDER` | `heuristic` | Transform strategy |
| `DATA_CENTRALIZATION_BACKEND_URL` | `http://localhost:8000` | URL n8n uses to call the API |
| `DATA_CENTRALIZATION_OPENAI_MODEL` | `gpt-4.1-mini` | Model for AI transform (if enabled) |
| `OPENAI_API_KEY` | -- | Required only if AI provider is `openai` |

## Data Sources

Currently reads from `backend/dummy_data/`:

| File | Type | Records |
|------|------|---------|
| `mockVolunteers.json` | JSON | 10 volunteer records |
| `2026 Volunteer Report Hours.xlsx` | Excel | 5 sheets, 216 rows |
| `Schedule of Volunteers & Departments...xlsx` | Excel | 9 sheets, 71 rows |
