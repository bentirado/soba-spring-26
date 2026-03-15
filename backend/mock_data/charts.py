# Utilities for grouping volunteer data into chart-friendly formats.
from collections import Counter
from datetime import datetime


# Build line-chart data showing how many volunteers have their most recent
# recorded activity in each month.
def volunteers_by_last_activity_month(volunteers):
    month_counts = Counter()

    for volunteer in volunteers:
        last_activity = volunteer.get("last_activity")
        if not last_activity:
            continue

        month_key = datetime.strptime(last_activity, "%Y-%m-%d").strftime("%Y-%m")
        month_counts[month_key] += 1

    return [
        {"month": month, "count": count}
        for month, count in sorted(month_counts.items())
    ]


# Build chart data showing the number of volunteers in each gender group.
def volunteers_by_gender(volunteers):
    gender_counts = Counter()

    for volunteer in volunteers:
        gender = volunteer.get("gender")
        gender_counts[gender] += 1

    return [
        {"gender": gender, "count": count}
        for gender, count in sorted(gender_counts.items())
    ]
    

# Build chart data showing the number of volunteers in each city.
def volunteers_by_city(volunteers):
    city_counts = Counter()

    for volunteer in volunteers:
        city = volunteer.get("city", "Unknown")
        city_counts[city] += 1

    return [
        {"city": city, "count": count}
        for city, count in sorted(city_counts.items())
    ]