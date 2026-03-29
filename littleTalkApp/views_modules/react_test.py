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
    
    # Fixture data for the sentence-to-picture matching exercise
    exercise_payload = {
        "questions": [
            {
                "id": "prompt-1",
                "prompt": "\"Can you show me which icon is a house?\"",
                "correctIconIds": ["house"]
            },
            {
                "id": "prompt-2",
                "prompt": "\"Can you point to the help icon?\"",
                "correctIconIds": ["help"]
            },
            {
                "id": "prompt-3",
                "prompt": "\"Which one is the children icon?\"",
                "correctIconIds": ["children"]
            },
        ],
        "pictures": [
            {"id": "house", "imageUrl": "/static/icons/house.png", "label": "House"},
            {"id": "help", "imageUrl": "/static/icons/help.png", "label": "Help"},
            {"id": "children", "imageUrl": "/static/icons/children.png", "label": "Children"},
            {"id": "diary", "imageUrl": "/static/icons/diary.png", "label": "Diary"},
            {"id": "graph", "imageUrl": "/static/icons/graph.png", "label": "Graph"},
        ]
    }
    
    context = {
        "exercise_payload_json": json.dumps(exercise_payload)
    }
    
    return render(request, "exercises/sentence_matching_example.html", context)

def colourful_semantics(request):
    return render(request, "exercises/colourful_semantics.html")
