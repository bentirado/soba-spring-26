from __future__ import annotations

"""
Standalone seed script for the Science Museum Volunteer Management System.

Populates the PostgreSQL database with realistic mock data.
Uses psycopg2 (synchronous) for simplicity.

Usage:
    cd backend
    python -m database.seed
    # or
    python database/seed.py
"""

import os
import random
import re
import sys
import zipfile
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from xml.etree import ElementTree as ET


import psycopg2
from dotenv import load_dotenv
from faker import Faker


# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

load_dotenv()

fake = Faker("en_US")
random.seed(42)
Faker.seed(42)

_RAW_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/soba_db")

# Strip asyncpg driver if present so psycopg2 can parse the URL.
_PSYCOPG2_URL = (
    _RAW_URL
    .replace("postgresql+asyncpg://", "postgresql://")
    .replace("postgres+asyncpg://", "postgresql://")
)


def get_connection():
    """Return a psycopg2 connection using DATABASE_URL."""
    return psycopg2.connect(_PSYCOPG2_URL)


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

OK_CITIES_ZIPS = {
    "Edmond":         ["73003", "73012", "73013", "73034"],
    "Norman":         ["73019", "73026", "73069", "73071", "73072"],
    "Oklahoma City":  ["73102", "73103", "73104", "73105", "73106", "73107", "73108",
                       "73109", "73110", "73111", "73112", "73118", "73119", "73120"],
    "Moore":          ["73160", "73170"],
    "Yukon":          ["73085", "73099"],
    "Bethany":        ["73008"],
    "Midwest City":   ["73110", "73130", "73140"],
    "Mustang":        ["73064"],
    "Stillwater":     ["74074", "74075", "74076", "74077", "74078"],
    "Tulsa":          ["74101", "74103", "74104", "74105", "74106", "74107", "74108",
                       "74110", "74112", "74114", "74115", "74116", "74119", "74120"],
    "Broken Arrow":   ["74011", "74012", "74014"],
    "Owasso":         ["74055"],
    "Jenks":          ["74037"],
    "Bixby":          ["74008"],
    "Sand Springs":   ["74063"],
}

OK_CITIES = list(OK_CITIES_ZIPS.keys())
BACKEND_ROOT = Path(__file__).resolve().parents[1]
DEMOGRAPHIC_WORKBOOK = BACKEND_ROOT / "dummy_data" / "Demographic data for Active Volunteers at SMO.xlsx"


def random_city_zip():
    city = random.choice(OK_CITIES)
    zip_code = random.choice(OK_CITIES_ZIPS[city])
    return city, zip_code


def compute_age_group(age: int) -> str:
    if age < 16:
        return "Under 16"
    elif age <= 24:
        return "16-24"
    elif age <= 34:
        return "25-34"
    elif age <= 44:
        return "35-44"
    elif age <= 54:
        return "45-54"
    elif age <= 64:
        return "55-64"
    else:
        return "65+"


def random_date_between(start: date, end: date) -> date:
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, max(delta, 0)))


def random_datetime_between(start: datetime, end: datetime) -> datetime:
    delta = int((end - start).total_seconds())
    return start + timedelta(seconds=random.randint(0, max(delta, 0)))


