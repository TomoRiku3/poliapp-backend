TEMPLATE

FEATURE: 
STARTED:
ENDED: 
BRANCH:
WHO:
DESCRIPTION:
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