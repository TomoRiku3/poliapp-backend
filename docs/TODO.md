TEMPLATE

FEATURE: 
STARTED:
ENDED: 
BRANCH:
WHO:
DESCRIPTION:
__________________________________________________________________

FEATURE: All post fetching logic needs to be authorized.
STARTED: 06-09
ENDED: 
BRANCH: post-fetch-authorization
WHO: Tomo
DESCRIPTION:
1. created src/policies/postPolicy.ts that exports a helper function that
authorizes the user's fetch call to get a post, get replies, or make a reply
2. j unit test for postPolicy.test.ts
3. j unit test for postControllers were updated accordingly i.e. canViewPost
calls were defaulted to true
__________________________________________________________________