def to_aware(dt: datetime) -> datetime:
    """Attach UTC timezone if naive."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def parse_optional_int(raw_value) -> int | None:
    if raw_value is None:
        return None
    cleaned = str(raw_value).strip().replace(",", "")
    if not cleaned:
        return None
    try:
        parsed = int(float(cleaned))
    except ValueError:
        return None
    return parsed if parsed > 0 else None


def parse_optional_float(raw_value) -> float | None:
    if raw_value is None:
        return None
    cleaned = str(raw_value).strip().replace(",", "").replace("$", "")
    if not cleaned:
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def parse_optional_date(raw_value) -> date | None:
    if raw_value is None:
        return None
    cleaned = str(raw_value).strip()
    if not cleaned:
        return None
    for fmt in ("%m/%d/%Y", "%m-%d-%Y", "%Y-%m-%d", "%m/%d/%y", "%m-%d-%y"):
        try:
            return datetime.strptime(cleaned, fmt).date()
        except ValueError:
            continue
    if cleaned.replace(".", "", 1).isdigit():
        try:
            # Excel serial date system
            return date(1899, 12, 30) + timedelta(days=int(float(cleaned)))
        except ValueError:
            return None
    return None


def parse_hispanic_latino_value(raw_value) -> str | None:
    if raw_value is None:
        return None
    cleaned = str(raw_value).strip().lower()
    if not cleaned:
        return None
    if cleaned.startswith("no") or "not hispanic" in cleaned:
        return "No"
    if cleaned.startswith("yes") or "hispanic" in cleaned or "latino" in cleaned or "spanish" in cleaned:
        return "Yes"
    return None


def normalize_city(raw_value) -> str | None:
    if raw_value is None:
        return None
    cleaned = str(raw_value).strip()
    if not cleaned:
        return None
    return " ".join(part.capitalize() for part in cleaned.split())


def dedupe_headers(headers: list[str]) -> list[str]:
    seen: dict[str, int] = {}
    result: list[str] = []
    for header in headers:
        cleaned = header.strip()
        if not cleaned:
            result.append("")
            continue
        count = seen.get(cleaned, 0)
        result.append(cleaned if count == 0 else f"{cleaned}_{count}")
        seen[cleaned] = count + 1
    return result


def column_index_from_ref(cell_ref: str) -> int:
    match = re.match(r"([A-Z]+)", cell_ref)
    if not match:
        return 0
    column_letters = match.group(1)
    index = 0
    for char in column_letters:
        index = index * 26 + (ord(char) - ord("A") + 1)
    return index - 1


def load_demographic_rows() -> list[dict[str, str]]:
    ns = {
        "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
        "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    }

    with zipfile.ZipFile(DEMOGRAPHIC_WORKBOOK) as workbook_zip:
        shared_strings: list[str] = []
        if "xl/sharedStrings.xml" in workbook_zip.namelist():
            shared_root = ET.fromstring(workbook_zip.read("xl/sharedStrings.xml"))
            for si in shared_root.findall("a:si", ns):
                shared_strings.append("".join(node.text or "" for node in si.iterfind(".//a:t", ns)))

        workbook_root = ET.fromstring(workbook_zip.read("xl/workbook.xml"))
        workbook_rels = ET.fromstring(workbook_zip.read("xl/_rels/workbook.xml.rels"))
        rel_targets = {
            rel.attrib["Id"]: rel.attrib["Target"]
            for rel in workbook_rels
        }
        first_sheet = next(iter(workbook_root.find("a:sheets", ns)))
        relationship_id = first_sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]
        sheet_path = "xl/" + rel_targets[relationship_id]
        sheet_root = ET.fromstring(workbook_zip.read(sheet_path))
        sheet_rows = sheet_root.find("a:sheetData", ns).findall("a:row", ns)

        def parse_cell_value(cell) -> str:
            cell_type = cell.attrib.get("t")
            value_node = cell.find("a:v", ns)
            if value_node is not None:
                raw = value_node.text or ""
                return shared_strings[int(raw)] if cell_type == "s" else raw
            inline_node = cell.find("a:is", ns)
            if inline_node is not None:
                return "".join(node.text or "" for node in inline_node.iterfind(".//a:t", ns))
            return ""

        def parse_row(row) -> list[str]:
            values: list[str] = []
            for cell in row.findall("a:c", ns):
                column_index = column_index_from_ref(cell.attrib.get("r", "A1"))
                while len(values) <= column_index:
                    values.append("")
                values[column_index] = parse_cell_value(cell).strip()
            return values

        parsed_rows = [parse_row(row) for row in sheet_rows]
        if not parsed_rows:
            return []

        headers = dedupe_headers([str(value) if value is not None else "" for value in parsed_rows[0]])
        records: list[dict[str, str]] = []
        for row in parsed_rows[1:]:
            if not any(value.strip() for value in row):
                continue
            record = {
                header: row[index] if index < len(row) else ""
                for index, header in enumerate(headers)
                if header
            }
            records.append(record)

    return records


# ---------------------------------------------------------------------------
# Reference data definitions
# ---------------------------------------------------------------------------

SKILLS = [
    ("Bilingual Spanish",    "Language"),
    ("Bilingual French",     "Language"),
    ("First Aid/CPR",        "Safety"),
    ("AED Certified",        "Safety"),
    ("STEM Educator",        "Education"),
    ("Curriculum Design",    "Education"),
    ("3D Printing",          "Technology"),
    ("Coding/Programming",   "Technology"),
    ("Customer Service",     "General"),
    ("Event Setup",          "General"),
    # Skills used in the Events UI skill picker
    ("Bilingual",            "Language"),
    ("Dependable",           "General"),
    ("Live Performing",      "Arts"),
    ("Organizing & Cleaning","General"),
    ("Problem-Solving",      "General"),
    ("Public Speaking",      "Communication"),
    ("Teaching",             "Education"),
    ("Teamwork",             "General"),
    ("Time Management",      "General"),
]

# Maps partial event name substrings -> list of skill names to attach
EVENT_SKILL_MAP = {
    "Summer Science Camp":   ["Teaching", "Public Speaking", "Teamwork"],
    "Astronomy":             ["Teaching", "Problem-Solving"],
    "STEM Fair":             ["Bilingual", "Teaching", "Customer Service"],
    "Chemistry":             ["Public Speaking", "Dependable", "Teaching"],
    "Engineering":           ["Problem-Solving", "Teamwork"],
    "Coding":                ["Teaching", "Problem-Solving"],
    "Orientation":           ["Teamwork", "Dependable"],
    "Community":             ["Bilingual", "Customer Service"],
    "Science Night":         ["Teaching", "Public Speaking"],
    "Family Science":        ["Teaching", "Teamwork", "Customer Service"],
    "Robot Rumble":          ["Problem-Solving", "Teaching"],
    "Health":                ["Dependable", "Customer Service"],
}

CERTIFICATIONS = [
    ("Background Check",        "Required background screening for all volunteers.", 730),
    ("Food Handler",            "Certifies safe food handling practices.",            365),
    ("Volunteer Orientation",   "Introductory orientation for new volunteers.",       None),
    ("Child Safety Training",   "Training for working safely with minors.",           730),
    ("Fire Safety",             "Basic fire safety and evacuation procedures.",       365),
]

PROGRAMS = [
    ("Science Education",           "Hands-on science education programming for school groups and public visitors.", "Education"),
    ("Event Support",               "General support for museum events, exhibitions, and special programming.",      "Events"),
    ("Front Desk & Guest Services", "Visitor check-in, wayfinding, and front-of-house guest services.",             "Operations"),
    ("Lab Assistance",              "Support for lab demonstrations and hands-on experiment stations.",              "Education"),
    ("Community Outreach",          "Off-site outreach events, community fairs, and school visits.",                 "Outreach"),
]

GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"]
GENDER_WEIGHTS = [0.44, 0.48, 0.05, 0.03]

ETHNICITIES = [
    "White", "Black or African American", "Asian",
    "Hispanic or Latino", "Native American or Alaska Native",
    "Two or more races", "Other / Prefer not to say",
]
ETHNICITY_WEIGHTS = [0.52, 0.14, 0.06, 0.16, 0.05, 0.04, 0.03]

DIETARY_OPTIONS = ["None", "Vegetarian", "Vegan", "Gluten Free", "Pork Free", "Nut Allergy"]
DIETARY_WEIGHTS = [0.72, 0.10, 0.05, 0.05, 0.04, 0.04]

PROFICIENCY_LEVELS = ["Beginner", "Intermediate", "Expert"]

RELATIONSHIPS = ["Spouse", "Parent", "Sibling", "Friend", "Child", "Partner"]

EVENT_NAMES = [
    "Volunteer Orientation",
    "Science Night",
    "STEM Fair",
    "Member Appreciation Night",
    "School Field Trip Support",
    "Engineering Design Challenge",
    "Astronomy Observation Night",
    "Family Science Saturday",
    "Holiday Science Spectacular",
    "Earth Day Celebration",
    "Physics Phun Day",
    "Chemistry Showcase",
    "Robot Rumble",
    "Volunteer Appreciation Luncheon",
    "Summer Science Camp Kickoff",
    "Coding & Circuits Workshop",
    "Dinosaur Discovery Day",
    "Space Exploration Exhibit Opening",
    "Health & Wellness Fair",
    "Community Science Carnival",
]

SHIFT_ROLES = ["General", "Lead", "STEM Educator", "Guest Services", "Setup/Teardown"]

ACTIVITY_TYPES = ["Event Support", "Education", "Admin", "Training", "Outreach"]

COMM_CHANNELS = ["Email", "Phone", "SMS", "In-Person"]
COMM_DIRECTIONS = ["Outbound", "Inbound"]

EMAIL_SUBJECTS = [
    "Upcoming Volunteer Shift Reminder",
    "Thank You for Volunteering!",
    "New Volunteer Opportunities Available",
    "Important: Schedule Update",
    "Volunteer Newsletter - Monthly Update",
    "Certification Renewal Reminder",
    "Event Feedback Request",
    "Welcome to the Volunteer Team!",
    "Holiday Hours Notice",
    "Training Session Invitation",
]

INACTIVE_REASONS = [
    "Moved out of the area",
    "Personal schedule conflicts",
    "No longer interested",
    "Health reasons",
    "Seasonal unavailability",
    "Enrolled in school full-time",
    "Started new job",
    "Family obligations",
]

AGENT_NAMES = [
    "EngagementAnalysisAgent",
    "RetentionRiskAgent",
    "ScheduleOptimiserAgent",
    "DataQualityAgent",
    "RecognitionAgent",
]

INSIGHT_TYPES = ["Trend", "Anomaly", "Summary"]
SEVERITIES     = ["Info", "Warning", "Critical"]

REC_TYPES      = ["Outreach", "Recognition", "Retention Risk", "Leadership"]
PRIORITIES     = ["Low", "Medium", "High"]
REC_STATUSES   = ["Pending", "Actioned", "Dismissed"]


# ---------------------------------------------------------------------------
# Insertion helpers
# ---------------------------------------------------------------------------

def insert_skills(cur) -> list[int]:
    ids = []
    for name, category in SKILLS:
        cur.execute(
            """
            INSERT INTO skills (name, category)
            VALUES (%s, %s)
            ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category
            RETURNING id
            """,
            (name, category),
        )
        ids.append(cur.fetchone()[0])
    return ids


def insert_certifications(cur) -> list[int]:
    ids = []
    for name, description, valid_days in CERTIFICATIONS:
        cur.execute(
            """
            INSERT INTO certifications (name, description, valid_duration_days)
            VALUES (%s, %s, %s)
            ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
            RETURNING id
            """,
            (name, description, valid_days),
        )
        ids.append(cur.fetchone()[0])
    return ids


def insert_programs(cur) -> list[int]:
    ids = []
    for name, description, department in PROGRAMS:
        cur.execute(
            """
            INSERT INTO programs (name, description, department, is_active)
            VALUES (%s, %s, %s, TRUE)
            ON CONFLICT (name) DO UPDATE SET department = EXCLUDED.department
            RETURNING id
            """,
            (name, description, department),
        )
        ids.append(cur.fetchone()[0])
    return ids


def insert_volunteers(cur) -> list[int]:
    ids = []
    used_emails: set[str] = set()
    demographic_rows = load_demographic_rows()

    for row in demographic_rows:
        first = fake.first_name()
        last = fake.last_name()

        # Guarantee unique email
        base_email = f"{first.lower()}.{last.lower()}{random.randint(1, 9999)}@{fake.free_email_domain()}"
        email = base_email
        attempt = 0
        while email in used_emails:
            attempt += 1
            email = f"{first.lower()}.{last.lower()}{random.randint(1000, 99999)}{attempt}@{fake.free_email_domain()}"
        used_emails.add(email)

        phone = fake.numerify("(###) ###-####")
        city = normalize_city(row.get("City"))
        zip_code = str(row.get("Zip", "")).strip() or None
        state = str(row.get("State", "")).strip().upper() or "OK"
        age = parse_optional_int(row.get("Age"))
        age_group = str(row.get("Age_1", "")).strip() or (compute_age_group(age) if age is not None else None)
        gender = str(row.get("Gender", "")).strip() or None
        ethnicity = str(row.get("Ethnicity", "")).strip() or None
        hispanic_latino = parse_hispanic_latino_value(row.get("Hispanic, Latino Or Spanish"))
        dietary = str(row.get("Dietary Restrictions", "")).strip() or "None"
        last_activity = parse_optional_date(row.get("Date Of Last Activity"))
        join_end = min(last_activity, date(2025, 6, 1)) if last_activity else date(2025, 6, 1)
        joined_date = random_date_between(date(2019, 1, 1), join_end)
        life_hours = parse_optional_float(row.get("Life Hours")) or 0.0
        is_active = True
        volgistics_id = random.randint(100000, 999999)
        notes = "Seeded from demographic workbook"

        cur.execute(
            """
            INSERT INTO volunteers (
                first_name, last_name, email, phone, city, state, zip, age, age_group,
                gender, ethnicity, hispanic_latino, dietary_restrictions,
                joined_date, last_activity, life_hours, is_active, volgistics_id, notes
            )
            VALUES
                (%s, %s, %s, %s, %s, %s, %s, %s, %s,
                 %s, %s, %s, %s,
                 %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                first, last, email, phone, city, state, zip_code, age, age_group,
                gender, ethnicity, hispanic_latino, dietary,
                joined_date, last_activity, life_hours, is_active, volgistics_id, notes,
            ),
        )
        ids.append(cur.fetchone()[0])

    return ids


