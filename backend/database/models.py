"""
SQLAlchemy 2.x ORM models for the Science Museum Volunteer Management System.
All timestamp columns use timezone-aware DateTime.
"""

from datetime import datetime, time, date
from typing import Optional, List

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------

class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# Chatbot semantic cache
# ---------------------------------------------------------------------------

class ChatCache(Base):
    __tablename__ = "chat_cache"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[str] = mapped_column(Text, nullable=False)  # JSON-serialised float list
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )

    def __repr__(self) -> str:
        return f"<ChatCache id={self.id} question='{self.question[:40]}...'>"


# ---------------------------------------------------------------------------
# Core Volunteer Tables
# ---------------------------------------------------------------------------

class Volunteer(Base):
    __tablename__ = "volunteers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[str] = mapped_column(String(2), nullable=False, default="OK")
    zip: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    age_group: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    ethnicity: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    hispanic_latino: Mapped[Optional[str]] = mapped_column(String(3), nullable=True)  # "Yes" / "No"
    dietary_restrictions: Mapped[str] = mapped_column(String(100), nullable=False, default="None")
    life_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    last_activity: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
  

    # Relationships
    emergency_contacts: Mapped[List["EmergencyContact"]] = relationship(
        "EmergencyContact", back_populates="volunteer", cascade="all, delete-orphan"
    )
    volunteer_skills: Mapped[List["VolunteerSkill"]] = relationship(
        "VolunteerSkill", back_populates="volunteer", cascade="all, delete-orphan"
    )
    volunteer_certifications: Mapped[List["VolunteerCertification"]] = relationship(
        "VolunteerCertification", back_populates="volunteer", cascade="all, delete-orphan"
    )
    availability: Mapped[List["Availability"]] = relationship(
        "Availability", back_populates="volunteer", cascade="all, delete-orphan"
    )
    volunteer_programs: Mapped[List["VolunteerProgram"]] = relationship(
        "VolunteerProgram", back_populates="volunteer", cascade="all, delete-orphan"
    )
    shift_assignments: Mapped[List["ShiftAssignment"]] = relationship(
        "ShiftAssignment", back_populates="volunteer", cascade="all, delete-orphan"
    )
    volunteer_hours: Mapped[List["VolunteerHours"]] = relationship(
        "VolunteerHours", back_populates="volunteer", cascade="all, delete-orphan"
    )
    communications: Mapped[List["Communication"]] = relationship(
        "Communication", back_populates="volunteer", cascade="all, delete-orphan"
    )
    status_history: Mapped[List["VolunteerStatusHistory"]] = relationship(
        "VolunteerStatusHistory", back_populates="volunteer", cascade="all, delete-orphan"
    )
    agent_recommendations: Mapped[List["AgentRecommendation"]] = relationship(
        "AgentRecommendation", back_populates="volunteer"
    )
    
    def __repr__(self) -> str:
        return f"<Volunteer id={self.id} name='{self.first_name} {self.last_name}'>"


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    volunteer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("volunteers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    relation_type: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    volunteer: Mapped["Volunteer"] = relationship("Volunteer", back_populates="emergency_contacts")

    def __repr__(self) -> str:
        return f"<EmergencyContact id={self.id} name='{self.name}' volunteer_id={self.volunteer_id}>"


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    volunteer_skills: Mapped[List["VolunteerSkill"]] = relationship(
        "VolunteerSkill", back_populates="skill", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Skill id={self.id} name='{self.name}' category='{self.category}'>"


class VolunteerSkill(Base):
    __tablename__ = "volunteer_skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    volunteer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("volunteers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    skill_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True
    )
    proficiency_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    acquired_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    volunteer: Mapped["Volunteer"] = relationship("Volunteer", back_populates="volunteer_skills")
    skill: Mapped["Skill"] = relationship("Skill", back_populates="volunteer_skills")

    def __repr__(self) -> str:
        return (
            f"<VolunteerSkill id={self.id} volunteer_id={self.volunteer_id} "
            f"skill_id={self.skill_id} level='{self.proficiency_level}'>"
        )


class Certification(Base):
    __tablename__ = "certifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    valid_duration_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    volunteer_certifications: Mapped[List["VolunteerCertification"]] = relationship(
        "VolunteerCertification", back_populates="certification", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Certification id={self.id} name='{self.name}'>"


class VolunteerCertification(Base):
    __tablename__ = "volunteer_certifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    volunteer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("volunteers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    certification_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("certifications.id", ondelete="CASCADE"), nullable=False, index=True
    )
    completed_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    issued_by: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    volunteer: Mapped["Volunteer"] = relationship(
        "Volunteer", back_populates="volunteer_certifications"
    )
    certification: Mapped["Certification"] = relationship(
        "Certification", back_populates="volunteer_certifications"
    )

    def __repr__(self) -> str:
        return (
            f"<VolunteerCertification id={self.id} volunteer_id={self.volunteer_id} "
            f"certification_id={self.certification_id}>"
        )


