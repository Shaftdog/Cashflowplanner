---
description: Automatically test completed work via playwright-tester agent
---

Delegate to the playwright-tester agent for automated browser testing:

Test the following: $ARGUMENTS

The application is running at http://localhost:3000

Execute comprehensive automated tests covering:
- All user workflows and interactions
- Happy path scenarios
- Error conditions and validation
- Edge cases and boundary conditions
- Responsive design (if UI changes)

Provide a detailed test report including:
- Pass/fail status for each scenario
- Screenshots of key flows
- Any bugs found with specific fix recommendations (file:line)
- Console errors or warnings
- Performance observations

Only declare success when all tests pass. If tests fail, provide specific fixes needed and I will address them before re-testing.
