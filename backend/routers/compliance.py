from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from models.database import get_db, ComplianceSnapshot, ResourceViolation
from services.audit import run_audit
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/compliance", tags=["compliance"])


class AuditRequest(BaseModel):
    account_id: str
    region: Optional[str] = "us-east-1"


@router.post("/audit")
def trigger_audit(req: AuditRequest, db: Session = Depends(get_db)):
    """Run an on-demand compliance audit for an AWS account."""
    result = run_audit(req.account_id, req.region)
    
    # Persist snapshot
    snapshot = ComplianceSnapshot(
        account_id=req.account_id,
        timestamp=datetime.now(timezone.utc),
        total_resources=result["total_resources"],
        compliant_resources=result["compliant_resources"],
        compliance_score=result["compliance_score"],
        violations=result["violations"],
        summary=result["summary"],
    )
    db.add(snapshot)
    
    # Persist individual violations
    for v in result["violations"]:
        violation = ResourceViolation(
            account_id=req.account_id,
            resource_id=v["resource_id"],
            resource_type=v["resource_type"],
            violation_type=v["violation_type"],
            severity=v["severity"],
            description=v["description"],
            remediation=v["remediation"],
            region=v.get("region", "us-east-1"),
        )
        db.add(violation)
    
    db.commit()
    return result


@router.get("/snapshots/{account_id}")
def get_snapshots(account_id: str, limit: int = 30, db: Session = Depends(get_db)):
    """Retrieve compliance snapshot history for trend visualization."""
    snapshots = (
        db.query(ComplianceSnapshot)
        .filter(ComplianceSnapshot.account_id == account_id)
        .order_by(ComplianceSnapshot.timestamp.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": s.id,
            "timestamp": s.timestamp.isoformat(),
            "compliance_score": s.compliance_score,
            "total_resources": s.total_resources,
            "compliant_resources": s.compliant_resources,
            "summary": s.summary,
            "violation_count": len(s.violations) if s.violations else 0,
        }
        for s in reversed(snapshots)
    ]


@router.get("/violations/{account_id}")
def get_violations(
    account_id: str,
    severity: Optional[str] = None,
    resource_type: Optional[str] = None,
    resolved: Optional[bool] = False,
    db: Session = Depends(get_db),
):
    """Get current violations with optional filters."""
    q = db.query(ResourceViolation).filter(ResourceViolation.account_id == account_id)
    if severity:
        q = q.filter(ResourceViolation.severity == severity)
    if resource_type:
        q = q.filter(ResourceViolation.resource_type == resource_type)
    if resolved is not None:
        q = q.filter(ResourceViolation.resolved == resolved)
    
    violations = q.order_by(ResourceViolation.detected_at.desc()).all()
    return [
        {
            "id": v.id,
            "resource_id": v.resource_id,
            "resource_type": v.resource_type,
            "violation_type": v.violation_type,
            "severity": v.severity,
            "description": v.description,
            "remediation": v.remediation,
            "region": v.region,
            "detected_at": v.detected_at.isoformat(),
            "resolved": v.resolved,
        }
        for v in violations
    ]


@router.patch("/violations/{violation_id}/resolve")
def resolve_violation(violation_id: int, db: Session = Depends(get_db)):
    """Mark a violation as resolved."""
    v = db.query(ResourceViolation).filter(ResourceViolation.id == violation_id).first()
    if not v:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Violation not found")
    v.resolved = True
    db.commit()
    return {"status": "resolved", "id": violation_id}


@router.get("/summary/{account_id}")
def get_summary(account_id: str, db: Session = Depends(get_db)):
    """Get latest compliance summary for the dashboard header."""
    latest = (
        db.query(ComplianceSnapshot)
        .filter(ComplianceSnapshot.account_id == account_id)
        .order_by(ComplianceSnapshot.timestamp.desc())
        .first()
    )
    if not latest:
        return {"account_id": account_id, "status": "no_data"}
    
    open_violations = db.query(ResourceViolation).filter(
        ResourceViolation.account_id == account_id,
        ResourceViolation.resolved == False
    ).count()
    
    return {
        "account_id": account_id,
        "last_audit": latest.timestamp.isoformat(),
        "compliance_score": latest.compliance_score,
        "total_resources": latest.total_resources,
        "open_violations": open_violations,
        "summary": latest.summary,
    }