def insert_emergency_contacts(cur, volunteer_ids: list[int]) -> None:
    for vol_id in volunteer_ids:
        count = random.randint(1, 2)
        for _ in range(count):
            name = fake.name()
            rel = random.choice(RELATIONSHIPS)
            phone = fake.numerify("(###) ###-####")
            email = fake.email() if random.random() < 0.5 else None
            cur.execute(
                """
                INSERT INTO emergency_contacts (volunteer_id, name, relation_type, phone, email)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (vol_id, name, rel, phone, email),
            )


def insert_volunteer_skills(cur, volunteer_ids: list[int], skill_ids: list[int]) -> None:
    for vol_id in volunteer_ids:
        chosen = random.sample(skill_ids, k=random.randint(1, 4))
        acquired_base = random_date_between(date(2018, 1, 1), date(2025, 1, 1))
        for skill_id in chosen:
            level = random.choice(PROFICIENCY_LEVELS)
            acquired = acquired_base + timedelta(days=random.randint(0, 365))
            cur.execute(
                """
                INSERT INTO volunteer_skills (volunteer_id, skill_id, proficiency_level, acquired_date)
                VALUES (%s, %s, %s, %s)
                """,
                (vol_id, skill_id, level, acquired),
            )


def insert_volunteer_certifications(
    cur,
    volunteer_ids: list[int],
    cert_ids: list[int],
) -> None:
    # cert_ids order: Background Check(0), Food Handler(1), Orientation(2), Child Safety(3), Fire Safety(4)
    background_check_id = cert_ids[0]
    orientation_id = cert_ids[2]

    for vol_id in volunteer_ids:
        assigned_certs: set[int] = set()

        # All volunteers get Background Check + Orientation
        for cert_id in (background_check_id, orientation_id):
            completed = random_date_between(date(2019, 1, 1), date(2025, 1, 1))
            # valid_duration_days for background check = 730 days
            expiry = completed + timedelta(days=730) if cert_id == background_check_id else None
            cur.execute(
                """
                INSERT INTO volunteer_certifications
                    (volunteer_id, certification_id, completed_date, expiry_date, issued_by)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (vol_id, cert_id, completed, expiry, "Science Museum HR"),
            )
            assigned_certs.add(cert_id)

        # 40% chance of additional certifications (pick 1-2 from remaining)
        if random.random() < 0.40:
            remaining = [c for c in cert_ids if c not in assigned_certs]
            extras = random.sample(remaining, k=random.randint(1, min(2, len(remaining))))
            for cert_id in extras:
                completed = random_date_between(date(2020, 1, 1), date(2025, 1, 1))
                expiry = completed + timedelta(days=365) if random.random() < 0.5 else None
                cur.execute(
                    """
                    INSERT INTO volunteer_certifications
                        (volunteer_id, certification_id, completed_date, expiry_date, issued_by)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (vol_id, cert_id, completed, expiry, "Science Museum Training"),
                )


def insert_availability(cur, volunteer_ids: list[int]) -> None:
    time_slots = [
        (8, 0, 12, 0),   # Morning
        (12, 0, 17, 0),  # Afternoon
        (17, 0, 21, 0),  # Evening
        (9, 0, 13, 0),
        (13, 0, 18, 0),
    ]
    for vol_id in volunteer_ids:
        days = random.sample(range(7), k=random.randint(2, 5))
        for day in days:
            start_h, start_m, end_h, end_m = random.choice(time_slots)
            from datetime import time as dt_time
            cur.execute(
                """
                INSERT INTO availability (volunteer_id, day_of_week, start_time, end_time)
                VALUES (%s, %s, %s, %s)
                """,
                (vol_id, day, dt_time(start_h, start_m), dt_time(end_h, end_m)),
            )


def insert_volunteer_programs(cur, volunteer_ids: list[int], program_ids: list[int]) -> None:
    roles = ["Volunteer", "Lead", "Volunteer", "Volunteer", "Coordinator"]
    for vol_id in volunteer_ids:
        chosen_programs = random.sample(program_ids, k=random.randint(1, 2))
        for prog_id in chosen_programs:
            role = random.choice(roles)
            enrolled = random_date_between(date(2019, 1, 1), date(2025, 6, 1))
            left_date = None
            if random.random() < 0.15:
                left_date = enrolled + timedelta(days=random.randint(30, 730))
            cur.execute(
                """
                INSERT INTO volunteer_programs (volunteer_id, program_id, role, enrolled_date, left_date)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (vol_id, prog_id, role, enrolled, left_date),
            )


