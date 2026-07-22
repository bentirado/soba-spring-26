# Utilities for grouping volunteer data into chart-friendly formats.
from collections import Counter
from datetime import datetime


def normalize_city_label(raw_city):
    if raw_city is None:
        return "Unknown"

    cleaned = " ".join(str(raw_city).strip().split())
    if not cleaned:
        return "Unknown"

    return cleaned.title()


# Build line-chart data showing how many volunteers have their most recent
# recorded activity in each month.
def volunteers_by_last_activity_month(volunteers):
    month_counts = Counter()

    for volunteer in volunteers:
        last_activity = volunteer.get("last_activity")
        if not last_activity:
            continue

        try:
            month_key = datetime.strptime(last_activity, "%Y-%m-%d").strftime("%Y-%m")
        except ValueError:
            continue
        month_counts[month_key] += 1

    return [
        {"month": month, "count": count}
        for month, count in sorted(month_counts.items())
    ]


# Build chart data showing the number of volunteers in each gender group.
def volunteers_by_gender(volunteers):
    gender_counts = Counter()

    for volunteer in volunteers:
        gender = volunteer.get("gender") or "Unknown"
        gender_counts[gender] += 1

    return [
        {"gender": gender, "count": count}
        for gender, count in sorted(gender_counts.items())
    ]
    

# Build chart data showing the number of volunteers in each city.
def volunteers_by_city(volunteers):
    city_counts = Counter()

    for volunteer in volunteers:
        city = normalize_city_label(volunteer.get("city"))
        city_counts[city] += 1

    return [
        {"city": city, "count": count}
        for city, count in sorted(city_counts.items())
    ]


AGE_GROUP_ORDER = {
    "Under 16": 0,
    "16-24": 1,
    "16-24 years old": 1,
    "25-34": 2,
    "25-34 years old": 2,
    "35-44": 3,
    "35-44 years old": 3,
    "45-54": 4,
    "45-54 years old": 4,
    "55-64": 5,
    "55-64 years old": 5,
    "55+": 6,
    "65+": 7,
    "65+ years old": 7,
}


def volunteers_by_age_group(volunteers):
    age_group_counts = Counter()

    for volunteer in volunteers:
        age_group = volunteer.get("age_group") or "Unknown"
        age_group_counts[age_group] += 1

    return [
        {"age_group": age_group, "count": count}
        for age_group, count in sorted(
            age_group_counts.items(),
            key=lambda item: (AGE_GROUP_ORDER.get(item[0], 999), item[0]),
        )
    ]


def volunteers_by_ethnicity(volunteers):
    ethnicity_counts = Counter()

    for volunteer in volunteers:
        ethnicity = volunteer.get("ethnicity") or "Unknown"
        ethnicity_counts[ethnicity] += 1

    return [
        {"ethnicity": ethnicity, "count": count}
        for ethnicity, count in sorted(ethnicity_counts.items())
    ]
