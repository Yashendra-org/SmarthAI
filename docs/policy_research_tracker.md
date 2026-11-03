# Policy Research Tracker

`data/policies_seed.csv` holds **104 policies**: **8 researched drafts** and **96 skeleton entries**.

## What a skeleton entry has and lacks

- **Has:** title, department, category, target groups, launch year (left blank when unsure), a one-line objective, and an official link on the ministry or scheme website.
- **Lacks:** eligibility, benefits, how to apply, documents, plain summary, last verified date, verified by. Nothing here was checked against the official page, including the links and launch years.
- All are `draft`, and the loader and admin refuse to publish a policy without an official link and a verified date, so none can go live by accident.

## How to finish an entry

1. Open the official link. If it fails, find the correct page and fix `official_url`.
2. Fill eligibility, benefits, how to apply and documents, using the official page only.
3. Write `summary_en` in your own words (3 to 5 lines). Do not copy text.
4. Confirm the launch year. Set `last_verified` (YYYY-MM-DD) and `verified_by`.
5. Set `status` to `published`, then run `python manage.py load_policies`.

## Suggested split by category

| Category | Skeleton entries |
|---|---|
| agriculture | 11 |
| digital | 4 |
| education | 13 |
| finance | 16 |
| health | 11 |
| housing | 4 |
| other | 14 |
| social_welfare | 23 |

Give each member one or two categories. Start with the policies citizens search for most: PM-KISAN-type farm schemes, health, scholarships, housing, jobs and loans.

## Researched drafts (still need a team check)

- PM-KISAN
- Ayushman Bharat PM-JAY
- Pradhan Mantri Ujjwala Yojana
- National Education Policy 2020
- Atal Pension Yojana
- Pradhan Mantri Mudra Yojana
- Pradhan Mantri Awas Yojana - Urban 2.0
- Digital Personal Data Protection Act 2023

## Skeleton entries by category

### agriculture

- Pradhan Mantri Fasal Bima Yojana
- Kisan Credit Card Scheme
- Pradhan Mantri Krishi Sinchayee Yojana
- Soil Health Card Scheme
- e-NAM National Agriculture Market
- Pradhan Mantri Kisan Maandhan Yojana
- Paramparagat Krishi Vikas Yojana
- Rashtriya Krishi Vikas Yojana
- Pradhan Mantri Kisan Urja Suraksha evam Utthaan Mahabhiyan (PM-KUSUM)
- Agriculture Infrastructure Fund
- Pradhan Mantri Matsya Sampada Yojana

### digital

- Digital India
- Pradhan Mantri Gramin Digital Saksharta Abhiyan
- DigiLocker
- Aadhaar Act 2016

### education

- Samagra Shiksha
- PM POSHAN (Mid-Day Meal Scheme)
- Beti Bachao Beti Padhao
- National Scholarship Portal
- PM Vidyalaxmi
- PM SHRI Schools
- SWAYAM
- National Apprenticeship Promotion Scheme
- Right to Education Act 2009
- Khelo India
- Post Matric Scholarship for Scheduled Castes
- Eklavya Model Residential Schools
- PM YASASVI

### finance

- PM Formalisation of Micro Food Processing Enterprises
- PM Street Vendor's AatmaNirbhar Nidhi (PM SVANidhi)
- Stand-Up India
- Startup India
- Make in India
- Prime Minister's Employment Generation Programme
- Credit Guarantee Fund Trust for Micro and Small Enterprises
- Udyam Registration
- Pradhan Mantri Shram Yogi Maandhan
- Pradhan Mantri Jan Dhan Yojana
- Pradhan Mantri Jeevan Jyoti Bima Yojana
- Pradhan Mantri Suraksha Bima Yojana
- Sukanya Samriddhi Yojana
- National Pension System
- Senior Citizens Savings Scheme
- Mahila Samman Savings Certificate

### health

- National Health Mission
- Janani Suraksha Yojana
- Pradhan Mantri Matru Vandana Yojana
- Pradhan Mantri Surakshit Matritva Abhiyan
- Mission Indradhanush
- Ayushman Bharat Digital Mission
- Pradhan Mantri Bharatiya Janaushadhi Pariyojana
- Rashtriya Bal Swasthya Karyakram
- Poshan Abhiyaan
- Ni-kshay Poshan Yojana
- Pradhan Mantri Swasthya Suraksha Yojana

### housing

- Pradhan Mantri Awas Yojana - Gramin
- AMRUT
- Smart Cities Mission
- SVAMITVA Scheme

### other

- Swachh Bharat Mission
- Jal Jeevan Mission
- Pradhan Mantri Gram Sadak Yojana
- Deendayal Upadhyaya Gram Jyoti Yojana
- PM Surya Ghar Muft Bijli Yojana
- Right to Information Act 2005
- Consumer Protection Act 2019
- Fit India Movement
- National Logistics Policy 2022
- National Green Hydrogen Mission
- Namami Gange
- National Clean Air Programme
- Mission LiFE
- PM Gati Shakti

### social_welfare

- Pradhan Mantri Kaushal Vikas Yojana
- Skill India Mission
- Mahatma Gandhi National Rural Employment Guarantee Act
- Deendayal Antyodaya Yojana - National Rural Livelihoods Mission
- Deendayal Antyodaya Yojana - National Urban Livelihoods Mission
- PM Vishwakarma
- e-Shram
- National Social Assistance Programme
- Pradhan Mantri Garib Kalyan Anna Yojana
- National Food Security Act 2013
- One Nation One Ration Card
- Rights of Persons with Disabilities Act 2016
- Accessible India Campaign
- Protection of Women from Domestic Violence Act 2005
- Mission Shakti
- One Stop Centre Scheme
- Mission Vatsalya
- Integrated Child Development Services
- Protection of Children from Sexual Offences Act 2012
- PM Anusuchit Jaati Abhyuday Yojana (PM-AJAY)
- PM Janjatiya Adivasi Nyaya Maha Abhiyan (PM JANMAN)
- PM Virasat Ka Samvardhan (PM VIKAS)
- Atal Vayo Abhyuday Yojana
