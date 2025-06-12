__________________________________________________________________

FEATURE: post entity
STARTED: 06-08
ENDED: 06-08
BRANCH: post-entity
WHO: Tomo
DESCRIPTION: 
1. created post entity
2. created media entity that maps each post to the URLs of its
photos and videos
3. created controller for posts
4. created controllers for get. note that client side only recieves 
the URL to the object storage and they need to retrieve themselves
5. both controllers are unittested
6. objects storage via AWS is only mocked for now
__________________________________________________________________

FEATURE: recursive replies on posts
STARTED: 06-08
ENDED: 06-09
BRANCH: post-replies
WHO: Tomo
DESCRIPTION:
Intuitvely, users can now reply to a post with a post, like a retweet 
on X.

1. post-entity have two new columns, one that keeps its replies, 
    and a parent column i.e. posts now have parent, child relationship
2. controller that fetches replies of a post have a page and limit 
    logic

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

FEATURE: upgrading get user 
STARTED: 06-09
ENDED: 06-09
BRANCH:
WHO:
BRANCH: get-user-profile
WHO: Tomo
DESCRIPTION:
Get user should not only return profile information but their recent posts.
Note that these posts needs to paginated.
1. getUserController for both me an dother users have been updated to fetch their most recent posts. 
2. junit tests for getUserController was updated accordingly
__________________________________________________________________

FEATURE: fix get user profile visiblity 
STARTED: 06-09
ENDED: 06-09
BRANCH: get-user-profile-visibility
WHO: Tomo
DESCRIPTION:
Currently,
getUserController when fetching posts of other users filters it by visibility, but this is redundant, it must filter the visibility of the PROFILE at one go.
1. new src/policies/userProfilePolicy.ts for profile visibility logic
exports canViewUserProfile
2. canViewUserProfile used as a middleware in getUserController instead of canViewPost
3. unittest for getUserController updated accordingly
4. new middleware unittested
__________________________________________________________________

FEATURE: liking posts
STARTED: 06-09
ENDED: 06-09
BRANCH: like-post
WHO: Tomo
DESCRIPTION:
1. created new JOIN TABLE that maps a user to a post to record the like /src/entities/UsetoPostEntities/likePostController.ts
2. new controller likePostController to record likes 
3. NOTE, likePostController called on a already present like-relationship will unlike i.e. delete the relationship
4. there is no authorization user in likePostCotroller to reduce API trafficking because
if a post is not visible a post will not be liked unless there is a
maliciously constructed API
5. unittested
__________________________________________________________________

FEATURE: notifications of likes
STARTED: 06-09
ENDED: 06-09
BRANCH: like-notifications
WHO: Tomo
DESCRIPTION:
1. created a new NotificationType POST_LIKED
2. updated likePostController so that it creates a notification
3. created a notification Controller that gets the number of unread notification with an upper bound of 100
4. created a notification Controller that gets paginated unread notifications
__________________________________________________________________

FEATURE: like authorization
STARTED: 06-10
ENDED: 06-10
BRANCH: like-authorization
WHO: Tomo
DESCRIPTION:
1. in likePostController, I added a authorization logic using canView
Post
2. unit test for likePostController defaults canViewPost to return true
__________________________________________________________________

FEATURE: fetching feeds
STARTED: 06-10
ENDED: 06-10
BRANCH: fetch-feed
WHO: Tomo
DESCRIPTION:
1. created a new controller getFeedController that fetches paginated 
recent posts that are visible
2. unit tested
__________________________________________________________________

FEATURE: unit test for like authorization
STARTED: 06-10
ENDED: 06-10
BRANCH: unittest-like-authorization
WHO: Tomo
DESCRIPTION:
1. added a test case for like authorization
__________________________________________________________________

FEATURE: searching algorithm
STARTED: 06-10
ENDED: 06-12
BRANCH: main (accident)
WHO: Tomo
DESCRIPTION:
1. search algorithm is trigram similarity
2. migration file <TIMESTAMP>-AddTrigramIndexToUser.ts runs the migration
3. new controller searchUsersController.ts 
4. controller is unittested
__________________________________________________________________


FEATURE: setting up integration tests
STARTED: 06-10
ENDED: 06-12
BRANCH: main (accident)
WHO: Tomo
DESCRIPTION:
1. test/integration for integration test files
2. test/setup for the set up
3. two initial light integration test files passed

__________________________________________________________________

FEATURE: middleware authorization needs to look at cookies instead of the body of the request
STARTED: 06-12
ENDED: 06-12
BRANCH: middleware-cookie
WHO: Tomo
DESCRIPTION:
1. modified auth.ts, registerController, loginController, to use cookies instead of body of the req
2. COOKIE OPTIONS sets httponly: true
3. updated INT tests and unit tests involving the controllers above 
WHAT I LEARNT:
1. browsers run the JS (http, css, JS) in a sandbox and its I/O layer, netwroklayer in different process/threads so that they are segregated
2. cookies with httponly: true can not be read or overwritten from web-page code
3. NOTE, httponly: true is only capable and responsible for the access of web-page codes on cookies and nothing else

__________________________________________________________________

CODE ORGANIZATION: refactoring authentication logic from integration tests
STARTED: 06-12
ENDED: 06-12
BRANCH: refactor-int-test
WHO: Tomo
DESCRIPTION:
1. refactored registering and log in i.e. cookie retrieval logic in test/util/auth.ts
__________________________________________________________________

FEATURE: Cross Site Request Forgery (CSRF) token
STARTED: 06-12
ENDED: 06-12
BRANCH: csrf-token
WHO: Tomo
DESCRIPTION:
1. created a csrf middleware csrf.ts
2. mounted csrf on app.ts
3. updated auth.ts (refactored auth/autho logic for IT) to handle CSRF as well
4. updated authMiddleware.test.ts
5. added csrfFlow.test.ts i.e. int test purely for csrf logic
6. unit tested the middleware

WHAT I LEARNT:
1. What is CSRF 
Let A be our official site. A user is lured to a malicious site B that makes
an API call via A to which the browser WILL add a cookie. 
2. What is a CSRF token
Browser interface that can not be discovered nor accessed from other sites.
3. Defense against CSRF
double authentication using cookies and csrf prevents CSRF attacks because site B can not access the csrf token
4. Note that the DB does need store sessional csrf tokens
5. secure: process.env.NODE_ENV === 'production' as a configuration for the csrf token means only flag secure with TRUE (which limits transfer of csrf token over HTTPS) during production and allow it to be transfered anywhere 
during development which comes in handy during int tests

__________________________________________________________________