from .game_data import GAME_DESCRIPTIONS

colourful_semantics_title = GAME_DESCRIPTIONS['colourful_semantics']['title']
think_and_find_title = GAME_DESCRIPTIONS['think_and_find']['title']
categorisation_title = GAME_DESCRIPTIONS['categorisation']['title']
story_train_title = GAME_DESCRIPTIONS['story_train']['title']

colourful_semantics_complexity = GAME_DESCRIPTIONS['colourful_semantics']['exercise_complexity']
think_and_find_complexity = GAME_DESCRIPTIONS['think_and_find']['exercise_complexity']
categorisation_complexity = GAME_DESCRIPTIONS['categorisation']['exercise_complexity']
story_train_complexity = GAME_DESCRIPTIONS['story_train']['exercise_complexity']

QUESTIONS = [
    {"complexity": None, "exercise_complexity": None, "exercise": None, "skill": "Attention and listening", "topic": "Attention and Listening", "text": "Can your child attend to an activity for 5 minutes?", "order": 1},
    {"complexity": None, "exercise": None, "skill": "Attention and listening", "topic": "Attention and Listening", "text": "Does your child seem to understand what you're saying most of the time?", "order": 2},
    {"complexity": colourful_semantics_complexity, "exercise": colourful_semantics_title, "skill": "Answering 'yes/no' and 'what' questions", "topic": "Receptive Language", "text": "Can your child respond to simple 'yes/no' or 'what' questions through speech or gesture?", "order": 3},
    {"complexity": colourful_semantics_complexity, "exercise": colourful_semantics_title, "skill": "Answering concrete questions such as 'where' and 'who'", "topic": "Receptive Language", "text": "Can your child answer 'where' or 'who' questions?", "order": 4},
    {"complexity": think_and_find_complexity, "exercise": think_and_find_title, "skill": "Following simple instructions", "topic": "Receptive Language", "text": "Can your child follow simple directions like 'get your shoes' or 'sit down'?", "order": 5},
    {"complexity": think_and_find_complexity, "exercise": think_and_find_title, "skill": "Following multi-step instructions", "topic": "Receptive Language", "text": "Can your child follow multi-step directions like 'put your shoes on and wait by the door'?", "order": 6},
    {"complexity": think_and_find_complexity, "exercise": think_and_find_title, "skill": "Understanding concepts", "topic": "Receptive Language", "text": "Does your child understand concepts like 'big and small'?", "order": 7},
    {"complexity": categorisation_complexity, "exercise": categorisation_title, "skill": "Grouping things together", "topic": "Receptive Language", "text": "Can your child group items that belong together? eg. animals, foods, items of clothing", "order": 8},
    {"complexity": story_train_complexity, "exercise": story_train_title, "skill": "Answering abstract questions such as 'why' and 'how'", "topic": "Receptive Language", "text": "Can your child answer 'why' or 'how' questions?", "order": 9},
    {"complexity": colourful_semantics_complexity, "exercise": colourful_semantics_title, "skill": "Vocabulary development", "topic": "Expressive Language", "text": "Does your child typically use sentences with two or more words?", "order": 10},
    {"complexity": colourful_semantics_complexity, "exercise": colourful_semantics_title, "skill": "Vocabulary development", "topic": "Expressive Language", "text": "Does your child use new words regularly?", "order": 11},
    {"complexity": colourful_semantics_complexity, "exercise": colourful_semantics_title, "skill": "Vocabulary development", "topic": "Expressive Language", "text": "Do they repeat the same words or phrases often?", "order": 12},
    {"complexity": colourful_semantics_complexity, "exercise": colourful_semantics_title, "skill": "Vocabulary development", "topic": "Expressive Language", "text": "Can your child name everyday items? eg. car, cup, hat, chair etc.", "order": 13},
    {"complexity": colourful_semantics_complexity, "exercise": colourful_semantics_title, "skill": "Using complete sentences", "topic": "Expressive Language", "text": "Does your child use correct word order when speaking in sentences?", "order": 14},
    {"complexity": colourful_semantics_complexity, "exercise": colourful_semantics_title, "skill": "Using complete sentences", "topic": "Expressive Language", "text": "Does your child use complete sentences?", "order": 15},
    {"complexity": colourful_semantics_complexity, "exercise": colourful_semantics_title, "skill": "Vocabulary development", "topic": "Expressive Language", "text": "Does your child easily find the right words when speaking?", "order": 16},
    {"complexity": colourful_semantics_complexity, "exercise": colourful_semantics_title, "skill": "Vocabulary development", "topic": "Expressive Language", "text": "Does your child stay calm and composed when thinking of what to say?", "order": 17},
    {"complexity": story_train_complexity, "exercise": story_train_title, "skill": "Describing and predicting events", "topic": "Expressive Language", "text": "Can your child retell something that happened at school or in a story?", "order": 18},
    {"complexity": story_train_complexity, "exercise": story_train_title, "skill": "Describing and predicting events", "topic": "Expressive Language", "text": "Does your child describe events in a logical order?", "order": 19}
]

RECOMMENDATIONS = [
    {"exercises": [colourful_semantics_title], "focus": colourful_semantics_title, "nextlevel": think_and_find_title}, # complexity 0
    {"exercises": [colourful_semantics_title, think_and_find_title], "focus": think_and_find_title, "nextlevel": categorisation_title}, # complexity 1
    {"exercises": [colourful_semantics_title, think_and_find_title, categorisation_title], "focus": categorisation_title, "nextlevel": story_train_title},
    {"exercises": [colourful_semantics_title,think_and_find_title, categorisation_title, story_train_title], "focus": story_train_title, "nextlevel": None}
]