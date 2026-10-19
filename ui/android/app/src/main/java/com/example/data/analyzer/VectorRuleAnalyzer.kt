package com.example.data.analyzer

import com.example.data.model.AnalysisResult
import com.example.data.model.AwsResource
import com.example.data.model.ExamplePrompt
import com.example.data.model.FindingType
import com.example.data.model.RiskLevel
import com.example.data.model.SecurityFinding
import com.example.data.repository.AnalyzerRepository
import kotlinx.coroutines.delay
import java.util.UUID

class VectorRuleAnalyzer : AnalyzerRepository {

    override fun isDeepScanAvailable(): Boolean = false

    override fun getExamplePrompts(): List<ExamplePrompt> {
        return listOf(
            ExamplePrompt(
                id = "ex_1",
                title = "Example 1 (Basic S3)",
                text = "Create an S3 bucket for storing application documents."
            ),
            ExamplePrompt(
                id = "ex_2",
                title = "Example 2 (Multi-tier Web App)",
                text = "Deploy an EC2 instance running a web application behind a load balancer, connect it to an RDS database, and store uploaded documents in S3."
            ),
            ExamplePrompt(
                id = "ex_3",
                title = "Example 3 (High-Risk Exposed)",
                text = "Create a public S3 bucket for customer documents and launch an EC2 instance with SSH open to 0.0.0.0/0."
            )
        )
    }

    override suspend fun analyze(prompt: String, isDeepScan: Boolean): AnalysisResult {
        // Simulate NLP parsing time for realistic feel
        delay(450)

        val trimmed = prompt.trim()
        val lower = trimmed.lowercase()

        val detectedResources = detectResources(lower)
        val findings = mutableListOf<SecurityFinding>()

        // 1. Detect Risky Statements
        val riskyFindings = detectRiskyStatements(lower, trimmed)
        findings.addAll(riskyFindings)

        // 2. Detect Existing Controls vs Missing Controls for detected resources
        val controlFindings = evaluateResourceControls(lower, detectedResources)
        findings.addAll(controlFindings)

        // 3. Compute Metrics
        val missingCount = findings.count { it.type == FindingType.MISSING_CONTROL }
        val detectedCount = findings.count { it.type == FindingType.DETECTED_CONTROL }
        val riskyCount = findings.count { it.type == FindingType.RISKY_STATEMENT }

        // Risk score formula:
        // Base risk = 12
        // Risky statement: +30 to +40
        // Missing control: +12
        // Detected control: -12
        var rawRisk = 12 + (riskyCount * 36) + (missingCount * 14) - (detectedCount * 12)
        if (riskyCount > 0 && rawRisk < 75) {
            rawRisk = 75 + (riskyCount * 8)
        }
        val riskScore = rawRisk.coerceIn(5, 98)

        // Coverage percentage:
        val totalControls = missingCount + detectedCount
        val coverage = if (totalControls > 0) {
            ((detectedCount.toDouble() / totalControls) * 100).toInt().coerceIn(0, 100)
        } else {
            0
        }

        // Confidence:
        val confidence = when {
            detectedResources.isNotEmpty() && (riskyCount > 0 || missingCount > 0) -> 95
            detectedResources.isNotEmpty() -> 90
            else -> 85
        }

        return AnalysisResult(
            id = UUID.randomUUID().toString(),
            prompt = trimmed,
            timestamp = System.currentTimeMillis(),
            riskScore = riskScore,
            riskLevel = RiskLevel.fromScore(riskScore),
            securityCoverage = coverage,
            confidence = confidence,
            detectedResources = detectedResources,
            findings = findings,
            isDemo = false,
            engineVersion = if (isDeepScan) "Vector DeepScan (Simulated Offline Mode)" else "Vector-Core 1.2.0 (Rule-based NLP)"
        )
    }

    override fun buildImprovedPrompt(originalPrompt: String, selectedClauses: List<String>): String {
        if (selectedClauses.isEmpty()) return originalPrompt

        val cleanedPrompt = originalPrompt.trimEnd()
        val clausesList = selectedClauses.joinToString("\n") { "- $it" }

        return "$cleanedPrompt\n\nSecurity requirements:\n$clausesList"
    }

