# PostgreSQL Backup & Restore for Kubernetes

Automated backup and restore mechanism for PostgreSQL database in Kubernetes cluster.

## Architecture

```
PostgreSQL Pod (postgres) ──┐
                             │
                    ┌────────┴────────┐
                    │                 │
            CronJob (Daily)    Manual Job
              (2 AM UTC)       (On Demand)
                    │                 │
                    └────────┬────────┘
                             │
                        PVC Storage
                    (postgres-backup-storage)
                          10Gi
                             │
                    ┌────────┴────────┐
                    │                 │
               Backup Files      Checksums
          (postgres_backup_*     (*.sha256)
            .sql, 7-day keep)
```

## Components

### 1. **PVC Storage** (`pvc-backup-storage.yaml`)
- 10Gi persistent volume for storing backups
- Uses `local-path` storage class
- Mounted at `/backups` in backup/restore jobs

### 2. **RBAC** (`rbac.yaml`)
- ServiceAccount: `postgres-backup`
- Role: permissions to list pods and execute into them
- Ensures least-privilege access

### 3. **Backup Script** (`configmap-backup-script.yaml`)
- Uses `pg_dump` to create SQL backup
- Automatic retention: keeps only last 7 backups
- Creates SHA256 checksums for integrity verification
- Timestamps: `postgres_backup_YYYYMMDD_HHMMSS.sql`

### 4. **Restore Script** (`configmap-restore-script.yaml`)
- Uses `pg_restore` (or psql for SQL files)
- Automatically finds latest backup if not specified
- Verifies checksum before restoring
- Terminates existing connections gracefully
- Recreates database from backup
- Safety confirmation (10-second delay)

### 5. **Automated Backup** (`cronjob-backup-daily.yaml`)
- Runs daily at **02:00 UTC**
- Uses ServiceAccount for secure pod execution
- Keeps 3 successful + 1 failed job for logs
- Credentials from `dvloper-secrets`

### 6. **Manual Backup** (`job-backup-manual.yaml`)
- Triggered on-demand via kubectl
- Same script and storage as CronJob

### 7. **Manual Restore** (`job-restore-manual.yaml`)
- Triggered on-demand via kubectl
- Restores from latest backup by default
- Can restore specific backup by env var

## Security Features

✅ **Credentials Management**
- Database credentials pulled from `dvloper-secrets` (K8s Secret)
- Passwords never exposed in manifests or logs
- PGPASSWORD exported only in job execution context

✅ **RBAC**
- Dedicated ServiceAccount with minimal permissions
- Only allowed to interact with pods (for execution)
- No direct access to cluster admin resources

✅ **Backup Integrity**
- SHA256 checksums for verification
- Checksum validation before restore
- Automatic detection of corrupted backups

✅ **Access Control**
- Backups stored in PVC with pod-level access
- Backup directory permissions managed by pod
- Not directly accessible from host

## Deployment

### Deploy all backup infrastructure:
```bash
kubectl apply -k k8s/backup/
```

### Verify deployment:
```bash
# Check resources created
kubectl get pvc -n dvloper
kubectl get cronjobs -n dvloper
kubectl get configmaps -n dvloper | grep backup
kubectl get sa -n dvloper | grep postgres-backup

# Check CronJob schedule
kubectl describe cronjob postgres-backup-daily -n dvloper
```

## Usage

### View backups
```bash
# List all backups (pod exec method)
kubectl exec -it -n dvloper deployment/postgres-backup-daily -- ls -lh /backups/

# Or use job logs
kubectl logs -n dvloper -l app=postgres-backup,type=manual --tail=50
```

### Manual Backup (On-Demand)

Trigger immediate backup:
```bash
# Create one-time backup job
kubectl create job --from=cronjob/postgres-backup-daily postgres-backup-now-$(date +%s) -n dvloper

# Monitor backup progress
kubectl logs -f job/postgres-backup-now-<TIMESTAMP> -n dvloper
```

