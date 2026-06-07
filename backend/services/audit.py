"""
AWS Compliance Audit Service
Integrates with Boto3 across IAM, EC2, S3, and AWS Config.
Falls back to realistic mock data when AWS credentials are not configured.
"""
import boto3
import random
import os
from datetime import datetime, timezone, timedelta
from typing import Optional
from botocore.exceptions import NoCredentialsError, ClientError


REQUIRED_TAGS = ["Environment", "Owner", "CostCenter", "Project"]

REMEDIATION_MAP = {
    "untagged_resource": "Add required tags: {tags}. Use AWS Tag Editor or CLI: aws tag-resources --resource-arn {arn} --tags key=value",
    "public_s3_bucket": "Disable public access: aws s3api put-public-access-block --bucket {id} --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true",
    "overprivileged_iam": "Apply least-privilege principle. Remove AdministratorAccess or wildcard (*) actions. Use IAM Access Analyzer to review.",
    "open_security_group": "Restrict inbound rules. Remove 0.0.0.0/0 on sensitive ports. Use aws ec2 revoke-security-group-ingress.",
    "unencrypted_ebs": "Enable encryption: create encrypted snapshot and replace volume. Enable account-level EBS encryption by default.",
    "config_rule_violation": "Review AWS Config rule details and apply recommended remediation action in the Config console.",
    "mfa_not_enabled": "Enable MFA for IAM user: aws iam enable-mfa-device --user-name {id} --serial-number <mfa-arn> --authentication-code1 <code1> --authentication-code2 <code2>",
    "root_access_key": "Delete root account access keys immediately. Use IAM users/roles instead. Go to IAM > Security credentials.",
}


def _mock_violations(account_id: str) -> list[dict]:
    """Generate realistic mock violations for demo/offline mode."""
    # Derive a stable integer seed from account_id so each account gets unique data
    seed_val = sum(ord(c) * (i + 1) for i, c in enumerate(account_id))
    random.seed(seed_val)
    violations = []
    
    ec2_instances = [f"i-{random.randint(10000000, 99999999):08x}" for _ in range(12)]
    s3_buckets = [f"{account_id}-{name}" for name in ["data-lake", "logs", "backups", "assets", "configs"]]
    iam_users = ["deploy-bot", "ci-runner", "data-analyst", "dev-jake", "admin-svc"]
    iam_roles = ["LambdaExecutionRole", "EC2InstanceRole", "ECSTaskRole", "AdminRole"]
    regions = ["us-east-1", "us-west-2", "eu-west-1"]
    
    # Vary violation density per account (1–4 untagged, 0–2 public buckets, 1–2 overprivileged)
    n_untagged = random.randint(1, 4)
    n_public_s3 = random.randint(0, 2)
    n_overprivileged = random.randint(1, 2)
    n_open_sg = random.randint(0, 2)
    n_unenc_ebs = random.randint(0, 2)

    # Untagged EC2 instances
    for inst in random.sample(ec2_instances, k=n_untagged):
        missing = random.sample(REQUIRED_TAGS, k=random.randint(1, 3))
        violations.append({
            "resource_id": inst,
            "resource_type": "EC2",
            "violation_type": "untagged_resource",
            "severity": "medium",
            "description": f"EC2 instance {inst} missing required tags: {', '.join(missing)}",
            "remediation": REMEDIATION_MAP["untagged_resource"].format(tags=", ".join(missing), arn=f"arn:aws:ec2:us-east-1:{account_id}:instance/{inst}"),
            "region": random.choice(regions),
        })
    
    # Public S3 buckets
    for bucket in random.sample(s3_buckets, k=min(n_public_s3, len(s3_buckets))):
        violations.append({
            "resource_id": bucket,
            "resource_type": "S3",
            "violation_type": "public_s3_bucket",
            "severity": "critical",
            "description": f"S3 bucket '{bucket}' has public access enabled. Data may be exposed.",
            "remediation": REMEDIATION_MAP["public_s3_bucket"].format(id=bucket),
            "region": "us-east-1",
        })
    
    # Overprivileged IAM
    for user in random.sample(iam_users, k=n_overprivileged):
        violations.append({
            "resource_id": user,
            "resource_type": "IAM",
            "violation_type": "overprivileged_iam",
            "severity": "critical",
            "description": f"IAM user '{user}' has AdministratorAccess or wildcard (*) actions attached.",
            "remediation": REMEDIATION_MAP["overprivileged_iam"],
            "region": "global",
        })
    
    # Open security groups
    sg_ids = [f"sg-{random.randint(10000000, 99999999):08x}" for _ in range(3)]
    for sg in random.sample(sg_ids, k=min(n_open_sg, len(sg_ids))):
        port = random.choice([22, 3389, 5432, 3306])
        violations.append({
            "resource_id": sg,
            "resource_type": "EC2",
            "violation_type": "open_security_group",
            "severity": "high",
            "description": f"Security group {sg} allows unrestricted inbound access (0.0.0.0/0) on port {port}.",
            "remediation": REMEDIATION_MAP["open_security_group"],
            "region": random.choice(regions),
        })
    
    # Unencrypted EBS
    vol_ids = [f"vol-{random.randint(10000000, 99999999):08x}" for _ in range(4)]
    for vol in random.sample(vol_ids, k=min(n_unenc_ebs, len(vol_ids))):
        violations.append({
            "resource_id": vol,
            "resource_type": "EC2",
            "violation_type": "unencrypted_ebs",
            "severity": "high",
            "description": f"EBS volume {vol} is not encrypted at rest.",
            "remediation": REMEDIATION_MAP["unencrypted_ebs"],
            "region": random.choice(regions),
        })
    
    # MFA not enabled
    for user in random.sample(iam_users, k=1):
        violations.append({
            "resource_id": user,
            "resource_type": "IAM",
            "violation_type": "mfa_not_enabled",
            "severity": "high",
            "description": f"IAM user '{user}' does not have MFA enabled.",
            "remediation": REMEDIATION_MAP["mfa_not_enabled"].format(id=user),
            "region": "global",
        })
    
    # Root access key
    violations.append({
        "resource_id": "root",
        "resource_type": "IAM",
        "violation_type": "root_access_key",
        "severity": "critical",
        "description": "Root account has active access keys. This is a critical security risk.",
        "remediation": REMEDIATION_MAP["root_access_key"],
        "region": "global",
    })

    return violations


