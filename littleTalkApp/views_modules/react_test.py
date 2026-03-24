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
        "exerciseId": "sentence-matching-example",
        "title": "Match the Sentence to the Picture",
        "instructions": "Read the sentence, then click on the matching picture.",
        "prompts": [
            {
                "id": "prompt-1",
                "text": "Click the picture of a frog",
                "role": "prompt"
            },
            {
                "id": "prompt-2",
                "text": "Click the picture of a cat",
                "role": "prompt"
            },
            {
                "id": "prompt-3",
                "text": "Click the picture of a bird",
                "role": "prompt"
            },
        ],
        "icons": [
            {
                "id": "icon-frog",
                "imageUrl": "/static/images/frog.svg",
                "label": "Frog",
                "altText": "A green frog"
            },
            {
                "id": "icon-cat",
                "imageUrl": "/static/images/cat.svg",
                "label": "Cat",
                "altText": "An orange cat"
            },
            {
                "id": "icon-bird",
                "imageUrl": "/static/images/bird.svg",
                "label": "Bird",
                "altText": "A blue bird"
            },
            {
                "id": "icon-dog",
                "imageUrl": "/static/images/dog.svg",
                "label": "Dog",
                "altText": "A brown dog"
            },
        ],
        "pairs": [
            {
                "promptId": "prompt-1",
                "correctIconIds": ["icon-frog"]
            },
            {
                "promptId": "prompt-2",
                "correctIconIds": ["icon-cat"]
            },
            {
                "promptId": "prompt-3",
                "correctIconIds": ["icon-bird"]
            },
        ],
        "showFeedback": True,
        "allowRetry": True
    }
    
    context = {
        "exercise_payload_json": json.dumps(exercise_payload)
    }
    
    return render(request, "exercises/sentence_matching_example.html", context)