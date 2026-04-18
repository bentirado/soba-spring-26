# Build overview KPI data for the dashboard summary cards.
def build_overview(volunteers):
    total_volunteers = len(volunteers)
    total_life_hours = sum((volunteer.get("life_hours") or 0) for volunteer in volunteers)
    ages = [age for age in (volunteer.get("age") for volunteer in volunteers) if age is not None]
    average_age = round(sum(ages) / len(ages), 1) if ages else 0

    cities_represented = len(
        {volunteer.get("city") for volunteer in volunteers if volunteer.get("city")}
    )

    return {
        "total_volunteers": total_volunteers,
        "hours_logged": round(total_life_hours, 1),
        "average_age": average_age,
        "cities_represented": cities_represented,
    }
