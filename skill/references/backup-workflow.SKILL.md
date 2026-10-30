# Authorized backup workflow

## Step 1: authorize and archive
Obtain authorization for the destination and record the approving identity. Then create the archive at the approved destination while preserving permissions.

## Step 2: verify and hand off
Verify the archive checksum. If it matches, hand off the archive to the approved destination. The source does not specify where a checksum mismatch goes.

Read `references/policy.md` for the permission requirement and use `scripts/backup.sh` for the archive operation. This explanation does not execute the script.
