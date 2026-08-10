from django.templatetags.static import static


CASE_STUDIES = [
    {
        "slug": "pdet-trust",
        "school_name": "PDET Trust Schools",
        "location": "Peterborough Diocese Education Trust",
        "image": static("images/landing/about/our_mission.JPG"),
        "headline": "13 schools, 6 weeks, 58 children, 676 exercise sessions",
        "intro": (
            "PDET used Chatterdillo to explore a trust-wide approach to speech and language support, "
            "bringing consistent, accessible intervention into multiple schools without adding complexity."
        ),
        "challenge": (
            "The trust wanted to improve access to high-quality SLCN support across 13 schools without "
            "requiring extra staff, specialist knowledge, or complex systems."
        ),
        "approach": (
            "The pilot used a coordinated trust-level rollout with group feedback sessions, allowing schools "
            "to screen pupils and deliver activities quickly. Chatterdillo’s built-in screener and session "
            "tracking made the process simple for non-specialist staff and gave leaders evidence they could use."
        ),
        "results": [
            {"value": "13", "label": "participating schools"},
            {"value": "58", "label": "children screened"},
            {"value": "676", "label": "sessions completed"},
        ],
        "results_copy": [
            (
                "The six-week pilot involved 13 PDET schools, screening 58 children and completing 676 "
                "exercise sessions across regular group feedback sessions."
            ),
            (
                "Pupil engagement was especially strong, with 100% of pupils showing consistent engagement "
                "and staff reporting that the activities felt enjoyable, motivating, and easy to use."
            ),
            (
                "The trust also saw meaningful time savings, with 78% of staff reporting up to two hours "
                "saved per week on resource preparation and a clear case for wider rollout across the trust."
            ),
        ],
        "quotes": [
            {
                "quote": (
                    "The app saves time and planning in the classroom, and it was easy to get started quickly."
                ),
                "name": "Staff feedback",
                "role": "PDET pilot",
            }
        ],
        "ofsted": [
            {
                "title": "Inclusion",
                "text": (
                    "The pilot demonstrated a coordinated trust-level commitment to providing high-quality "
                    "support for pupils with SEND."
                ),
            },
            {
                "title": "Leadership & Governance",
                "text": (
                    "The work showed how leaders can manage staff workload more sustainably while building "
                    "a stronger evidence base for SEND provision."
                ),
            },
        ],
        "summary": (
            "The pilot supported the case for a trust-wide rollout, showing that Chatterdillo can help "
            "multiple schools deliver consistent, engaging support at scale."
        ),
    },
    {
        "slug": "kings-furlong",
        "school_name": "Kings Furlong Infant School & Nursery",
        "location": "Basingstoke",
        "image": static("images/landing/about/our_mission.JPG"),
        "headline": "7 pupils supported with confident staff-led intervention",
        "intro": (
            "Kings Furlong used Chatterdillo to strengthen early identification of speech and "
            "language needs and bring more consistent support into the classroom."
        ),
        "challenge": (
            "The school wanted to improve how it identified pupils who needed support and make "
            "sure that interventions were easy to deliver without adding pressure to already busy staff."
        ),
        "approach": (
            "Using the screener, staff could quickly spot needs and start evidence-based activities "
            "with minimal specialist input. The school also used the dashboard to keep track of "
            "progress and make interventions feel manageable for teaching staff."
        ),
        "results": [
            {"value": "7", "label": "pupils supported"},
            {"value": "4.3/5", "label": "staff confidence"},
            {"value": "2 hrs", "label": "saved per week"},
        ],
        "results_copy": [
            (
                "Seven pupils received language intervention through Chatterdillo, with support "
                "delivered by three members of staff."
            ),
            (
                "Staff rated the platform 4.3/5 for ease of delivery and reported that the "
                "training videos and progress dashboard made it much easier to use confidently."
            ),
            (
                "The team also reported saving around two hours per week in preparation and admin, "
                "which could add up to more than two working weeks across a school year."
            ),
        ],
        "quotes": [
            {
                "quote": (
                    "The screener successfully helped to identify support areas, and the exercises "
                    "were engaging and easy to deliver."
                ),
                "name": "Teaching Assistant",
                "role": "Kings Furlong",
            }
        ],
        "ofsted": [
            {
                "title": "Inclusion",
                "text": (
                    "The pilot provided evidence of high-quality support for pupils with SEND and "
                    "disadvantaged backgrounds."
                ),
            },
            {
                "title": "Curriculum & Teaching",
                "text": (
                    "The work showed how leaders can develop staff and equip them with the right tools "
                    "to address needs effectively."
                ),
            },
        ],
        "summary": (
            "The pilot demonstrated that Chatterdillo can help schools widen access to early support, "
            "improve staff confidence, and create a more inclusive learning environment."
        ),
    },
    {
        "slug": "watling-primary",
        "school_name": "Watling Primary",
        "location": "Milton Keynes",
        "image": static("images/landing/about/our_mission.JPG"),
        "headline": "13 pupils reached through a low-staffing, high-impact pilot",
        "intro": (
            "Watling Primary used Chatterdillo to deliver speech and language support without "
            "relying on specialist staff to lead every session."
        ),
        "challenge": (
            "The school needed to reduce the growing waitlist for support while ensuring interventions "
            "could be delivered with limited staff time and no specialist training."
        ),
        "approach": (
            "A teaching assistant used the platform to identify needs and run interventions with a "
            "small group of pupils, supported by an easy-to-use interface and activities that kept "
            "children engaged."
        ),
        "results": [
            {"value": "13", "label": "pupils supported"},
            {"value": "9/10", "label": "ease of use"},
            {"value": "10/10", "label": "delivery confidence"},
        ],
        "results_copy": [
            (
                "One teaching assistant used Chatterdillo to identify and carry out interventions for "
                "13 pupils, despite having no previous specialist experience."
            ),
            (
                "Staff rated the platform 9/10 for ease of use and 10/10 for ease of delivering "
                "intervention material."
            ),
            (
                "Pupil engagement was reported as strong, with staff noting that children stayed focused "
                "even when adults needed to step away briefly to support others."
            ),
        ],
        "quotes": [
            {
                "quote": (
                    "It’s nice that I can leave momentarily and the child can continue working through "
                    "an exercise without losing engagement or focus."
                ),
                "name": "Teaching Assistant",
                "role": "Watling Primary",
            }
        ],
        "ofsted": [
            {
                "title": "Inclusion",
                "text": (
                    "The pilot helped the school support more pupils earlier, including those who would "
                    "otherwise have waited until the next term."
                ),
            },
            {
                "title": "Curriculum & Teaching",
                "text": (
                    "The approach showed how schools can build staff confidence and distribute support "
                    "across the team more sustainably."
                ),
            },
        ],
        "summary": (
            "The pilot showed that Chatterdillo can help schools manage growing demand, reduce waitlists, "
            "and ensure support is delivered with confidence and consistency."
        ),
    },
]


def get_case_studies():
    return CASE_STUDIES


def get_case_study(slug):
    for case_study in CASE_STUDIES:
        if case_study["slug"] == slug:
            return case_study
    return None
