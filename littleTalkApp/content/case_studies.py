from django.templatetags.static import static


CASE_STUDIES = [
    {
        "slug": "pdet-trust",
        "school_name": "Peterborough Diocese Education Trust",
        "location": "Trust-wide pilot",
        "image": static("images/landing/about/our_mission.webp"),
        "headline": "How 13 schools delivered 676 speech and language sessions in six weeks",
        "intro": (
            "A six-week pilot across Peterborough Diocese Education Trust showed what becomes possible "
            "when schools share one practical approach to identifying needs, delivering interventions "
            "and evidencing progress."
        ),
        "challenge": (
            "PDET wanted to widen access to speech, language and communication support across its schools "
            "without creating another complex system for staff to manage. The solution needed to work for "
            "non-specialists, fit around existing classroom routines and give leaders useful evidence of "
            "pupil participation and progress."
        ),
        "approach": (
            "Thirteen schools joined a coordinated pilot shaped by regular group check-ins and direct feedback "
            "from SENCOs. Staff used Chatterdillo's screener to identify suitable activities, delivered short "
            "intervention sessions and recorded activity automatically. Schools were able to get started "
            "without a training day or specialist delivery team."
        ),
        "results": [
            {"value": "13", "label": "participating schools"},
            {"value": "58", "label": "children screened"},
            {"value": "100%", "label": "consistent pupil engagement"},
        ],
        "results_copy": [
            (
                "In six weeks, participating schools screened 58 children and completed 676 exercise sessions. "
                "The level of participation demonstrated that a shared model could work across a diverse group "
                "of schools, rather than being limited to a single enthusiastic setting."
            ),
            (
                "Every pupil showed consistent engagement. Children described how the activities made them feel "
                "and how they supported their learning, while staff saw improvements in confidence and willingness "
                "to communicate. 89 perecent of staff felt Chatterdillo had a positive impact on learning "
                "outcomes and progress."
            ),
            (
                "The pilot also addressed a pressure every school leader recognises: staff time. Seventy-eight per "
                "cent of staff reported saving up to two hours a week on resource preparation. For a five-person "
                "team, the report estimates that this could return around 100 hours to the school each year."
            ),
        ],
        "quotes": [
            {
                "quote": "I liked the colourful semantics because it helped me make a sentence.",
                "name": "Pupil",
                "role": "PDET pilot",
            },
            {
                "quote": "Children who were struggling to read and say sentences are improving.",
                "name": "Teacher",
                "role": "PDET pilot",
            }
        ],
        "ofsted": [
            {
                "title": "Inclusion",
                "text": (
                    "A common screening and intervention pathway helps schools show how pupils with SLCN are "
                    "identified, supported and included in learning across the trust."
                ),
            },
            {
                "title": "Leadership & Governance",
                "text": (
                    "Automated recommendations, session records and progress dashboards give leaders a clearer "
                    "view of provision while reducing preparation and reporting demands on staff."
                ),
            },
            {
                "title": "Personal Development",
                "text": (
                    "The pilot captured strong pupil voice and sustained participation, including children asking "
                    "to repeat activities rather than needing incentives to take part."
                ),
            },
        ],
        "summary": (
            "PDET's pilot suggests that trusts can create more consistent SLCN provision without imposing a "
            "heavy implementation burden on schools. Shared tools, comparable evidence and lower preparation "
            "time give trust leaders a practical route from isolated interventions to a coordinated strategy."
        ),
    },
    {
        "slug": "watling-primary",
        "school_name": "Watling Primary",
        "location": "Primary school pilot",
        "image": static("images/landing/about/our_impact.webp"),
        "headline": "How one teaching assistant helped 13 pupils avoid months on a waiting list without training",
        "intro": (
            "At Watling Primary, pupils who might otherwise have waited until September began receiving speech "
            "and language support during the summer term. One teaching assistant delivered the intervention "
            "confidently, without previous specialist training."
        ),
        "challenge": (
            "Demand for speech and language support was growing faster than specialist capacity. The school needed "
            "a way to act sooner for pupils on the waiting list, without releasing staff for extensive training "
            "or disrupting the school day."
        ),
        "approach": (
            "A speech and language therapist coordinated the pilot, while a teaching assistant used Chatterdillo "
            "to identify needs and deliver activities day to day. The platform provided the intervention material "
            "and structure, enabling support to continue independently with minimal coordinating time."
        ),
        "results": [
            {"value": "13", "label": "pupils supported"},
            {"value": "9/10", "label": "ease of use"},
            {"value": "10/10", "label": "ease of delivering materials"},
        ],
        "results_copy": [
            (
                "Thirteen pupils received intervention before the end of term instead of remaining on a waiting "
                "list until September. This was achieved by one teaching assistant with no previous specialist "
                "experience, working within the school's existing staffing arrangements."
            ),
            (
                "The platform scored 9 out of 10 for ease of use and 10 out of 10 for ease of delivering the "
                "materials. As her confidence grew, the teaching assistant independently identified three more "
                "pupils who could benefit and added them to the intervention."
            ),
            (
                "Pupil engagement scored 8 out of 10. Although the small pilot was not designed to provide robust "
                "long-term attainment data, staff saw children remain focused enough to continue activities when "
                "the adult briefly needed to support another pupil: a meaningful practical benefit in a busy classroom."
            ),
        ],
        "quotes": [
            {
                "quote": (
                    "It's nice that I can leave momentarily and the child can continue working through "
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
                    "The school converted waiting-list demand into timely support, giving 13 pupils earlier access "
                    "to intervention without requiring additional specialist capacity."
                ),
            },
            {
                "title": "Curriculum & Teaching",
                "text": (
                    "A non-specialist member of staff delivered intervention confidently and independently, "
                    "showing how the right resources can distribute expertise more effectively across a school."
                ),
            },
            {
                "title": "Achievement & Curriculum",
                "text": (
                    "Engagement data and an automatic record of intervention sessions gave the school an evidence "
                    "trail while creating the conditions for progress through consistent use."
                ),
            },
        ],
        "summary": (
            "Watling Primary demonstrated a practical answer to a familiar capacity problem: give support staff "
            "the structure and materials to intervene confidently, so pupils can begin receiving help while they "
            "wait for specialist input rather than losing valuable months."
        ),
    },
    {
        "slug": "kings-furlong",
        "school_name": "Kings Furlong Infant School & Nursery",
        "location": "Infant school and nursery pilot",
        "image": static("images/landing/about/jamie_presenting.webp"),
        "headline": "Earlier identification, confident staff and more pupils receiving support",
        "intro": (
            "Kings Furlong set out to identify speech and language needs earlier and make high-quality "
            "intervention easier for school staff to deliver. By the end of the pilot, the school had exceeded "
            "its pupil target and staff wanted to continue using the platform."
        ),
        "challenge": (
            "The school wanted to support six pupils identified by its SENCo, while building the confidence of "
            "teachers and teaching assistants to recognise needs and respond effectively. Any approach had to "
            "be engaging for young children, straightforward for staff and realistic within the working week."
        ),
        "approach": (
            "Three members of staff used Chatterdillo to screen pupils and deliver targeted language activities. "
            "Built-in training videos helped them introduce exercises with confidence, while the progress dashboard "
            "kept improvements and completed sessions visible without a separate record-keeping process."
        ),
        "results": [
            {"value": "7", "label": "pupils supported"},
            {"value": "4.3/5", "label": "ease of delivering support"},
            {"value": "2 hrs", "label": "saved weekly by most respondents"},
        ],
        "results_copy": [
            (
                "Seven pupils received intervention during the summer term, exceeding the school's original "
                "target of six. Crucially, support was delivered by three teachers and support staff rather than "
                "depending on one specialist practitioner."
            ),
            (
                "Staff rated both ease of delivery and pupil engagement at 4.3 out of 5. They reported improved "
                "grammar and independence, and saw children apply skills from Colourful Semantics and sequencing "
                "activities in English lessons and spoken explanations."
            ),
            (
                "Two of the three survey respondents saved two hours a week on preparation and related admin. "
                "Sustained across the school year, that is up to 78 hours returned to each member of staff: time "
                "that can be spent supporting pupils rather than assembling resources."
            ),
        ],
        "quotes": [
            {
                "quote": "It's very visual and the children enjoy it.",
                "name": "Member of staff",
                "role": "Kings Furlong",
            },
            {
                "quote": "Because it's fun.",
                "name": "Pupil, explaining why they wanted to use Chatterdillo again",
                "role": "Kings Furlong",
            }
        ],
        "ofsted": [
            {
                "title": "Inclusion",
                "text": (
                    "More pupils received early, targeted support through a model that could be delivered by the "
                    "staff already around them, helping prevent needs from becoming a barrier to classroom learning."
                ),
            },
            {
                "title": "Curriculum & Teaching",
                "text": (
                    "Training within the platform and clear activity recommendations helped staff develop the "
                    "confidence to deliver intervention independently."
                ),
            },
            {
                "title": "Achievement & Curriculum",
                "text": (
                    "Staff observations, session records and progress tracking provided evidence of engagement "
                    "and of language skills transferring into wider classroom learning."
                ),
            },
        ],
        "summary": (
            "Kings Furlong's experience shows how a school can extend early language support without adding a "
            "new specialist dependency. Staff gained a usable intervention pathway, pupils enjoyed taking part, "
            "and the school supported more children than it initially set out to reach."
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
