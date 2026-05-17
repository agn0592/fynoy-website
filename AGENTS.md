<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Merge workflow

Once the user has accepted a completed task on a feature branch, default to merging that branch into `main` (via PR + merge). Don't leave feature branches sitting around. Confirm before merging if any of these are true:
- the task touches infrastructure / migrations / env-vars that the user hasn't set up yet
- the user explicitly asked to wait
- there are unresolved review comments
