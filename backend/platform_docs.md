# BINJOW Platform Guide
<!-- Keep this file updated as new pages and features are built. -->
<!-- The AI chatbot reads this file on every request. -->

## Navigation Sidebar (left side)
- Overview — main dashboard with key metrics and charts
- Volunteers — volunteer directory, demographics, and hall of fame
- Recognition — badges, milestones, and reward management
- Events — create and manage volunteer events, send email invitations
- Exhibitions — coming soon (disabled, not accessible)
- Revenue — financial analytics and ticket sales

## Pages & Features

### Overview Page ("/")
- 4 stat cards at the top: Active Volunteers, Hours Logged, New Volunteers, Retention Rate (values come live from the database)
- Volunteer Engagement Trends chart: line chart comparing current year vs previous year (12 months)
- Weekly Activity Analysis chart: selectable metric (Volunteers / Hours / Participation %) and chart type (Bar / Line / Area)
- Top Exhibitions chart: horizontal bar chart of most visited exhibitions
- Visitor Demographics chart: donut chart (Children 35%, Teens 18%, Adults 38%, Seniors 9%)
- Insight cards: Most Active Day, Avg Hours per Volunteer, Growth This Year
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
- Milestone Badges section (for regular volunteers): Century Club (100+ hrs), One Year Strong (1 year), Community Pillar (50+ events), Super Mentor (trained 5+ newbies)
- Welcome Treats section (for new volunteers): First Shift, Fast Starter, Coffee on Us ($5 gift card), Welcome Swag (T-shirt)
- Each treat card has a "Send" button to send the reward to eligible volunteers
- Recent Recognition Activity feed: timeline showing recent badge/reward activity with timestamps
- Create New Badge button (top right, green)

### Revenue Page ("/revenue")
- 4 stat cards: Monthly Revenue, Avg Transaction, Gift Shop Sales, Revenue Growth
- Revenue Trend by Source chart: stacked area chart (Admissions, Memberships, Gift Shop)
- Revenue Breakdown chart: pie chart by category
- Daily Revenue chart: bar chart by day of week
- Ticket Sales Analysis table: ticket types with tickets sold, revenue, and avg price

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

### Exhibitions Page — COMING SOON (disabled, not accessible)

### Volunteer Application Page ("/apply") — PUBLIC (no login required)
- Public-facing form for new volunteers to apply to join Science Museum Oklahoma
- Accessible without logging in — share this link with prospective volunteers
- Sections: Personal Info (name, address, phone, email), Availability (days/times), Demographics (age, gender, ethnicity), Skills, Areas of Interest, Message Preferences, and Agreement
- Submitted applications are saved to the database with status "pending review" (is_active = false)
- Staff review applications and activate volunteers manually in the system
- Shows a success confirmation screen after submission

## Chatbot (BINJOW)
- The floating chat button is in the bottom-right corner of every page
- Click it to open the chat window
- Type a question and press Enter to send (Shift+Enter for a new line)
- Click suggestion buttons to quickly fill the input
- Close the chat by clicking the X button in the chat header