Or apply the job template:
```bash
kubectl apply -f k8s/backup/job-backup-manual.yaml
kubectl logs -f job/postgres-backup-manual -n dvloper
```

### Manual Restore (From Latest Backup)

**WARNING:** Restore overwrites the current database!

```bash
# Apply restore job (will use latest backup)
kubectl apply -f k8s/backup/job-restore-manual.yaml

# Monitor restore progress
kubectl logs -f job/postgres-restore-manual -n dvloper

# Check pod status
kubectl describe job postgres-restore-manual -n dvloper
```

### Restore from Specific Backup

List available backups:
```bash
kubectl exec -it postgres-0 -n dvloper -- ls -1 /backups/postgres_backup_*.sql
```

Restore specific backup:
```bash
# Create restore job from template
kubectl create job --from=cronjob/postgres-backup-daily postgres-restore-specific-$(date +%s) -n dvloper

# Then modify env var:
kubectl set env job/postgres-restore-specific-<TIMESTAMP> \
  BACKUP_FILE=/backups/postgres_backup_20260508_140000.sql -n dvloper

# Start pod
kubectl delete pod -l job-name=postgres-restore-specific-<TIMESTAMP> -n dvloper
```

Or manually:
```bash
kubectl exec -it postgres-0 -n dvloper -- bash /scripts/restore.sh /backups/postgres_backup_20260508_140000.sql
```

## Monitoring & Logs

### Check CronJob execution history:
```bash
# List recent backup jobs
kubectl get jobs -n dvloper -l app=postgres-backup

# View job logs
kubectl logs job/postgres-backup-manual -n dvloper

# Check job status
kubectl describe job postgres-backup-manual -n dvloper
```

### Backup file verification:
```bash
# Verify backup with checksum
kubectl exec -it postgres-0 -n dvloper -- bash -c \
  "cd /backups && sha256sum -c postgres_backup_YYYYMMDD_HHMMSS.sql.sha256"
```

### Check storage usage:
```bash
# PVC utilization
kubectl get pvc postgres-backup-storage -n dvloper

# Actual disk usage inside pod
kubectl exec -it postgres-0 -n dvloper -- du -sh /backups/
```

## Backup Schedule

Default: **Daily at 02:00 UTC**

To modify schedule:
```bash
# Edit CronJob
kubectl edit cronjob postgres-backup-daily -n dvloper

# Change 'schedule' field:
# Format: minute hour day month day-of-week
# Examples:
# "0 2 * * *"    = Daily at 02:00
# "0 */6 * * *"  = Every 6 hours
# "0 12 * * 0"   = Weekly on Sunday at 12:00
```

## Retention Policy

- **Automatic cleanup**: Keeps only last 7 backups
- **Old backups removed**: During each backup job
- **Cleanup also removes**: Associated SHA256 checksum files
- **Manual cleanup** (if needed):
  ```bash
  kubectl exec -it postgres-0 -n dvloper -- bash -c \
    "cd /backups && ls -t1 postgres_backup_*.sql | tail -n +8 | xargs rm -f"
  ```

## Recovery Time Objective (RTO)

- **Manual backup**: ~2-5 minutes (depending on DB size)
- **Manual restore**: ~5-15 minutes (depending on DB size)
- **Automated backup runs**: CronJob handles scheduling
- **Database availability during backup**: Full (non-blocking dump)
- **Database availability during restore**: Down (database is dropped/recreated)

## Troubleshooting

### Backup fails with "connection refused"
```bash
# Check if postgres pod is running
kubectl get pods -n dvloper -l app=postgres

# Check postgres service
kubectl get svc postgres -n dvloper

# Test connectivity from backup pod
kubectl run -it --rm postgres-test --image=postgres:16 \
  --env="PGHOST=postgres" --env="PGUSER=postgres" \
  -n dvloper -- psql -c "SELECT 1" || true
```

