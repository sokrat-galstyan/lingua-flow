# Lingua Flow security

## Scope

The framework is operated primarily by a CLI coding agent against local files. Review the agent’s requested actions and keep personal study data private. The optional web application is single-user, has no account authentication, and must remain bound to loopback. A web production build is still intended for local use, not public hosting.

AI providers run with the local user's environment and their own permission controls. Application staging is not an operating-system sandbox. Provider credentials, configuration and hooks remain outside the application's management. AI tasks may send learning content to external services.

Only the current default branch is maintained; there is no commitment to security backports for older snapshots.

## Reporting a vulnerability

Use the repository's **Security → Report a vulnerability** option when private vulnerability reporting is enabled. Include the affected commit, environment, expected and actual behavior, and a minimal reproduction using synthetic data.

If the option is unavailable and no private contact is listed by the maintainer, open a minimal issue asking for a private reporting channel. Do not include exploit details, credentials, private files, or learner records in a public issue.

There is no guaranteed response time at this prototype stage. Please allow maintainers time to investigate before publishing sensitive details.

## Local precautions and recovery

- Do not expose development or production ports to the internet.
- Keep backups of personal learning projects and review changes before sharing them.
- Review provider permissions and avoid secrets in prompts and uploaded context.
- If an update is interrupted, follow the [documented recovery procedure](web/docs/architecture.md#interrupted-state-updates). Do not delete a recovery journal merely to bypass its write block.
