---
name: refactor to signals
description: Spawn a team of three subagents to refactor the observable rxjs into modern angular signals
---

## Refactor Plan

### The refactor subagent should

1. Analyze the project and find where rxjs operator are used
2. Convert rxjs logic into modern angular signals.

### Adter the refactor subagent is done, the tester subagent should

1. Run the test suite and identify any failing tests
2. For each failing test, determine if the failure is due to the refactor or an unrelated issue
3. If the failure is due to the refactor, provide detailed information about the failure, including the specific test that failed and the reason for the failure
4. Spawn again the refactor subagent if the failure is from the applications
5. Fix the test if the failure come from the test implementation
6. Iterate until every test passes
