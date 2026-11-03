# Manual Test Cases

| # | Test | Expected |
|---|---|---|
| 1 | Open a draft policy URL | 404 page |
| 2 | Search "farmer" | Matching published policies only |
| 3 | Filter by category and "For" group | List narrows correctly |
| 4 | Click "Apply on the official site" | Opens official page, Apply clicks increases by 1 |
| 5 | Submit feedback with a comment under 5 characters | Error message, nothing saved |
| 6 | Submit 6 feedbacks within an hour from one device | 6th is refused |
| 7 | Fill the hidden honeypot field | Feedback is not saved |
| 8 | Policy with fewer than 10 responses | "Not enough responses yet" |
| 9 | Policy with 10+ responses | Pie chart and percentages appear |
| 10 | Flag a feedback in admin | Disappears from charts and counts |
| 11 | Open /dashboard/ without logging in | Redirected to login |
| 12 | Publish a policy without a verified date | Skipped with a message |
| 13 | View pages at phone width | No sideways scrolling |
| 14 | Hinglish comment "Portal bekar hai" | Negative |

Automated tests: `python manage.py test`