    private fun detectResources(lower: String): List<AwsResource> {
        val resources = mutableListOf<AwsResource>()

        if (lower.contains("s3") || lower.contains("bucket") || lower.contains("storage")) {
            resources.add(AwsResource("s3", "Amazon S3", "S3", "Object Storage"))
        }
        if (lower.contains("ec2") || lower.contains("instance") || lower.contains("virtual machine") || lower.contains("server")) {
            resources.add(AwsResource("ec2", "Amazon EC2", "EC2", "Compute"))
        }
        if (lower.contains("rds") || lower.contains("database") || lower.contains("postgres") || lower.contains("mysql") || lower.contains("aurora")) {
            resources.add(AwsResource("rds", "Amazon RDS", "RDS", "Database"))
        }
        if (lower.contains("load balancer") || lower.contains("alb") || lower.contains("elb") || lower.contains("nlb")) {
            resources.add(AwsResource("alb", "Application Load Balancer", "ALB", "Networking"))
        }
        if (lower.contains("vpc") || lower.contains("subnet") || lower.contains("cidr") || lower.contains("network")) {
            resources.add(AwsResource("vpc", "Amazon VPC", "VPC", "Networking"))
        }
        if (lower.contains("lambda") || lower.contains("serverless") || lower.contains("function")) {
            resources.add(AwsResource("lambda", "AWS Lambda", "Lambda", "Compute"))
        }
        if (lower.contains("iam") || lower.contains("role") || lower.contains("policy") || lower.contains("permission")) {
            resources.add(AwsResource("iam", "AWS IAM", "IAM", "Security & Identity"))
        }
        if (lower.contains("dynamodb") || lower.contains("nosql")) {
            resources.add(AwsResource("dynamodb", "Amazon DynamoDB", "DynamoDB", "Database"))
        }

        // If no explicit resource detected but prompt has content, default to generic AWS architecture
        if (resources.isEmpty() && lower.length > 10) {
            resources.add(AwsResource("aws", "AWS Cloud Infrastructure", "AWS", "Cloud"))
        }

        return resources
    }