class Availability(Base):
    __tablename__ = "availability"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    volunteer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("volunteers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)  # 0=Monday … 6=Sunday
    start_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    end_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)

    volunteer: Mapped["Volunteer"] = relationship("Volunteer", back_populates="availability")

    def __repr__(self) -> str:
        return (
            f"<Availability id={self.id} volunteer_id={self.volunteer_id} "
            f"day={self.day_of_week} {self.start_time}-{self.end_time}>"
        )


# ---------------------------------------------------------------------------
# Programs & Events
# ---------------------------------------------------------------------------

class Program(Base):
    __tablename__ = "programs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    volunteer_programs: Mapped[List["VolunteerProgram"]] = relationship(
        "VolunteerProgram", back_populates="program", cascade="all, delete-orphan"
    )
    events: Mapped[List["Event"]] = relationship(
        "Event", back_populates="program"
    )

    def __repr__(self) -> str:
        return f"<Program id={self.id} name='{self.name}' department='{self.department}'>"


class VolunteerProgram(Base):
    __tablename__ = "volunteer_programs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    volunteer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("volunteers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    program_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("programs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(String(100), nullable=False, default="Volunteer")
    enrolled_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    left_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    volunteer: Mapped["Volunteer"] = relationship("Volunteer", back_populates="volunteer_programs")
    program: Mapped["Program"] = relationship("Program", back_populates="volunteer_programs")

    def __repr__(self) -> str:
        return (
            f"<VolunteerProgram id={self.id} volunteer_id={self.volunteer_id} "
            f"program_id={self.program_id} role='{self.role}'>"
        )


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    program_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("programs.id", ondelete="SET NULL"), nullable=True, index=True
    )
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    start_datetime: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    end_datetime: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    max_volunteers: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_cancelled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    program: Mapped[Optional["Program"]] = relationship("Program", back_populates="events")
    shifts: Mapped[List["Shift"]] = relationship(
        "Shift", back_populates="event", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Event id={self.id} name='{self.name}' start='{self.start_datetime}'>"


class Shift(Base):
    __tablename__ = "shifts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    event_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    start_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    end_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    role_required: Mapped[str] = mapped_column(String(100), nullable=False, default="General")
    max_volunteers: Mapped[int] = mapped_column(Integer, nullable=False, default=10)

    event: Mapped["Event"] = relationship("Event", back_populates="shifts")
    shift_assignments: Mapped[List["ShiftAssignment"]] = relationship(
        "ShiftAssignment", back_populates="shift", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return (
            f"<Shift id={self.id} event_id={self.event_id} "
            f"role='{self.role_required}' start='{self.start_time}'>"
        )


class ShiftAssignment(Base):
    __tablename__ = "shift_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    shift_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("shifts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    volunteer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("volunteers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Confirmed")
    assigned_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    checked_in_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    checked_out_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    shift: Mapped["Shift"] = relationship("Shift", back_populates="shift_assignments")
    volunteer: Mapped["Volunteer"] = relationship("Volunteer", back_populates="shift_assignments")
    volunteer_hours: Mapped[List["VolunteerHours"]] = relationship(
        "VolunteerHours", back_populates="shift_assignment"
    )

    def __repr__(self) -> str:
        return (
            f"<ShiftAssignment id={self.id} shift_id={self.shift_id} "
            f"volunteer_id={self.volunteer_id} status='{self.status}'>"
        )


# ---------------------------------------------------------------------------
# Engagement & Communication
# ---------------------------------------------------------------------------

class VolunteerHours(Base):
    __tablename__ = "volunteer_hours"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    volunteer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("volunteers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    shift_assignment_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("shift_assignments.id", ondelete="SET NULL"), nullable=True, index=True
    )
    log_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    hours: Mapped[float] = mapped_column(Float, nullable=False)
    activity_type: Mapped[str] = mapped_column(String(100), nullable=False, default="Event Support")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    volunteer: Mapped["Volunteer"] = relationship("Volunteer", back_populates="volunteer_hours")
    shift_assignment: Mapped[Optional["ShiftAssignment"]] = relationship(
        "ShiftAssignment", back_populates="volunteer_hours"
    )

    def __repr__(self) -> str:
        return (
            f"<VolunteerHours id={self.id} volunteer_id={self.volunteer_id} "
            f"date='{self.date}' hours={self.hours}>"
        )


class Communication(Base):
    __tablename__ = "communications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    volunteer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("volunteers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    channel: Mapped[str] = mapped_column(String(50), nullable=False)
    direction: Mapped[str] = mapped_column(String(20), nullable=False)
    subject: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    sent_by: Mapped[str] = mapped_column(String(200), nullable=False, default="System")

    volunteer: Mapped["Volunteer"] = relationship("Volunteer", back_populates="communications")

    def __repr__(self) -> str:
        return (
            f"<Communication id={self.id} volunteer_id={self.volunteer_id} "
            f"channel='{self.channel}' direction='{self.direction}'>"
        )


class VolunteerStatusHistory(Base):
    __tablename__ = "volunteer_status_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    volunteer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("volunteers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    changed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    volunteer: Mapped["Volunteer"] = relationship("Volunteer", back_populates="status_history")

    def __repr__(self) -> str:
        return (
            f"<VolunteerStatusHistory id={self.id} volunteer_id={self.volunteer_id} "
            f"status='{self.status}' changed_at='{self.changed_at}'>"
        )


# ---------------------------------------------------------------------------
# AI Agent Support
# ---------------------------------------------------------------------------

class AgentRun(Base):
    __tablename__ = "agent_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    agent_name: Mapped[str] = mapped_column(String(200), nullable=False)
    triggered_by: Mapped[str] = mapped_column(String(50), nullable=False)
    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    finished_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Running")
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    records_processed: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    insights: Mapped[List["AgentInsight"]] = relationship(
        "AgentInsight", back_populates="agent_run", cascade="all, delete-orphan"
    )
    recommendations: Mapped[List["AgentRecommendation"]] = relationship(
        "AgentRecommendation", back_populates="agent_run", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return (
            f"<AgentRun id={self.id} agent='{self.agent_name}' "
            f"status='{self.status}' started='{self.started_at}'>"
        )


class AgentInsight(Base):
    __tablename__ = "agent_insights"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    agent_run_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("agent_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    insight_type: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False, default="Info")
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    agent_run: Mapped["AgentRun"] = relationship("AgentRun", back_populates="insights")

    def __repr__(self) -> str:
        return (
            f"<AgentInsight id={self.id} agent_run_id={self.agent_run_id} "
            f"type='{self.insight_type}' severity='{self.severity}'>"
        )


class AgentRecommendation(Base):
    __tablename__ = "agent_recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    agent_run_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("agent_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    volunteer_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("volunteers.id", ondelete="SET NULL"), nullable=True, index=True
    )
    recommendation_type: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="Medium")
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Pending")
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    agent_run: Mapped["AgentRun"] = relationship("AgentRun", back_populates="recommendations")
    volunteer: Mapped[Optional["Volunteer"]] = relationship(
        "Volunteer", back_populates="agent_recommendations"
    )

    def __repr__(self) -> str:
        return (
            f"<AgentRecommendation id={self.id} agent_run_id={self.agent_run_id} "
            f"type='{self.recommendation_type}' priority='{self.priority}' status='{self.status}'>"
        )


class DataPipelineRun(Base):
    __tablename__ = "data_pipeline_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    pipeline_name: Mapped[str] = mapped_column(String(200), nullable=False)
    source: Mapped[str] = mapped_column(String(100), nullable=False)
    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    finished_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Running")
    records_ingested: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    records_failed: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    error_log: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    def __repr__(self) -> str:
        return (
            f"<DataPipelineRun id={self.id} pipeline='{self.pipeline_name}' "
            f"source='{self.source}' status='{self.status}'>"
        )
