# Build overview KPI data for the dashboard summary cards.
def build_overview(volunteers):
    total_volunteers = len(volunteers)
    total_life_hours = sum(volunteer.get("life_hours", 0) for volunteer in volunteers)
    average_age = round(
        sum(volunteer.get("age", 0) for volunteer in volunteers) / total_volunteers, 1
    ) if total_volunteers else 0

    cities_represented = len(
        {volunteer.get("city") for volunteer in volunteers if volunteer.get("city")}
    )

    return {
        "total_volunteers": total_volunteers,
        "hours_logged": round(total_life_hours, 1),
        "average_age": average_age,
        "cities_represented": cities_represented,
    }