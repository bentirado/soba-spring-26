# BINJOW Platform Guide
<!-- Keep this file updated as new pages and features are built. -->
<!-- The AI chatbot reads this file on every request. -->

## Audience And Access
- This is an internal client-facing dashboard for Science Museum Oklahoma staff.
- It is not a public volunteer/customer portal.
- Users must sign in before accessing dashboard data and management tools.

## Navigation Sidebar (left side)
- Overview — main dashboard with key metrics and charts
- Volunteers — volunteer directory, demographics, and hall of fame
- Recognition — database-backed volunteer rankings and hour milestones
- Events — create and manage volunteer events, send email invitations

## Pages & Features

### Overview Page ("/")
- 4 stat cards at the top: Active Volunteers, Hours Logged, New Volunteers, Retention Rate (values come live from the database)
- Volunteer activity charts summarize database-backed volunteer activity by month and city
- Empty, loading, and error states are shown when database records are unavailable
- Insight cards summarize volunteer activity and engagement
- Date range filter (top right): Last 30 Days / This Quarter / This Year / All Time
- Generate Report button (top right)
- Data Actions dropdown (top right): "Upload Data" (accepts .csv files) and "Export Report"

### Volunteers Page ("/volunteers")
- 4 stat cards: Total Volunteers, Hours Logged, Active Events, Community Impact
- Attendance Breakdown chart: stacked area chart showing New vs Recurrent volunteers by month
- Age Distribution chart: bar chart showing volunteer counts by age group (18-24, 25-34, 35-44, 45-54, 55+)
- Gender Breakdown chart: donut chart
- Hall of Fame section: top 3 volunteers on a podium ranked by total hours
- Honorable Mentions: ranks 4–6
- Export Data button (top right) — downloads volunteer information

### Recognition Page ("/recognition")
- Pulls volunteer records from the database through the protected volunteers API
- Shows total recognized hours, active volunteers with recorded hours, and top contributor
- Hall of Fame podium ranks the top 3 volunteers by lifetime hours
- Milestone cards count volunteers over hour thresholds such as 100+, 50+, and 10+ lifetime hours
- Top Contributors table shows the first ten ranked volunteer records

### Events Page ("/events")
- Create and manage volunteer events for Science Museum Oklahoma
- Create Event button (top right, blue): opens a form to fill in event name, location, start/end date & time, max volunteers, description, and required skills
- Required skills are selected from a tag picker: Bilingual, Customer Service, Dependable, Live Performing, Organizing & Cleaning, Problem-Solving, Public Speaking, Teaching, Teamwork, Time Management
- Events are displayed in a card grid — each card shows event name, description, location, date/time, max volunteers, and skill tags
- Cancel event: trash icon on each card permanently cancels the event
- Send Emails to Volunteers button (orange) on each card: opens a preview modal before sending
  - Preview modal shows two groups of volunteers:
    - "Skill Match" section: volunteers whose skills match the event's required skills (shown with green skill badges)
    - "Other Volunteers" section: all remaining active volunteers
  - Checkboxes on each row to select/deselect individual volunteers
  - "Select all", "Matched only", and "Deselect all" shortcuts at the bottom
  - Send button shows how many volunteers will receive the email
  - Emails are personalized per volunteer using AI (GPT) and sent via Gmail SMTP
  - Each email mentions the volunteer's matching skills and lists other upcoming events

## Out Of V1 Scope
- Revenue analytics are not part of the current client-facing launch scope.
- Exhibitions management is not part of the current client-facing launch scope.
- Public volunteer/customer application flows have been removed from the production app.

## Chatbot (BINJOW)
- The floating chat button is in the bottom-right corner of every page
- Click it to open the chat window
- Type a question and press Enter to send (Shift+Enter for a new line)
- Click suggestion buttons to quickly fill the input
- Close the chat by clicking the X button in the chat header
