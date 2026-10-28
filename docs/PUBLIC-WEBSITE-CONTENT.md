# BABC public website content notes

The home page is a demonstration of a school website connected to the existing /portal/login route. Admissions links open the enquiry/contact section. They do not issue admission numbers. Career Day has no invented dates or ticket registration. Events, newsletters, gallery images, an official mission statement and leadership messages await school approval.

## Research on 28 October 2026

- User-supplied crest and motto: Faith, Excellence & Integrity.
- Address and publicly listed school telephone corroborated by https://www.goafricaonline.com/ng/901705-bodija-ashi-baptist-college and https://ng.worldorgs.com/catalog/ibadan%2C-oyo/college/bodijaashibaptistcollege . Directory opening hours are inconsistent and deliberately omitted. Contact details should be confirmed before an official school launch.
- User's first-hand account establishes Career Day's influence on this alumni project. No date, speaker list or admission policy is inferred.
- https://independent.ng/general-elections-seek-gods-face-cleric-urges-nigerians/ reports Rev. Patrick Akinbode Rotimi's induction as church pastor in January 2023. This does not verify a current school leadership role. Do not use as a current school biography or invent a quote.
- https://everloved.com/life-of/sunday-wojuola/memories/?flow=201 includes personal tributes associating the late Rev. S. O. Wojuola with Career Day. Tributes are not an official school history and were not copied onto the website.
- Searches including Facebook did not establish a reliable official school mission or school leadership biography.
- User reference https://bodija-international-ibadan.com/ initially returned a 502 in web lookup and timed out in a browser, then loaded successfully. Reviewed its top contact strip, school navigation, hero slider, mission/vision/value blocks, leadership welcome, gallery and Portal menu (parent, elementary, junior, senior and webmail). The BABC version uses this public-site/private-portal separation with its existing single role-based login. No other school copy, staff identities, event dates or photographs were reused.

## Implementation

BABC work is isolated from the Skyward checkout, using a managed worktree based on previous-school/master. The public home page alone is changed; portal roles, credentials, database and branding are retained. All website CSS uses the school-site scope. Mobile navigation uses a native disclosure with keyboard access. Campus art is labelled as an illustration rather than a real school photograph.