def insert_events(cur, program_ids: list[int]) -> list[dict]:
    """Insert 30 events spread across 2023-2026 and return their data."""
    events = []
    used_names: set[str] = set()

    # Build a pool of names, repeating with year suffix if needed
    event_pool = []
    for year in [2023, 2024, 2025, 2026]:
        for name in EVENT_NAMES:
            event_pool.append(f"{name} {year}")

    random.shuffle(event_pool)
    chosen_names = event_pool[:30]

    for event_name in chosen_names:
        # Extract year from suffix to anchor the datetime
        year_str = event_name.split()[-1]
        try:
            year = int(year_str)
        except ValueError:
            year = 2024

        start_dt = datetime(
            year,
            random.randint(1, 12),
            random.randint(1, 28),
            random.randint(8, 17),
            0,
            tzinfo=timezone.utc,
        )
        duration_hours = random.randint(2, 8)
        end_dt = start_dt + timedelta(hours=duration_hours)
        prog_id = random.choice(program_ids) if random.random() < 0.80 else None
        location = random.choice([
            "Main Hall",
            "Science Gallery",
            "Outdoor Amphitheater",
            "Learning Lab A",
            "Learning Lab B",
            "Discovery Center",
            "Auditorium",
        ])
        max_vol = random.randint(5, 30)
        is_cancelled = random.random() < 0.05

        cur.execute(
            """
            INSERT INTO events
                (name, description, program_id, location, start_datetime, end_datetime,
                 max_volunteers, is_cancelled)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                event_name,
                fake.sentence(nb_words=12),
                prog_id,
                location,
                start_dt,
                end_dt,
                max_vol,
                is_cancelled,
            ),
        )
        event_id = cur.fetchone()[0]
        events.append(
            {
                "id": event_id,
                "name": event_name,
                "start_datetime": start_dt,
                "end_datetime": end_dt,
                "is_past": start_dt < datetime.now(tz=timezone.utc),
                "is_cancelled": is_cancelled,
            }
        )

    return events


def insert_event_skills(cur, events: list[dict]) -> None:
    """Attach skills to events based on their name using EVENT_SKILL_MAP."""
    for event in events:
        event_name = event["name"]
        skills_to_attach: list[str] = []

        for keyword, skill_names in EVENT_SKILL_MAP.items():
            if keyword.lower() in event_name.lower():
                skills_to_attach = skill_names
                break

        for skill_name in skills_to_attach:
            cur.execute("SELECT id FROM skills WHERE name = %s", (skill_name,))
            row = cur.fetchone()
            if not row:
                continue
            skill_id = row[0]
            cur.execute(
                "SELECT 1 FROM event_skills WHERE event_id = %s AND skill_id = %s",
                (event["id"], skill_id),
            )
            if not cur.fetchone():
                cur.execute(
                    "INSERT INTO event_skills (event_id, skill_id) VALUES (%s, %s)",
                    (event["id"], skill_id),
                )


def insert_shifts(cur, events: list[dict]) -> list[dict]:
    """Insert 1-3 shifts per event and return shift records."""
    shifts = []
    for event in events:
        num_shifts = random.randint(1, 3)
        event_start: datetime = event["start_datetime"]
        event_end: datetime = event["end_datetime"]
        total_seconds = int((event_end - event_start).total_seconds())
        segment = max(total_seconds // num_shifts, 3600)

        for i in range(num_shifts):
            shift_start = event_start + timedelta(seconds=i * segment)
            shift_end = shift_start + timedelta(seconds=segment)
            if shift_end > event_end:
                shift_end = event_end

            role = random.choice(SHIFT_ROLES)
            max_vol = random.randint(3, 15)

            cur.execute(
                """
                INSERT INTO shifts (event_id, start_time, end_time, role_required, max_volunteers)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
                """,
                (event["id"], shift_start, shift_end, role, max_vol),
            )
            shift_id = cur.fetchone()[0]
            shifts.append(
                {
                    "id": shift_id,
                    "event_id": event["id"],
                    "start_time": shift_start,
                    "end_time": shift_end,
                    "is_past": event["is_past"],
                    "is_cancelled": event["is_cancelled"],
                }
            )

    return shifts


def insert_shift_assignments(cur, shifts: list[dict], volunteer_ids: list[int]) -> list[dict]:
    """Assign volunteers to past shifts; return created assignment records."""
    assignments = []
    now = datetime.now(tz=timezone.utc)

    for shift in shifts:
        if shift["is_cancelled"]:
            continue

        # Only create assignments for past and near-future shifts (up to 30 days out)
        if shift["start_time"] > now + timedelta(days=30):
            continue

        is_past = shift["is_past"]
        num_assigned = random.randint(2, min(8, len(volunteer_ids)))
        chosen_vols = random.sample(volunteer_ids, k=num_assigned)

        for vol_id in chosen_vols:
            if is_past:
                status = random.choices(
                    ["Completed", "No-Show", "Completed", "Completed"],
                    weights=[0.80, 0.10, 0.05, 0.05],
                    k=1,
                )[0]
                assigned_at = shift["start_time"] - timedelta(days=random.randint(1, 14))
                checked_in_at = shift["start_time"] + timedelta(minutes=random.randint(-5, 15)) if status == "Completed" else None
                checked_out_at = shift["end_time"] + timedelta(minutes=random.randint(-10, 20)) if status == "Completed" else None
            else:
                status = random.choices(["Confirmed", "Waitlisted"], weights=[0.85, 0.15], k=1)[0]
                assigned_at = now - timedelta(days=random.randint(0, 7))
                checked_in_at = None
                checked_out_at = None

            cur.execute(
                """
                INSERT INTO shift_assignments
                    (shift_id, volunteer_id, status, assigned_at, checked_in_at, checked_out_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (shift["id"], vol_id, status, assigned_at, checked_in_at, checked_out_at),
            )
            assignment_id = cur.fetchone()[0]
            assignments.append(
                {
                    "id": assignment_id,
                    "volunteer_id": vol_id,
                    "shift_id": shift["id"],
                    "shift_start": shift["start_time"],
                    "shift_end": shift["end_time"],
                    "status": status,
                    "checked_in_at": checked_in_at,
                    "checked_out_at": checked_out_at,
                }
            )

    return assignments


def insert_volunteer_hours(
    cur,
    assignments: list[dict],
    volunteer_ids: list[int],
) -> None:
    """
    Generate volunteer hours from:
    1. Completed shift assignments
    2. Standalone admin/training hours to fill out monthly chart data (2022-2026)
    """
    # Hours from completed shift assignments
    for assignment in assignments:
        if assignment["status"] != "Completed":
            continue
        if assignment["checked_in_at"] and assignment["checked_out_at"]:
            hours_worked = (
                assignment["checked_out_at"] - assignment["checked_in_at"]
            ).total_seconds() / 3600.0
        else:
            hours_worked = round(random.uniform(1.5, 6.0), 2)

        hours_worked = max(0.5, round(hours_worked, 2))
        activity = random.choices(
            ["Event Support", "Education", "Outreach"],
            weights=[0.60, 0.30, 0.10],
            k=1,
        )[0]
        notes = fake.sentence() if random.random() < 0.2 else None
        verified = random.random() < 0.75
        record_date = (
            assignment["checked_in_at"].date()
            if assignment["checked_in_at"]
            else assignment["shift_start"].date()
        )

        cur.execute(
            """
            INSERT INTO volunteer_hours
                (volunteer_id, shift_assignment_id, log_date, hours, activity_type, notes, verified)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                assignment["volunteer_id"],
                assignment["id"],
                record_date,
                hours_worked,
                activity,
                notes,
                verified,
            ),
        )

    # Standalone hours — spread across 2022-2026 for rich chart data
    start_standalone = date(2022, 1, 1)
    end_standalone = date(2026, 3, 1)

    for vol_id in volunteer_ids:
        # Each volunteer gets 4-12 standalone records
        num_records = random.randint(4, 12)
        for _ in range(num_records):
            record_date = random_date_between(start_standalone, end_standalone)
            hours = round(random.uniform(0.5, 4.0), 2)
            activity = random.choices(
                ["Admin", "Training", "Education", "Event Support", "Outreach"],
                weights=[0.25, 0.25, 0.20, 0.20, 0.10],
                k=1,
            )[0]
            notes = fake.sentence() if random.random() < 0.15 else None
            verified = random.random() < 0.60

            cur.execute(
                """
                INSERT INTO volunteer_hours
                    (volunteer_id, shift_assignment_id, log_date, hours, activity_type, notes, verified)
                VALUES (%s, NULL, %s, %s, %s, %s, %s)
                """,
                (vol_id, record_date, hours, activity, notes, verified),
            )


def insert_communications(cur, volunteer_ids: list[int]) -> None:
    now = datetime.now(tz=timezone.utc)
    staff_names = [
        "Sarah Johnson", "Michael Torres", "Amanda Lee",
        "David Nguyen", "System", "System", "System",
    ]

    for vol_id in volunteer_ids:
        count = random.randint(2, 5)
        for _ in range(count):
            channel = random.choice(COMM_CHANNELS)
            direction = random.choices(COMM_DIRECTIONS, weights=[0.70, 0.30], k=1)[0]
            subject = random.choice(EMAIL_SUBJECTS) if channel == "Email" else None
            body = fake.paragraph(nb_sentences=random.randint(2, 5))
            days_ago = random.randint(0, 730)
            sent_at = now - timedelta(days=days_ago, hours=random.randint(0, 23))
            sent_by = random.choice(staff_names)

            cur.execute(
                """
                INSERT INTO communications
                    (volunteer_id, channel, direction, subject, body, sent_at, sent_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (vol_id, channel, direction, subject, body, sent_at, sent_by),
            )


def insert_status_history(cur, volunteer_ids: list[int]) -> None:
    """Every volunteer has at least one status entry; inactive ones have a reason."""
    # Fetch active flag per volunteer (already inserted)
    # We use a simple in-memory approach: the seeder controls is_active itself.
    # We'll query what we inserted.
    now = datetime.now(tz=timezone.utc)

    # Fetch volunteer id + is_active from the DB
    cur.execute("SELECT id, is_active, joined_date FROM volunteers ORDER BY id")
    rows = cur.fetchall()

    for vol_id, is_active, joined_date in rows:
        # Initial "Active" status on join date
        joined_dt = datetime.combine(
            joined_date if joined_date else date(2020, 1, 1),
            datetime.min.time(),
        ).replace(tzinfo=timezone.utc)

        cur.execute(
            """
            INSERT INTO volunteer_status_history (volunteer_id, status, changed_at, reason)
            VALUES (%s, 'Active', %s, 'Initial registration')
            """,
            (vol_id, joined_dt),
        )

        if not is_active:
            # Add an Inactive entry some time after joining
            days_active = random.randint(30, 1000)
            changed_at = joined_dt + timedelta(days=days_active)
            if changed_at > now:
                changed_at = now - timedelta(days=random.randint(1, 90))
            reason = random.choice(INACTIVE_REASONS)
            cur.execute(
                """
                INSERT INTO volunteer_status_history (volunteer_id, status, changed_at, reason)
                VALUES (%s, 'Inactive', %s, %s)
                """,
                (vol_id, changed_at, reason),
            )
        elif random.random() < 0.08:
            # Small chance of On Leave then back to Active
            leave_start = joined_dt + timedelta(days=random.randint(60, 500))
            if leave_start < now - timedelta(days=60):
                cur.execute(
                    """
                    INSERT INTO volunteer_status_history (volunteer_id, status, changed_at, reason)
                    VALUES (%s, 'On Leave', %s, 'Temporary leave of absence')
                    """,
                    (vol_id, leave_start),
                )
                return_dt = leave_start + timedelta(days=random.randint(30, 120))
                if return_dt < now:
                    cur.execute(
                        """
                        INSERT INTO volunteer_status_history (volunteer_id, status, changed_at, reason)
                        VALUES (%s, 'Active', %s, 'Returned from leave')
                        """,
                        (vol_id, return_dt),
                    )


def insert_agent_runs(cur) -> list[int]:
    now = datetime.now(tz=timezone.utc)
    agent_run_ids = []

    trigger_options = ["Schedule", "Manual", "Event"]
    status_options = ["Success", "Success", "Success", "Failed", "Success"]

    for i, agent_name in enumerate(AGENT_NAMES):
        days_ago = random.randint(0, 30)
        started_at = now - timedelta(days=days_ago, hours=random.randint(0, 12))
        duration_mins = random.randint(2, 45)
        finished_at = started_at + timedelta(minutes=duration_mins)
        triggered_by = random.choice(trigger_options)
        status = random.choice(status_options)
        error_msg = fake.sentence() if status == "Failed" else None
        records_processed = random.randint(50, 500) if status != "Failed" else None

        cur.execute(
            """
            INSERT INTO agent_runs
                (agent_name, triggered_by, started_at, finished_at, status,
                 error_message, records_processed)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                agent_name, triggered_by, started_at, finished_at,
                status, error_msg, records_processed,
            ),
        )
        agent_run_ids.append(cur.fetchone()[0])

    return agent_run_ids


def insert_agent_insights(cur, agent_run_ids: list[int]) -> None:
    sample_insights = [
        ("Trend",   "Volunteer Hours Trending Upward",
         "Total volunteer hours have increased by 18% over the past 90 days compared to the prior period.",
         "Info"),
        ("Anomaly", "Unusual Drop in Weekend Sign-Ups",
         "Weekend shift registrations dropped by 35% in the last two weeks. This may indicate scheduling conflicts or burnout.",
         "Warning"),
        ("Summary", "Monthly Engagement Summary",
         "100 active volunteers contributed 420 hours across 12 events this month. Top program: Science Education.",
         "Info"),
        ("Trend",   "Retention Risk Rising Among 2022 Cohort",
         "Volunteers who joined in 2022 show a 22% higher inactivity rate than the overall average.",
         "Warning"),
        ("Anomaly", "Certification Expiry Spike",
         "14 volunteers have Background Check certifications expiring within the next 30 days.",
         "Critical"),
        ("Summary", "New Volunteer Onboarding Metrics",
         "8 new volunteers completed orientation this month; average time to first shift was 11 days.",
         "Info"),
    ]

    now = datetime.now(tz=timezone.utc)
    for run_id in agent_run_ids:
        num_insights = random.randint(1, 3)
        chosen = random.sample(sample_insights, k=min(num_insights, len(sample_insights)))
        for insight_type, title, body, severity in chosen:
            created_at = now - timedelta(days=random.randint(0, 14))
            cur.execute(
                """
                INSERT INTO agent_insights
                    (agent_run_id, insight_type, title, body, severity, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (run_id, insight_type, title, body, severity, created_at),
            )


def insert_agent_recommendations(
    cur, agent_run_ids: list[int], volunteer_ids: list[int]
) -> None:
    sample_recs = [
        ("Outreach",        "Re-engage Lapsed Volunteer",
         "This volunteer has not logged hours in over 6 months. Consider sending a personalised re-engagement email.",
         "High",   "Pending"),
        ("Recognition",     "Volunteer Milestone: 100 Hours",
         "This volunteer recently surpassed 100 lifetime hours. Recognise their contribution at the next event.",
         "Medium", "Pending"),
        ("Retention Risk",  "At-Risk Volunteer Flagged",
         "Engagement signals suggest this volunteer may be considering leaving. Proactive outreach is recommended.",
         "High",   "Pending"),
        ("Leadership",      "Potential Lead Candidate",
         "Based on skill profile, tenure, and hours logged, this volunteer is a strong candidate for a Lead role.",
         "Medium", "Actioned"),
        ("Outreach",        "Seasonal Re-Engagement Campaign",
         "Segment of volunteers has historically been more active in autumn. Schedule targeted outreach for September.",
         "Low",    "Pending"),
        ("Recognition",     "Nominate for Volunteer of the Month",
         "Outstanding hours and positive feedback make this volunteer a top nominee.",
         "High",   "Actioned"),
    ]

    now = datetime.now(tz=timezone.utc)
    for run_id in agent_run_ids:
        num_recs = random.randint(1, 3)
        chosen = random.sample(sample_recs, k=min(num_recs, len(sample_recs)))
        for rec_type, title, body, priority, status in chosen:
            vol_id = random.choice(volunteer_ids) if random.random() < 0.80 else None
            created_at = now - timedelta(days=random.randint(0, 14))
            cur.execute(
                """
                INSERT INTO agent_recommendations
                    (agent_run_id, volunteer_id, recommendation_type, title, body,
                     priority, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (run_id, vol_id, rec_type, title, body, priority, status, created_at),
            )


# ---------------------------------------------------------------------------
# Main seeding orchestration
# ---------------------------------------------------------------------------

def seed() -> None:
    print("Connecting to database...")
    conn = get_connection()
    conn.autocommit = False
    cur = conn.cursor()

    try:
        print("Seeding skills...")
        skill_ids = insert_skills(cur)

        print("Seeding certifications...")
        cert_ids = insert_certifications(cur)

        print("Seeding programs...")
        program_ids = insert_programs(cur)

        print("Seeding volunteers from demographic workbook...")
        volunteer_ids = insert_volunteers(cur)

        print("Seeding emergency contacts...")
        insert_emergency_contacts(cur, volunteer_ids)

        print("Seeding volunteer skills...")
        insert_volunteer_skills(cur, volunteer_ids, skill_ids)

        print("Seeding volunteer certifications...")
        insert_volunteer_certifications(cur, volunteer_ids, cert_ids)

        print("Seeding availability...")
        insert_availability(cur, volunteer_ids)

        print("Seeding volunteer programs...")
        insert_volunteer_programs(cur, volunteer_ids, program_ids)

        print("Seeding events (30)...")
        events = insert_events(cur, program_ids)

        print("Seeding event skills...")
        insert_event_skills(cur, events)

        print("Seeding shifts...")
        shifts = insert_shifts(cur, events)

        print("Seeding shift assignments...")
        assignments = insert_shift_assignments(cur, shifts, volunteer_ids)

        print("Seeding volunteer hours...")
        insert_volunteer_hours(cur, assignments, volunteer_ids)

        print("Seeding communications...")
        insert_communications(cur, volunteer_ids)

        print("Seeding volunteer status history...")
        insert_status_history(cur, volunteer_ids)

        print("Seeding agent runs...")
        agent_run_ids = insert_agent_runs(cur)

        print("Seeding agent insights...")
        insert_agent_insights(cur, agent_run_ids)

        print("Seeding agent recommendations...")
        insert_agent_recommendations(cur, agent_run_ids, volunteer_ids)

        conn.commit()
        print("\nDatabase seeded successfully!")
        print(f"  Skills:              {len(skill_ids)}")
        print(f"  Certifications:      {len(cert_ids)}")
        print(f"  Programs:            {len(program_ids)}")
        print(f"  Volunteers:          {len(volunteer_ids)}")
        print(f"  Events:              {len(events)} (with skill tags)")
        print(f"  Shifts:              {len(shifts)}")
        print(f"  Shift Assignments:   {len(assignments)}")
        print(f"  Agent Runs:          {len(agent_run_ids)}")

    except Exception as exc:
        conn.rollback()
        print(f"\nSeeding failed — rolled back. Error: {exc}", file=sys.stderr)
        raise
    finally:
        cur.close()
        conn.close()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    seed()
