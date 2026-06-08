"""Avatar catalog and color palette for learner profile avatars."""

DEFAULT_AVATAR_CHARACTER = "blank_profile_picture"
DEFAULT_AVATAR_COLOR = "#DEE2E6"

AVATAR_CHARACTERS = [
    {
        "id": "blank_profile_picture",
        "name": "Blank Profile Picture",
        "bio": "",
        "image_filename": "blank_profile_picture.png",
    },
    {
        "id": "arlo_armadillo",
        "name": "Arlo Armadillo",
        "bio": "Arlo Armadillo is always happiest when they are with friends, because they love making people feel helped, included, and cared for.",
        "image_filename": "arlo_armadillo.png",
    },
    {
        "id": "muddles_mole",
        "name": "Muddles Mole",
        "bio": "Muddles Mole is often in the middle of a very interesting thought that hasn't quite found its way out yet.",
        "image_filename": "muddles_mole.png",
    },
    {
        "id": "thoughtful_tortoise",
        "name": "Thoughtful Tortoise",
        "bio": "Thoughtful Tortoise likes to think things over very carefully, which is why they are almost never in a hurry to arrive anywhere at all.",
        "image_filename": "thoughtful_tortoise.png",
    },
    {
        "id": "peppy_pigeon",
        "name": "Peppy Pigeon",
        "bio": "Peppy Pigeon is often full of energy, because they are quite sure that something wonderful is about to happen, and they don't want to be late for it.",
        "image_filename": "peppy_pigeon.png",
    },
    {
        "id": "resilient_red_panda",
        "name": "Resilient Red Panda",
        "bio": "Resilient Red Panda always gets back up again, although sometimes after a tasty snack and a little sit-down.",
        "image_filename": "resilient_red_panda.png",
    },
    {
        "id": "humble_hedgehog",
        "name": "Humble Hedgehog",
        "bio": "Humble Hedgehog is always rather surprised when somebody notices something kind they have done, because they feel that being a good friend is just as natural as having their prickles.",
        "image_filename": "humble_hedgehog.png",
    },
]

AVATAR_COLORS = [
    "#FF7272",
    "#FF9C63",
    "#FFEE59",
    "#86FFBB",
    "#C6FF80",
    "#C3E758",
    "#7BCFFF",
    "#83A6FF",
    "#A1CDFF",
    "#AB7EFF",
    "#FF8EE6",
    "#FDBDD6",
    "#95A3B1",
    "#494949",
]

AVATAR_CHARACTER_IDS = {character["id"] for character in AVATAR_CHARACTERS}
SELECTABLE_AVATAR_CHARACTERS = [
    character for character in AVATAR_CHARACTERS if character["id"] != DEFAULT_AVATAR_CHARACTER
]
AVATAR_COLOR_SET = set(AVATAR_COLORS)
AVATAR_CHARACTER_MAP = {character["id"]: character for character in AVATAR_CHARACTERS}
