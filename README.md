# CloudWatch Governance Dashboard

AWS Account Compliance Auditing & Remediation Tool



## Architecture

```
backend/          FastAPI service (Python 3.11)
├── main.py       App entrypoint, CORS, startup
├── models/       SQLAlchemy models (ComplianceSnapshot, ResourceViolation)
├── routers/      REST endpoints (/compliance/*)
└── services/     Boto3 audit logic (IAM, EC2, S3, Config)

frontend/         React dashboard (Vite + Recharts)
└── src/
    ├── components/  MetricCard, ViolationTable, TrendChart
    └── pages/       Dashboard, AuditHistory
```

## Running locally (quickstart — no AWS needed)

**Requirements:** Python 3.11–3.13 (not 3.14), Node.js 18+

```bash
# 1. Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn boto3 sqlalchemy
uvicorn main:app --reload
# API live at http://localhost:8000
# Docs at http://localhost:8000/docs

# 2. Frontend
cd frontend
npm install
npm run dev
# Dashboard at http://localhost:5173
```

The service auto-detects missing AWS credentials and uses realistic **demo mode** (mock data seeded by account ID). No AWS account required to demo.

## Running with Docker (includes PostgreSQL)

```bash
docker-compose up --build
```

## With real AWS credentials

Set environment variables before starting:
```bash
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_REGION=us-east-1
uvicorn main:app --reload
```

Required IAM permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "iam:ListUsers", "iam:ListMFADevices", "iam:ListAttachedUserPolicies",
      "ec2:DescribeInstances", "ec2:DescribeSecurityGroups", "ec2:DescribeVolumes",
      "s3:ListAllMyBuckets", "s3:GetPublicAccessBlock",
      "config:GetComplianceDetailsByConfigRule", "config:DescribeConfigRules",
      "tag:GetResources"
    ],
    "Resource": "*"
  }]
}
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/compliance/audit` | Run on-demand audit |
| GET | `/compliance/summary/{account_id}` | Latest compliance summary |
| GET | `/compliance/snapshots/{account_id}` | Historical snapshots (for trend chart) |
| GET | `/compliance/violations/{account_id}` | Open violations with filters |
| PATCH | `/compliance/violations/{id}/resolve` | Mark violation resolved |

### Example: trigger audit
```bash
curl -X POST http://localhost:8000/compliance/audit \
  -H "Content-Type: application/json" \
  -d '{"account_id": "123456789012", "region": "us-east-1"}'
```

## What it checks

| Service | Check | Severity |
|---------|-------|----------|
| IAM | Root account access keys active | Critical |
| IAM | Users without MFA | High |
| IAM | Wildcard / AdministratorAccess policies | Critical |
| S3 | Public access block not enabled | Critical |
| S3 | Missing required tags | Medium |
| EC2 | Security groups open to 0.0.0.0/0 | High |
| EC2 | Unencrypted EBS volumes | High |
| EC2 | Instances missing required tags | Medium |
| Config | Non-compliant Config rules | Low–High |

## Tech stack
- **Backend**: Python 3.11, FastAPI, Boto3, SQLAlchemy, PostgreSQL/SQLite
- **Frontend**: React, Recharts, Axios
- **Infra**: Docker Compose, Uvicorn