    private fun detectRiskyStatements(lower: String, originalPrompt: String): List<SecurityFinding> {
        val findings = mutableListOf<SecurityFinding>()

        // Check for public S3
        if ((lower.contains("public s3") || lower.contains("public bucket") || (lower.contains("public") && lower.contains("s3"))) &&
            !lower.contains("block public access")
        ) {
            findings.add(
                SecurityFinding(
                    id = "risk_public_s3",
                    title = "Publicly Exposed S3 Bucket",
                    explanation = "Prompt requests creating a publicly accessible S3 storage bucket, exposing customer or application objects.",
                    severity = RiskLevel.CRITICAL,
                    type = FindingType.RISKY_STATEMENT,
                    affectedResource = "Amazon S3",
                    whyItMatters = "Public S3 buckets are one of the most common causes of massive cloud data breaches, violating GDPR, HIPAA, and SOC2 compliance.",
                    recommendedFix = "Enable AWS S3 Block Public Access at the bucket and account level and serve public files exclusively via CloudFront CDN with Origin Access Control.",
                    securityClause = "Configure the S3 bucket with Block Public Access enabled and disallow public ACLs or public bucket policies."
                )
            )
        }

        // Check for open SSH / 0.0.0.0/0
        if (lower.contains("0.0.0.0/0") || lower.contains("open to all") || lower.contains("open ssh") ||
            (lower.contains("ssh") && lower.contains("open"))
        ) {
            findings.add(
                SecurityFinding(
                    id = "risk_open_ssh",
                    title = "Unrestricted SSH Access (0.0.0.0/0)",
                    explanation = "SSH port 22 is exposed to the entire internet without network perimeter restrictions.",
                    severity = RiskLevel.CRITICAL,
                    type = FindingType.RISKY_STATEMENT,
                    affectedResource = "Amazon EC2",
                    whyItMatters = "Opening administrative ports to 0.0.0.0/0 invites automated brute-force attacks, port scanners, and immediate credential stuffing.",
                    recommendedFix = "Replace direct SSH ingress with AWS Systems Manager Session Manager, or restrict port 22 to specific trusted corporate VPN/bastion CIDRs.",
                    securityClause = "EC2 security groups must restrict SSH (port 22) ingress to authorized corporate IP ranges or manage remote access via AWS Systems Manager Session Manager with no inbound ports open."
                )
            )
        }

        // Check for wildcard IAM permissions
        if (lower.contains("wildcard") || lower.contains("admin access") || lower.contains("full access") || lower.contains("administratoraccess")) {
            findings.add(
                SecurityFinding(
                    id = "risk_wildcard_iam",
                    title = "Excessive / Wildcard IAM Privileges",
                    explanation = "Infrastructure prompt grants broad or administrator-level IAM permissions across services.",
                    severity = RiskLevel.HIGH,
                    type = FindingType.RISKY_STATEMENT,
                    affectedResource = "AWS IAM",
                    whyItMatters = "Over-privileged credentials allow attackers to pivot across AWS accounts, delete backups, and escalate administrative access.",
                    recommendedFix = "Apply the principle of least privilege, specifying exact AWS service actions and scoped resource ARNs.",
                    securityClause = "IAM roles and policies must enforce least privilege access, avoiding wildcard ('*') actions and scoping resource ARNs strictly to required services."
                )
            )
        }

        // Check for hard-coded credentials
        if (lower.contains("password=") || lower.contains("secret=") || lower.contains("api_key=") || lower.contains("hardcoded")) {
            findings.add(
                SecurityFinding(
                    id = "risk_hardcoded_creds",
                    title = "Hardcoded Plaintext Credentials",
                    explanation = "Prompt references embedding sensitive secrets, database passwords, or API keys directly in code.",
                    severity = RiskLevel.CRITICAL,
                    type = FindingType.RISKY_STATEMENT,
                    affectedResource = "AWS Secrets Manager",
                    whyItMatters = "Plaintext secrets in templates or configuration files will be checked into source control and exposed to unauthorized personnel.",
                    recommendedFix = "Use AWS Secrets Manager or AWS Systems Manager Parameter Store with KMS encryption.",
                    securityClause = "All database passwords, API tokens, and credentials must be fetched dynamically from AWS Secrets Manager with KMS encryption."
                )
            )
        }

        return findings
    }

