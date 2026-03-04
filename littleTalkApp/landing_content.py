LANDING_TESTIMONIALS = [
    {
        "quote": (
            "It's definitely worth a go as seeing quite an improvement in a short time. Pupils "
            "love the exercises and putting the pictures in order, particularly the pizza pics."
        ),
        "name": "Hannah Lacey",
        "role": "Teaching Assistant",
        "occupation": "Southview Primary School",
        "image": None,
    },
    {
        "quote": (
            "We reached out to Chatterdillo hoping to increase access to SALT for children who "
            "were unable to access NHS services due to the change in referral criteria in Lincolnshire. "
            "The impact has been incredible. Our students want to go on Chatterdillo, they find it fun, "
            "engaging, and it has made a real difference in their progress."
        ),
        "name": "Corrine Mitcham",
        "role": "SENDCo",
        "occupation": "South View Primary School",
        "image": None,
    },
    {
        "quote": (
            "Using the app for just 10 minutes a day with my 2 year old has made a real "
            "difference. His motivation to talk and engage has grown massively and it has "
            "become a fun part of our day."
        ),
        "name": "Danni",
        "role": "Parent",
        "occupation": "Home Learning",
        "image": None,
    },
        {
        "quote": (
            "We piloted Chatterdillo looking for better coverage and delivery of SALT provision "
            "and it delivered. The programme is definitely worth investing in. It is intuitive, "
            "easy to use, doesn't require a specialist and children really enjoy it and are "
            "motivated by it."
        ),
        "name": "Craig Kendall",
        "role": "Head/SENDco",
        "occupation": "Peakirk-cum-Glinton",
        "image": None,
    },
    {
        "quote": (
            "An example is a child who has selective mutism who when previously using the app "
            "would engage with the learning but would not speak. (Teacher modelling language) "
            "Is now speaking independently while using the app."
        ),
        "name": "Suzanne Waller",
        "role": "SENDCo/Class Teacher",
        "occupation": "Collingtree Primary School",
        "image": None,
    },
    {
        "quote": (
            "I would definitely recommend another school to use this app. Other adults we have "
            "shown are very impressed (speech and language therapist and teacher of the deaf) "
            "and the progress the students have made. They were impressed with how it made the "
            "students excited to learn."
        ),
        "name": "Emily Whitwood Bott",
        "role": "SENCo and Class Teacher",
        "occupation": "Greens Norton Primary School",
        "image": None,
    },
    {
        "quote": (
            "Staff felt more confident delivering it through the app rather than in person. "
            "Time was saved preparing resources and we felt confident the assessment ensured "
            "the correct activities were selected. Pupil engagement and confidence improved and "
            "app outcomes were better than pre-Chatterdillo."
        ),
        "name": "Craig Kendall",
        "role": "Head/SENDco",
        "occupation": "Peakirk-cum-Glinton",
        "image": None,
    },
    {
        "quote": (
            "Children have loved using this and have wanted to do it every day. They are eager "
            "to complete the activities."
        ),
        "name": "Emily Whitwood Bott",
        "role": "SENCo and Class Teacher",
        "occupation": "Greens Norton Primary School",
        "image": None,
    },
    {
        "quote": "It's engaging, family-friendly and easy to navigate. I endorse it wholeheartedly",
        "name": "Amelia",
        "role": "Speech and Language Therapist",
        "occupation": "Independent Practitioner",
        "image": None,
    },
    {
        "quote": (
            "The little boy I work with enjoys it every time. He now speaks with much better "
            "fluency."
        ),
        "name": "Leanne Pritchard",
        "role": "Teaching Assistant",
        "occupation": "Southview Primary School",
        "image": None,
    },
    {
        "quote": "I had begun to lose hope that my son would ever be interested in talking.",
        "name": "Grace",
        "role": "Parent",
        "occupation": "Home Learning",
        "image": None,
    },
    {
        "quote": (
            "Do it! It's easy to get children signed up, a great platform to navigate and the "
            "assessment is quick and easy which leads onto recommendations that make a "
            "difference for children."
        ),
        "name": "Corrine Mitcham",
        "role": "SENDCO",
        "occupation": "Southview Primary School",
        "image": None,
    },
    {
        "quote": "This is a huge need in our work and a great help for parents.",
        "name": "Jeremy",
        "role": "CEO",
        "occupation": "Talkback - Autism Support Charity",
        "image": None,
    },
    {
        "quote": (
            "We had a little boy who struggles with verbalising his thoughts using it. He "
            "loved being able to be instantly successful and build sentences independently "
            "with the colourful semantics games."
        ),
        "name": "Rosie Burrows McGill",
        "role": "SENCO",
        "occupation": "Trinity CE Primary School",
        "image": None,
    },
    {
        "quote": (
            "Chatterdillo has the potential to develop into a Speech and Language intervention "
            "of choice for schools. The team listen to feedback and are keen to improve "
            "the service."
        ),
        "name": "Claire Flawell",
        "role": "SENCO",
        "occupation": "Hunnyhill Ormiston Academy",
        "image": None,
    }
]


def get_landing_testimonials():
    testimonials = []
    for testimonial in LANDING_TESTIMONIALS:
        item = testimonial.copy()
        name_parts = item["name"].split()
        item["initials"] = "".join(part[0] for part in name_parts[:2]).upper()
        testimonials.append(item)
    return testimonials
