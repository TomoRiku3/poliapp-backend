TEMPLATE

FEATURE: 
STARTED:
ENDED: 
BRANCH:
WHO:
DESCRIPTION:
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

FEATURE: fetching feeds
STARTED:
ENDED: 
BRANCH:
WHO:
DESCRIPTION:
__________________________________________________________________

FEATURE: reccomendation algorithm 
STARTED:
ENDED: 
BRANCH:
WHO:
DESCRIPTION:
__________________________________________________________________

FEATURE: searching algorithm
STARTED:
ENDED: 
BRANCH:
WHO:
DESCRIPTION:
__________________________________________________________________

FEATURE: notifications of likes
STARTED:
ENDED: 
BRANCH:
WHO:
DESCRIPTION:
__________________________________________________________________

FEATURE: like authorizations
STARTED:
ENDED: 
BRANCH:
WHO:
DESCRIPTION:
__________________________________________________________________
