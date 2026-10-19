"use strict";

/**
 * Paraphrase-recall probe.
 *
 * Measures whether the rule engine recognises a security control when the
 * prompt states it in everyday language rather than the canonical keywords.
 * This complements run-eval.js (which uses labelled prompts): it exposes the
 * rule-based recall ceiling on phrasing the patterns were not written for.
 *
 * Sets 1 and 2 were used while expanding the lexicons; set 3 is an independent
 * "unseen" estimate and should be refreshed with new cases over time.
 *
 * Run:  node engine/eval/paraphrase-probe.js   (or: npm run probe)
 */

const path = require("path");
const V = require(path.join(__dirname, "..", "src", "analyzer.js"));

const SETS = {
  "set 1 (basic paraphrases)": [
    ["Create an S3 bucket and scramble everything on disk with our own keys", "encryption_at_rest"],
    ["Make sure traffic between the load balancer and the app can't be sniffed", "encryption_in_transit"],
    ["Nobody on the internet should be able to reach the database", "public_access_block"],
    ["Only our office IPs may connect to the servers", "network_restricted"],
    ["Keep an audit trail of who changed what", "audit_logging"],
    ["We must be able to restore last night's snapshot", "backup_recovery"],
    ["Keep a copy of every version of the object", "versioning"],
    ["The data must stay inside India", "data_residency"],
    ["Spin up an S3 bucket in eu-west-1", "regional_restriction"],
    ["Alert us if someone logs in from a new country", "monitoring_alerting"],
    ["Use a vault for the DB password instead of putting it in the code", "secrets_management"],
    ["Require a one-time code in addition to the password", "mfa"],
    ["Make sure instances are patched automatically", "vulnerability_scanning"],
    ["Put a firewall in front to stop DDoS", "waf_protection"],
    ["Ensure the EC2 instance is spread across multiple availability zones", "availability"],
    ["Delete objects automatically after 90 days", "retention_deletion"],
    ["Use customer managed keys that rotate every year", "key_rotation"],
    ["The database must not be reachable from the public subnet", "network_isolation"],
    ["Use a private link to reach the service", "private_endpoint"],
    ["Turn on CloudTrail for the account", "audit_logging"],
  ],
  "set 2 (natural phrasing)": [
    ["Only signed-in users may read the objects, no anonymous reads", "public_access_block"],
    ["Encode the data before it lands on the volume", "encryption_at_rest"],
    ["Use HTTPS for every endpoint", "encryption_in_transit"],
    ["Don't give the function more permissions than it needs", "least_privilege_iam"],
    ["Record every API call for later investigation", "audit_logging"],
    ["Take nightly snapshots and make sure we can roll back", "backup_recovery"],
    ["Keep the database in a private network", "network_isolation"],
    ["Use short-lived credentials instead of long-lived keys", "secrets_management"],
    ["Require a second verification step for admins", "mfa"],
    ["Scan containers for known vulnerabilities", "vulnerability_scanning"],
    ["Spread the app over two data centers", "availability"],
    ["Put a CDN and WAF in front of the app", "waf_protection"],
    ["Rotate the encryption material on a schedule", "key_rotation"],
    ["Automatically remove old logs after 30 days", "retention_deletion"],
    ["Replicate the bucket to another region", "cross_region_replication"],
    ["Store data only in Australian regions", "regional_restriction"],
    ["Encrypt the volume with a customer supplied key", "encryption_at_rest"],
    ["Make sure we get an alert if CPU spikes", "monitoring_alerting"],
  ],
  "set 3 (independent / unseen estimate)": [
    ["Make the bucket accessible only from inside our VPC", "public_access_block"],
    ["If someone steals the disks they still shouldn't be able to read the data", "encryption_at_rest"],
    ["Use TLS between all services", "encryption_in_transit"],
    ["Give the role the smallest set of permissions possible", "least_privilege_iam"],
    ["Write an immutable audit record of every change", "audit_logging"],
    ["Keep daily backups for 30 days", "backup_recovery"],
    ["Ensure the DB is not on a public address", "public_access_block"],
    ["Never store the API token in the repo", "secrets_management"],
    ["Ask for an OTP when logging in", "mfa"],
    ["Run a scanner on the images before deploy", "vulnerability_scanning"],
    ["Deploy to at least two AZs", "availability"],
    ["Add rate limiting at the edge", "waf_protection"],
    ["Change the KMS key every 90 days", "key_rotation"],
    ["Purge data that is older than a year", "retention_deletion"],
    ["Back up to a different region", "cross_region_replication"],
    ["Keep all data in the EU", "data_residency"],
  ],
};

let grandOk = 0;
let grandTotal = 0;

for (const [name, cases] of Object.entries(SETS)) {
  let ok = 0;
  const misses = [];
  for (const [prompt, id] of cases) {
    const r = V.analyze(prompt, { strictMode: false });
    const mentioned = new Set((r.mentioned || []).map((x) => x.id));
    if (mentioned.has(id)) ok++;
    else misses.push([id, prompt]);
  }
  grandOk += ok;
  grandTotal += cases.length;
  const pct = Math.round((ok / cases.length) * 100);
  console.log("\n" + name + ": " + ok + "/" + cases.length + " (" + pct + "%)");
  for (const [id, p] of misses) console.log("  MISS " + id + "  <-  \"" + p + "\"");
}

console.log(
  "\nOverall: " + grandOk + "/" + grandTotal + " (" +
  Math.round((grandOk / grandTotal) * 100) + "%)"
);