### Backup file not found during restore
```bash
# List available backups
kubectl exec -it postgres-0 -n dvloper -- ls -lh /backups/

# Check if PVC is mounted
kubectl get pvc postgres-backup-storage -n dvloper
```

### Restore fails with "permission denied"
```bash
# Check PVC ownership/permissions
kubectl exec -it postgres-0 -n dvloper -- ls -la /backups/

# Verify ServiceAccount has correct permissions
kubectl describe sa postgres-backup -n dvloper
```

### CronJob not running
```bash
# Check CronJob schedule syntax
kubectl describe cronjob postgres-backup-daily -n dvloper

# Check last schedule time
kubectl get cronjob postgres-backup-daily -n dvloper -o yaml | grep -A 5 "lastScheduleTime"

# Check for job creation
kubectl get jobs -n dvloper -l app=postgres-backup --sort-by=.metadata.creationTimestamp
```

## Best Practices

1. **Test Restores Regularly**
   - Verify backup integrity by testing restore process
   - Don't wait for emergency to discover backup issues

2. **Monitor Backup Logs**
   - Check job logs after each backup
   - Set up alerts for failed backup jobs

3. **Verify Storage Capacity**
   - Monitor PVC usage
   - Adjust retention policy if needed
   - Resize PVC before it fills up

4. **Backup Encryption** (Optional)
   - Consider encrypting backups for production
   - Use tools like GPG or similar
   - Store keys separately from backups

5. **Off-Site Backups** (Recommended for Production)
   - Current setup: Local PVC (suitable for dev/test)
   - Production: Consider external storage (S3, GCS, Azure Blob)
   - Use tools like: `pg_basebackup`, `pgBackRest`, `WAL-G`

6. **Documentation**
   - Document recovery procedures
   - Train team on manual backup/restore
   - Maintain playbooks for disaster scenarios

## Integration with CI/CD

To automate backup before deployments:

```yaml
# Add to GitLab CI pipeline
backup_before_deploy:
  stage: pre-deploy
  script:
    - kubectl create job backup-pre-deploy-$(date +%s) --from=cronjob/postgres-backup-daily -n dvloper
    - sleep 30  # Wait for backup to complete
    - kubectl logs job/backup-pre-deploy-* -n dvloper
  tags:
    - full-runner
  only:
    - main
```

## Files Overview

```
k8s/backup/
├── kustomization.yaml              # Kustomize manifest
├── pvc-backup-storage.yaml         # 10Gi PVC for backups
├── rbac.yaml                       # ServiceAccount, Role, RoleBinding
├── configmap-backup-script.yaml    # Backup script (pg_dump)
├── configmap-restore-script.yaml   # Restore script (psql)
├── cronjob-backup-daily.yaml       # Automated daily backup (2 AM UTC)
├── job-backup-manual.yaml          # Manual backup job
├── job-restore-manual.yaml         # Manual restore job
└── README.md                       # This file
```

## Environment Variables

### Backup Job Environment
- `PGHOST`: postgres (K8s service name)
- `PGPORT`: 5432 (default PostgreSQL port)
- `PGUSER`: From `dvloper-secrets.APP_DB_USER`
- `PGPASSWORD`: From `dvloper-secrets.APP_DB_PASSWORD`
- `PGDATABASE`: From `dvloper-secrets.APP_DB_NAME`

### Storage
- Backup directory: `/backups` (mounted PVC)
- Backup file format: `postgres_backup_YYYYMMDD_HHMMSS.sql`

## Support & Maintenance

- **Logs**: Check pod logs for errors
- **Monitoring**: Monitor CronJob and job completion
- **Alerts**: Set up K8s monitoring for job failures
- **Upgrades**: Test backup/restore before PostgreSQL upgrades

---

**Last Updated**: 2026-05-08  
**Status**: Production-Ready for Development/Testing