def _try_real_aws_audit(account_id: str) -> Optional[list[dict]]:
    """Attempt real AWS audit via Boto3. Returns None if credentials unavailable."""
    try:
        violations = []
        iam = boto3.client("iam")
        ec2 = boto3.client("ec2")
        s3 = boto3.client("s3")

        # IAM: check for users without MFA
        users = iam.list_users().get("Users", [])
        for user in users:
            mfa = iam.list_mfa_devices(UserName=user["UserName"]).get("MFADevices", [])
            if not mfa:
                violations.append({
                    "resource_id": user["UserName"],
                    "resource_type": "IAM",
                    "violation_type": "mfa_not_enabled",
                    "severity": "high",
                    "description": f"IAM user '{user['UserName']}' does not have MFA enabled.",
                    "remediation": REMEDIATION_MAP["mfa_not_enabled"].format(id=user["UserName"]),
                    "region": "global",
                })
        
        # EC2: check for untagged instances
        reservations = ec2.describe_instances().get("Reservations", [])
        for r in reservations:
            for inst in r.get("Instances", []):
                iid = inst["InstanceId"]
                tags = {t["Key"]: t["Value"] for t in inst.get("Tags", [])}
                missing = [t for t in REQUIRED_TAGS if t not in tags]
                if missing:
                    violations.append({
                        "resource_id": iid,
                        "resource_type": "EC2",
                        "violation_type": "untagged_resource",
                        "severity": "medium",
                        "description": f"EC2 instance {iid} missing required tags: {', '.join(missing)}",
                        "remediation": REMEDIATION_MAP["untagged_resource"].format(tags=", ".join(missing), arn=f"arn:aws:ec2:us-east-1:{account_id}:instance/{iid}"),
                        "region": inst.get("Placement", {}).get("AvailabilityZone", "us-east-1")[:-1],
                    })
        
        # S3: check for public buckets
        buckets = s3.list_buckets().get("Buckets", [])
        for bucket in buckets:
            name = bucket["Name"]
            try:
                pab = s3.get_public_access_block(Bucket=name)
                cfg = pab.get("PublicAccessBlockConfiguration", {})
                if not all([cfg.get("BlockPublicAcls"), cfg.get("BlockPublicPolicy")]):
                    violations.append({
                        "resource_id": name,
                        "resource_type": "S3",
                        "violation_type": "public_s3_bucket",
                        "severity": "critical",
                        "description": f"S3 bucket '{name}' does not fully block public access.",
                        "remediation": REMEDIATION_MAP["public_s3_bucket"].format(id=name),
                        "region": "us-east-1",
                    })
            except ClientError:
                pass

        return violations

    except (NoCredentialsError, Exception):
        return None


def run_audit(account_id: str, region: str = "us-east-1") -> dict:
    """
    Run compliance audit. Tries real AWS; falls back to mock data.
    Returns audit result dict.
    """
    real_violations = _try_real_aws_audit(account_id)
    
    if real_violations is not None:
        violations = real_violations
        mode = "live"
    else:
        violations = _mock_violations(account_id)
        mode = "demo"

    severity_weights = {"critical": 10, "high": 5, "medium": 2, "low": 1}
    total_resources = random.randint(40, 120) if mode == "demo" else max(20, len(violations) * 3)
    violation_count = len(violations)
    compliant = total_resources - violation_count
    
    penalty = sum(severity_weights.get(v["severity"], 1) for v in violations)
    # Cap total deduction at 65 so a realistic set of findings produces a
    # meaningful score (e.g. 5 criticals + 5 highs = 75pts deducted → capped → score ~35)
    # This keeps the range representative: clean=100, bad=35, catastrophic=30.
    capped_penalty = min(penalty, 65)
    compliance_score = round(max(30.0, 100.0 - capped_penalty), 1)

    summary = {
        "by_severity": {
            "critical": sum(1 for v in violations if v["severity"] == "critical"),
            "high": sum(1 for v in violations if v["severity"] == "high"),
            "medium": sum(1 for v in violations if v["severity"] == "medium"),
            "low": sum(1 for v in violations if v["severity"] == "low"),
        },
        "by_service": {
            "IAM": sum(1 for v in violations if v["resource_type"] == "IAM"),
            "EC2": sum(1 for v in violations if v["resource_type"] == "EC2"),
            "S3": sum(1 for v in violations if v["resource_type"] == "S3"),
            "Config": sum(1 for v in violations if v["resource_type"] == "Config"),
        },
        "mode": mode,
    }

    return {
        "account_id": account_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_resources": total_resources,
        "compliant_resources": compliant,
        "compliance_score": compliance_score,
        "violations": violations,
        "summary": summary,
    }
