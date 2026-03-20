"""Static editorial, game, and assessment content modules."""

from .assessments import QUESTIONS, RECOMMENDATIONS
from .game_descriptions import GAME_DESCRIPTIONS
from .testimonials import LANDING_TESTIMONIALS, get_landing_testimonials

__all__ = [
	"GAME_DESCRIPTIONS",
	"QUESTIONS",
	"RECOMMENDATIONS",
	"LANDING_TESTIMONIALS",
	"get_landing_testimonials",
]
