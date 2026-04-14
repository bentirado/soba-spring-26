import os
import smtplib
import openai
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from database.connection import get_db
from database.models import Event, EventSkill, Skill, Volunteer, VolunteerSkill

router = APIRouter()

openai_client = openai.AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def get_event_with_skills(db: AsyncSession, event_id: int):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        return None, []

    es_result = await db.execute(select(EventSkill).where(EventSkill.event_id == event_id))
    event_skill_rows = es_result.scalars().all()

    required_skills = []
    for es in event_skill_rows:
        skill_res = await db.execute(select(Skill).where(Skill.id == es.skill_id))
        skill = skill_res.scalar_one_or_none()
        if skill:
            required_skills.append(skill.name)

    return event, required_skills


async def get_volunteer_skills(db: AsyncSession, volunteer_id: int) -> list[str]:
    vs_result = await db.execute(
        select(VolunteerSkill).where(VolunteerSkill.volunteer_id == volunteer_id)
    )
    volunteer_skill_rows = vs_result.scalars().all()

    skills = []
    for vs in volunteer_skill_rows:
        skill_res = await db.execute(select(Skill).where(Skill.id == vs.skill_id))
        skill = skill_res.scalar_one_or_none()
        if skill:
            skills.append(skill.name)
    return skills


async def get_upcoming_events(db: AsyncSession, exclude_id: int) -> list[Event]:
    result = await db.execute(
        select(Event).where(Event.is_cancelled == False, Event.id != exclude_id)
    )
    return result.scalars().all()


async def generate_email(
    volunteer_name: str,
    event: Event,
    matched_skills: list[str],
    volunteer_skills: list[str],
    other_events: list[Event],
) -> str:
    other_events_text = ""
    if other_events:
        lines = []
        for e in other_events[:5]:
            date_str = e.start_datetime.strftime("%B %d, %Y at %I:%M %p") if e.start_datetime else "TBD"
            lines.append(f"- {e.name} ({date_str}, {e.location or 'Location TBD'})")
        other_events_text = "\n".join(lines)

    prompt = f"""Write a friendly, personalized volunteer recruitment email from Science Museum Oklahoma.

Volunteer name: {volunteer_name}
Featured event: {event.name}
Event date: {event.start_datetime.strftime("%B %d, %Y at %I:%M %p") if event.start_datetime else "TBD"}
Event location: {event.location or "TBD"}
Event description: {event.description or "A great volunteer opportunity at the museum."}
Required skills for this event: {", ".join(matched_skills) if matched_skills else "General help"}
Volunteer's matching skills: {", ".join(matched_skills) if matched_skills else "None specifically matched"}
Volunteer's other skills: {", ".join(volunteer_skills) if volunteer_skills else "None on file"}

Other upcoming events (mention briefly at the end):
{other_events_text if other_events_text else "No other events at this time."}

Guidelines:
- Keep it warm, concise, and enthusiastic
- Mention 1-2 of their matching skills naturally in the body
- End with a clear call to action to reply to this email or visit the platform
- Do not use placeholders like [Name] — use the actual volunteer name
- Format as plain text (no HTML tags)
- Keep it under 250 words
"""

    response = await openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=400,
        temperature=0.7,
    )
    return response.choices[0].message.content


def send_gmail(to_email: str, subject: str, body: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = GMAIL_ADDRESS
    msg["To"] = to_email
    msg.attach(MIMEText(body, "plain"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_ADDRESS, to_email, msg.as_string())


# ---------------------------------------------------------------------------
# Preview endpoint — returns who would receive emails and their matched skills
# ---------------------------------------------------------------------------

@router.get("/api/email/preview/{event_id}")
async def preview_event_emails(event_id: int, db: AsyncSession = Depends(get_db)):
    event, required_skills = await get_event_with_skills(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    vol_result = await db.execute(
        select(Volunteer).where(Volunteer.is_active == True, Volunteer.email != None)
    )
    volunteers = vol_result.scalars().all()

    recipients = []
    for volunteer in volunteers:
        volunteer_skills = await get_volunteer_skills(db, volunteer.id)
        matched = [s for s in required_skills if s in volunteer_skills]
        recipients.append({
            "id": volunteer.id,
            "name": f"{volunteer.first_name} {volunteer.last_name}",
            "email": volunteer.email,
            "matched_skills": matched,
            "all_skills": volunteer_skills,
        })

    return {
        "event_name": event.name,
        "required_skills": required_skills,
        "recipients": recipients,
    }


# ---------------------------------------------------------------------------
# Send endpoint — accepts a list of volunteer IDs to send to
# ---------------------------------------------------------------------------

class SendRequest(BaseModel):
    volunteer_ids: list[int]


@router.post("/api/email/send-event-emails/{event_id}")
async def send_event_emails(
    event_id: int,
    payload: SendRequest,
    db: AsyncSession = Depends(get_db),
):
    if not GMAIL_ADDRESS or not GMAIL_APP_PASSWORD:
        raise HTTPException(
            status_code=500,
            detail="GMAIL_ADDRESS and GMAIL_APP_PASSWORD must be set in .env"
        )

    event, required_skills = await get_event_with_skills(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    other_events = await get_upcoming_events(db, exclude_id=event_id)

    vol_result = await db.execute(
        select(Volunteer).where(Volunteer.id.in_(payload.volunteer_ids))
    )
    volunteers = vol_result.scalars().all()

    sent_count = 0
    errors = []

    for volunteer in volunteers:
        volunteer_skills = await get_volunteer_skills(db, volunteer.id)
        matched = [s for s in required_skills if s in volunteer_skills]
        volunteer_name = f"{volunteer.first_name} {volunteer.last_name}"
        subject = f"Volunteer Opportunity: {event.name} — Science Museum Oklahoma"

        try:
            body = await generate_email(
                volunteer_name=volunteer_name,
                event=event,
                matched_skills=matched,
                volunteer_skills=volunteer_skills,
                other_events=other_events,
            )
            send_gmail(volunteer.email, subject, body)
            sent_count += 1
        except Exception as e:
            errors.append(f"{volunteer.email}: {str(e)}")

    return {
        "sent_count": sent_count,
        "errors": errors,
        "message": f"Emails sent to {sent_count} volunteer(s) for event '{event.name}'.",
    }
