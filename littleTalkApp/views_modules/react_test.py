import json
from django.shortcuts import render

def hi_from_react(request):
    """Original proof-of-concept React route."""
    return render(request, "hello_from_react.html")


def sentence_matching_example(request):
    """
    Example exercise using the React framework.
    Renders a sentence-to-picture matching exercise with fixture data.
    """
    
    # Sample icons from static/icons folder
    # Using actual PNG assets instead of SVG
    sample_icons = [
        {"id": "icon-1", "imageUrl": "/static/icons/house.png", "label": "House"},
        {"id": "icon-2", "imageUrl": "/static/icons/help.png", "label": "Help"},
        {"id": "icon-3", "imageUrl": "/static/icons/children.png", "label": "Children"},
        {"id": "icon-4", "imageUrl": "/static/icons/diary.png", "label": "Diary"},
        {"id": "icon-5", "imageUrl": "/static/icons/graph.png", "label": "Graph"},
    ]
    
    # Fixture data for the sentence-to-picture matching exercise
    exercise_payload = {
        "exerciseId": "sentence-matching-example",
        "title": "Match the picture to the concept",
        "instructions": '\"Can you show me which icon is a house?\"',
        "prompts": [
            {
                "id": "prompt-1",
                "text": "\"Can you show me which icon is a house?\"",
                "role": "prompt"
            },
            {
                "id": "prompt-2",
                "text": "\"Can you point to the help icon?\"",
                "role": "prompt"
            },
            {
                "id": "prompt-3",
                "text": "\"Which one is the children icon?\"",
                "role": "prompt"
            },
        ],
        "icons": sample_icons,
        "pairs": [
            {
                "promptId": "prompt-1",
                "correctIconIds": ["icon-1"]
            },
            {
                "promptId": "prompt-2",
                "correctIconIds": ["icon-2"]
            },
            {
                "promptId": "prompt-3",
                "correctIconIds": ["icon-3"]
            },
        ],
        "showFeedback": True,
        "allowRetry": True
    }
    
    context = {
        "exercise_payload_json": json.dumps(exercise_payload)
    }
    
    return render(request, "exercises/sentence_matching_example.html", context)