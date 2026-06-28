# MarketPrice Daily Refresh Environment Configuration

This document describes the necessary environment variables and infrastructure configurations required to operate the daily MarketPrice refresh scripts.

## No Secrets Policy
No API keys, passwords, or secure tokens are stored in this document or any tracked files.

## Environment Variables

### `NODE_TLS_REJECT_UNAUTHORIZED`
- **Purpose**: Used to suppress SSL/TLS certificate verification errors during testing or staging operations against local setups containing self-signed certificates.
- **Local/Staging Value**: `0`
- **Production Value**: Must NOT be set to `0`. If running in production, certificate verification must be strictly enforced.

### `DATABASE_URL`
- **Purpose**: connection string pointing to the PostgreSQL instance used for data ingestion.
- **Local/Staging Value**: Standard Postgres connection URI (e.g. `postgresql://user:pass@localhost:5432/devdb`).
- **Production Value**: Provided securely via deployment infrastructure (Vercel, Railway, etc).

## Kill Switch / Confirm-Write Policy
The application logic implements a strict boundary:
- By default, executing the orchestration or job script triggers a **dry-run** resulting in NO database mutations.
- The `--confirm-write` CLI argument acts as a manual kill-switch/authorization mechanism. Writes will only occur if this flag is passed.
- No environment variables directly enable automatic writes at this time; it is strictly governed by the CLI arguments.

## Future Provider Integrations
Future verified providers may require specific API keys or endpoints. These will be added as required and managed externally to the repository.
