# BINJOW Platform Guide
<!-- Keep this file updated as new pages and features are built. -->
<!-- Keep AI-facing product notes here as future insight/report features expand. -->

## Audience And Access
- This is an internal client-facing dashboard for Science Museum Oklahoma staff.
- It is not a public volunteer/customer portal.
- Users must sign in before accessing dashboard data and management tools.

## Navigation Sidebar (left side)
- Overview — main dashboard with key metrics and charts
- Volunteers — uploaded volunteer dataset explorer, spreadsheet replacement, and activity analytics
- Recognition — database-backed volunteer rankings and hour milestones

## Pages & Features

### Overview Page ("/")
- Stat cards at the top summarize total volunteers, logged hours, average age, represented cities, and estimated volunteer value
- Volunteer activity charts summarize database-backed volunteer activity by month, city, gender, age group, and ethnicity
- Empty, loading, and error states are shown when database records are unavailable
- AI insight buttons summarize chart patterns on demand
- Date range filter (top right): All Time / Last 3 Years / This Year / This Quarter
- Generate Report button (top right)

### Volunteers Page ("/volunteers")
- 4 stat cards: Volunteer Count, Total Hours, Data Completeness, Latest Activity
- Volunteer Records table supports search, sort, pagination, export, and anonymized labels such as Volunteer #001
- Last Activity by Month chart groups uploaded records by latest activity month
- Activity Hours by Year compares current-year and prior-year hour totals by activity month
- Last Activity by Weekday chart supports metric and chart type selectors
- Age Distribution chart shows volunteer counts by age group
- AI insight buttons summarize chart patterns on demand
- Export Data button (top right) — downloads volunteer information
- Replace Dataset button uploads an Excel/CSV spreadsheet and replaces the active analytics dataset
- Dashboard, volunteer, and recognition analytics reflect the latest uploaded spreadsheet
- Uploaded spreadsheet rows are treated as analytics records, not manually maintained volunteer profiles

### Recognition Page ("/recognition")
- Pulls volunteer records from the database through the protected volunteers API
- Shows contribution analytics based on lifetime hours from the active uploaded spreadsheet
- Stat cards summarize total hours, volunteers with hours, average hours, and 100+ hour volunteers
- Top Hour Contributors highlights the first three anonymized volunteer labels ranked by lifetime hours
- Contribution Tiers show how uploaded volunteers are distributed across hour ranges
- Milestone cards count volunteers over hour thresholds such as 100+, 50+, and 10+ lifetime hours
- Ranked Hour Table shows the first ten uploaded volunteer records ranked by lifetime hours
- AI button generates a short contribution-pattern insight on demand

## Out Of V1 Scope
- Events management and AI event email workflows are not part of the current client-facing launch scope.
- Revenue analytics are not part of the current client-facing launch scope.
- Exhibitions management is not part of the current client-facing launch scope.
- Public volunteer/customer application flows have been removed from the production app.
- The old floating BINJOW chatbot is not part of the v1 production app path.

## Future AI Direction
- On-demand AI insight buttons are backed by the backend `/api/insights` endpoint and require `OPENAI_API_KEY`.
- The existing chart/report data should remain the source of truth for future AI-generated summaries.
- Future AI work should focus next on comprehensive report narrative.
