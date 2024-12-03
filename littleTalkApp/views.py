from django.shortcuts import render


def home(request):
    return render(request, 'home.html')


def game_description(request, game_name):
    game_descriptions = {
        'colourful_semantics': {
            'title': 'Colourful Semantics',
            'description': 'Colourful semantics is an approach designed to support children developing their understanding of sentence structure and expand the length of their sentences.',
            'description2': 'The structure of a sentence (syntax) is colour coded and then these are linked to their meaning (semantics)',
            'link': 'https://jamiealanwelsh.github.io/colour-semantics-webgl/',
        },
        'exercise2': {
            'title': 'Exercise 2',
            'description': 'Another fun learning activity.',
            'description2': '',
            'link': 'https://jamiealanwelsh.github.io/exercise2/',
        },
    }
    game = game_descriptions.get(game_name, None)
    if not game:
        return render(request, '404.html', status=404)  # Return a 404 if the game name is invalid
    
    return render(request, 'game_description.html', {'game': game})