    private fun evaluateResourceControls(lower: String, resources: List<AwsResource>): List<SecurityFinding> {
        val findings = mutableListOf<SecurityFinding>()

        val resourceIds = resources.map { it.id }.toSet()

        // S3 Controls
        if (resourceIds.contains("s3")) {
            if (lower.contains("encrypt") || lower.contains("kms") || lower.contains("sse")) {
                findings.add(
                    SecurityFinding(
                        id = "ctrl_s3_encryption_det",
                        title = "S3 Server-Side Encryption Specified",
                        explanation = "Prompt mentions encryption for data at rest.",
                        severity = RiskLevel.LOW,
                        type = FindingType.DETECTED_CONTROL,
                        affectedResource = "Amazon S3",
                        whyItMatters = "Protects data at rest against physical storage theft and complies with regulatory mandates.",
                        recommendedFix = "Verified in prompt.",
                        securityClause = "Enforce SSE-KMS encryption."
                    )
                )
            } else {
                findings.add(
                    SecurityFinding(
                        id = "miss_s3_encryption",
                        title = "Missing S3 Server-Side Encryption (SSE-KMS)",
                        explanation = "No server-side encryption standard was specified for S3 stored objects.",
                        severity = RiskLevel.HIGH,
                        type = FindingType.MISSING_CONTROL,
                        affectedResource = "Amazon S3",
                        whyItMatters = "Unencrypted storage exposes sensitive data if permissions or disk configurations are mismanaged.",
                        recommendedFix = "Configure default server-side encryption using AWS Key Management Service (SSE-KMS) or SSE-S3 with bucket keys.",
                        securityClause = "S3 bucket must enforce server-side encryption with AWS KMS (SSE-KMS) or SSE-S3, using AWS Bucket Keys to reduce KMS cost."
                    )
                )
            }

            if (!lower.contains("block public access") && !lower.contains("public s3") && !lower.contains("public bucket")) {
                findings.add(
                    SecurityFinding(
                        id = "miss_s3_block_public",
                        title = "Missing Explicit S3 Block Public Access",
                        explanation = "S3 bucket definition does not explicitly configure AWS Block Public Access settings.",
                        severity = RiskLevel.HIGH,
                        type = FindingType.MISSING_CONTROL,
                        affectedResource = "Amazon S3",
                        whyItMatters = "Without explicit Block Public Access, subsequent bucket policy modifications or ACLs may inadvertently open data to the public.",
                        recommendedFix = "Enable all four S3 Block Public Access settings: blockPublicAcls, ignorePublicAcls, blockPublicPolicy, and restrictPublicBuckets.",
                        securityClause = "Enforce S3 Block Public Access on the bucket, enabling blockPublicAcls, ignorePublicAcls, blockPublicPolicy, and restrictPublicBuckets."
                    )
                )
            }

            if (lower.contains("versioning") || lower.contains("versioned")) {
                findings.add(
                    SecurityFinding(
                        id = "ctrl_s3_versioning_det",
                        title = "S3 Versioning Enabled",
                        explanation = "Prompt specifies versioning for S3 object retention.",
                        severity = RiskLevel.LOW,
                        type = FindingType.DETECTED_CONTROL,
                        affectedResource = "Amazon S3",
                        whyItMatters = "Prevents accidental deletion or ransomware overwrites.",
                        recommendedFix = "Verified in prompt.",
                        securityClause = "Enable versioning."
                    )
                )
            } else {
                findings.add(
                    SecurityFinding(
                        id = "miss_s3_versioning",
                        title = "Missing S3 Object Versioning & Lifecycle Rules",
                        explanation = "Object versioning was not specified for the storage bucket.",
                        severity = RiskLevel.MEDIUM,
                        type = FindingType.MISSING_CONTROL,
                        affectedResource = "Amazon S3",
                        whyItMatters = "Without versioning, accidental object deletions or malicious ransomware overwrites cannot be recovered.",
                        recommendedFix = "Enable S3 bucket versioning and configure lifecycle management for non-current versions.",
                        securityClause = "Enable S3 bucket versioning and define lifecycle policies to archive or delete outdated object versions."
                    )
                )
            }
        }

        // EC2 Controls
        if (resourceIds.contains("ec2")) {
            if (lower.contains("security group") && (lower.contains("restricted") || lower.contains("private"))) {
                findings.add(
                    SecurityFinding(
                        id = "ctrl_ec2_sg_det",
                        title = "Restricted Security Group Ingress Configured",
                        explanation = "Prompt specifies restricted network inbound access.",
                        severity = RiskLevel.LOW,
                        type = FindingType.DETECTED_CONTROL,
                        affectedResource = "Amazon EC2",
                        whyItMatters = "Reduces attack surface to legitimate traffic only.",
                        recommendedFix = "Verified in prompt.",
                        securityClause = "Restricted security group ingress."
                    )
                )
            } else if (!lower.contains("0.0.0.0/0")) {
                findings.add(
                    SecurityFinding(
                        id = "miss_ec2_sg",
                        title = "Missing Strict Security Group Ingress Controls",
                        explanation = "No firewall or security group rules are specified for EC2 compute instances.",
                        severity = RiskLevel.HIGH,
                        type = FindingType.MISSING_CONTROL,
                        affectedResource = "Amazon EC2",
                        whyItMatters = "Default or loosely configured security groups frequently leave database or management ports vulnerable.",
                        recommendedFix = "Create a dedicated Security Group allowing inbound traffic only on required application ports from verified upstream targets.",
                        securityClause = "EC2 security groups must allow inbound connections only on required application ports (e.g. 443) strictly from the load balancer security group."
                    )
                )
            }

            findings.add(
                SecurityFinding(
                    id = "miss_ec2_imdsv2",
                    title = "Missing IMDSv2 Enforcement on EC2 Instances",
                    explanation = "Instance metadata service v2 (IMDSv2) token enforcement is omitted.",
                    severity = RiskLevel.HIGH,
                    type = FindingType.MISSING_CONTROL,
                    affectedResource = "Amazon EC2",
                    whyItMatters = "IMDSv1 is vulnerable to Server-Side Request Forgery (SSRF) attacks that steal IAM instance credentials.",
                    recommendedFix = "Require IMDSv2 (HttpTokens = required) and limit hop limit to 1.",
                    securityClause = "Configure EC2 instance metadata options to enforce IMDSv2 (HttpTokens = required) with a maximum metadata hop limit of 1."
                )
            )

            findings.add(
                SecurityFinding(
                    id = "miss_ec2_ebs_enc",
                    title = "Missing EBS Volume Encryption at Rest",
                    explanation = "EBS root and data volumes are not explicitly configured with KMS encryption.",
                    severity = RiskLevel.MEDIUM,
                    type = FindingType.MISSING_CONTROL,
                    affectedResource = "Amazon EC2",
                    whyItMatters = "Unencrypted block devices risk data exposure during disk snapshots or decommissioned volume reuse.",
                    recommendedFix = "Enable EBS encryption by default with a customer-managed KMS key.",
                    securityClause = "All attached EBS root and data storage volumes must be encrypted at rest using an AWS KMS key."
                )
            )
        }

        // RDS Controls
        if (resourceIds.contains("rds")) {
            if (lower.contains("multi-az") || lower.contains("multiaz")) {
                findings.add(
                    SecurityFinding(
                        id = "ctrl_rds_multiaz_det",
                        title = "Multi-AZ Deployment Specified",
                        explanation = "High availability standby replica is planned.",
                        severity = RiskLevel.LOW,
                        type = FindingType.DETECTED_CONTROL,
                        affectedResource = "Amazon RDS",
                        whyItMatters = "Ensures continuous database uptime during availability zone outages.",
                        recommendedFix = "Verified in prompt.",
                        securityClause = "Enable Multi-AZ."
                    )
                )
            } else {
                findings.add(
                    SecurityFinding(
                        id = "miss_rds_multiaz",
                        title = "Missing Multi-AZ & Automated Backup Policy",
                        explanation = "RDS database has no configured high-availability failover or automated backup retention.",
                        severity = RiskLevel.MEDIUM,
                        type = FindingType.MISSING_CONTROL,
                        affectedResource = "Amazon RDS",
                        whyItMatters = "Single AZ instances face data loss and downtime during infrastructure faults or patch maintenance.",
                        recommendedFix = "Enable Multi-AZ failover and set automated snapshot retention to at least 7 days.",
                        securityClause = "Enable RDS Multi-AZ deployment for automated failover and configure automated backup retention for a minimum of 7 days."
                    )
                )
            }

            findings.add(
                SecurityFinding(
                    id = "miss_rds_storage_enc",
                    title = "Missing RDS Storage Encryption at Rest",
                    explanation = "RDS database instance does not explicitly enforce KMS encryption for storage volumes.",
                    severity = RiskLevel.HIGH,
                    type = FindingType.MISSING_CONTROL,
                    affectedResource = "Amazon RDS",
                    whyItMatters = "Database tables, backups, and transaction logs remain unprotected without storage encryption.",
                    recommendedFix = "Enable storage encryption using AWS KMS.",
                    securityClause = "Enable storage encryption at rest on the RDS instance using an AWS KMS Customer Master Key (CMK)."
                )
            )

            findings.add(
                SecurityFinding(
                    id = "miss_rds_private_subnets",
                    title = "Missing RDS Private Subnet Isolation",
                    explanation = "RDS instance network placement is not explicitly restricted to isolated private subnets.",
                    severity = RiskLevel.HIGH,
                    type = FindingType.MISSING_CONTROL,
                    affectedResource = "Amazon RDS",
                    whyItMatters = "Publicly accessible databases invite SQL injection, port probes, and credential brute-force attempts.",
                    recommendedFix = "Deploy RDS inside a private DB subnet group with 'PubliclyAccessible = false'.",
                    securityClause = "Place the RDS instance in dedicated private subnets across multiple availability zones and set PubliclyAccessible to false."
                )
            )
        }

        // ALB Controls
        if (resourceIds.contains("alb")) {
            if (lower.contains("https") || lower.contains("tls") || lower.contains("certificate")) {
                findings.add(
                    SecurityFinding(
                        id = "ctrl_alb_tls_det",
                        title = "HTTPS / TLS Encryption in Transit Specified",
                        explanation = "Load balancer includes TLS encryption for listener endpoints.",
                        severity = RiskLevel.LOW,
                        type = FindingType.DETECTED_CONTROL,
                        affectedResource = "Application Load Balancer",
                        whyItMatters = "Protects web traffic against man-in-the-middle interception.",
                        recommendedFix = "Verified in prompt.",
                        securityClause = "Enforce HTTPS with TLS 1.3."
                    )
                )
            } else {
                findings.add(
                    SecurityFinding(
                        id = "miss_alb_https",
                        title = "Missing HTTPS Listener & HTTP to HTTPS Redirection",
                        explanation = "Load balancer does not specify TLS/HTTPS encryption with automatic redirect.",
                        severity = RiskLevel.HIGH,
                        type = FindingType.MISSING_CONTROL,
                        affectedResource = "Application Load Balancer",
                        whyItMatters = "Cleartext HTTP exposes user sessions, tokens, and data packets to eavesdropping.",
                        recommendedFix = "Configure an HTTPS listener on port 443 with a modern security policy (TLS 1.2/1.3) and redirect HTTP port 80 to HTTPS.",
                        securityClause = "Configure Application Load Balancer with an HTTPS listener using TLS 1.3, an ACM certificate, and an HTTP-to-HTTPS 301 redirect rule."
                    )
                )
            }

            findings.add(
                SecurityFinding(
                    id = "miss_alb_waf",
                    title = "Missing AWS WAF Web ACL Protection",
                    explanation = "No Web Application Firewall (WAF) is attached to inspect ingress HTTP requests.",
                    severity = RiskLevel.MEDIUM,
                    type = FindingType.MISSING_CONTROL,
                    affectedResource = "Application Load Balancer",
                    whyItMatters = "Web applications remain exposed to SQL injection, cross-site scripting (XSS), and DDoS attacks without WAF rules.",
                    recommendedFix = "Associate AWS WAF with AWS Managed Rules (CommonRuleSet, KnownBadInputs).",
                    securityClause = "Associate AWS WAFv2 with the Application Load Balancer, enabling the AWS Managed Core Rule Set and Rate-Based Throttling."
                )
            )
        }

        // Generic IAM Controls
        if (resourceIds.contains("iam") || resources.size >= 2) {
            findings.add(
                SecurityFinding(
                    id = "miss_iam_least_privilege",
                    title = "Missing Least-Privilege IAM Roles",
                    explanation = "Instance and application access roles are not scoped to minimal operational permissions.",
                    severity = RiskLevel.HIGH,
                    type = FindingType.MISSING_CONTROL,
                    affectedResource = "AWS IAM",
                    whyItMatters = "Broad permissions allow compromised workloads to escalate control over the AWS cloud environment.",
                    recommendedFix = "Attach dedicated IAM instance profiles with granular permissions for S3 bucket access only.",
                    securityClause = "Use dedicated IAM roles with least-privilege permissions, restricting S3 access strictly to the application bucket ARN."
                )
            )
        }

        return findings
    }
}
