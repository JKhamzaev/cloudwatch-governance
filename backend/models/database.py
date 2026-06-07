from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, JSON, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./compliance.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class ComplianceSnapshot(Base):
    __tablename__ = "compliance_snapshots"
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(String, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    total_resources = Column(Integer, default=0)
    compliant_resources = Column(Integer, default=0)
    compliance_score = Column(Float, default=0.0)
    violations = Column(JSON, default=[])
    summary = Column(JSON, default={})


class ResourceViolation(Base):
    __tablename__ = "resource_violations"
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(String, index=True)
    resource_id = Column(String)
    resource_type = Column(String)   # IAM, EC2, S3, Config
    violation_type = Column(String)  # untagged, misconfigured, iam_violation
    severity = Column(String)        # critical, high, medium, low
    description = Column(Text)
    remediation = Column(Text)
    detected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved = Column(Boolean, default=False)
    region = Column(String, default="us-east-1")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
