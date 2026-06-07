from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models.database import init_db
from routers.compliance import router as compliance_router

app = FastAPI(
    title="CloudWatch Governance API",
    description="AWS Account Compliance Auditing & Remediation Service",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(compliance_router)


@app.on_event("startup")
def startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok", "service": "CloudWatch Governance API"}


@app.get("/")
def root():
    return {
        "service": "CloudWatch Governance API",
        "docs": "/docs",
        "endpoints": [
            "POST /compliance/audit",
            "GET /compliance/snapshots/{account_id}",
            "GET /compliance/violations/{account_id}",
            "PATCH /compliance/violations/{violation_id}/resolve",
            "GET /compliance/summary/{account_id}",
        ],
    }
