**Screener V2:**

**Spec:**

Screener V2 is intended to phase out/replace the current screener in Chatterdillo.  
Completing the V2 screener will take the user to a summary page (visually and UX identical to the current screener summary: Strong areas, Areas for support), but with the V2 updated skills.

The screener page/view will give the user up to three options:  
1\. View old Screener Results (if they have old screener entries)  
2\. View Screener Results (if they have submitted a new screener  
3\. Submit Screener / Submit Re-Screener

The user should NOT be able to start the old screener anymore. The intention is only to allow users to view old screener results for admin, but not be able to submit any new information through the old screener \- they should instead switch to the new screener.

The new screener should also output an array of 3 exercise id recommendations \- the logic behind the recommendation scoring is at the bottom of the document under. The old screener recommendation (single integer) should be treated as redundant. We will not be using this moving forward.

Screener questions, and their mappings (skill and exercise ID (where applicable))

**Questions to determine if a child can use Chatterdillo:**

1. **"Can the child attend to an activity for 5 minutes?"**  
    **Skill:** Attention and listening  
2. **"Can the child point to/choose the correct object when named?"**  
    **Skill:** Attention and listening

**Rules for first two questions:**   
If both questions are Yes then recommend Chatterdillo as suitable  
Otherwise advise that Chatterdillo may not be suitable

we can still return exercise recommendations as present in the current logic.

This logic is consistent with the previous screener.

**Questions to determine user skills they have, skills to work on, and exercise recommendations \- arranged into Blanks Levels.**

**Blank Level 1:**

1. **"Can the child name everyday objects (e.g. chair, hat, bag, toy)?"**  
    **Skill:** Naming common objects  
    **Exercise:** What's in the bag  
2. **“Does the child regularly use new words they have recently learned?"**  
    **Skill:** Vocabulary development  
    **Exercise:** What’s in the bag  
3. **"Can the child understand simple position words (e.g. in, on, under)?"**  
    **Skill:** Understanding prepositions  
    **Exercise:** Spot on  
4. **"Can the child follow pronoun-based instructions (eg. “give the ball to her”)?"**  
    **Skill:** Following pronoun instructions  
    **Exercise:** Who’s who  
5. **“Can the child understand action words (e.g. eating, running, jumping)?”**  
   **Skill:** Using action words  
   **Exercise:** Colourful Semantics Early

**Blank Level 2:**

1. **"Can the child answer “who”, “what”, or “where” questions?"**  
    **Skill:** Answering 'who/what/where' questions  
    **Exercise:** Colourful Semantics Standard  
2. **"Can the child understand descriptive concepts like 'big or small'?"**  
    **Skill:** Understanding concepts  
    **Exercise:** Concept Quest  
3. **"Can the child group items that belong together (e.g. animals, foods, clothes)?"**  
    **Skill:** Grouping things together  
    **Exercise:** Categorisation  
4. **"Can the child talk about when something happens (e.g. “in the morning”, “at night”)?"**  
    **Skill:** Understanding time concepts  
    **Exercise:** Story Train Standard  
5. **"Can the child follow multi-step instructions (e.g. “Put your shoes on and wait by the door”)"**  
    **Skill:** Following multi-step instructions  
    **Exercise:** Think and Find

**Blank Level 3:**

1. **"Can the child describe events in the right order (what happened first, next, and last)?"**  
    **Skill:** Describing and sequencing events  
    **Exercise:** Story Train Standard  
2. **"Can the child retell something that has happened or a simple story?"**  
    **Skill:** Retelling events/stories  
    **Exercise:** Story Train Plus  
3. **"Can the child work out how someone is feeling from a situation or picture?"**  
    **Skill:** Understanding emotions/mental states  
    **Exercise:** In the know

**Blank Level 4:**

1. **"Can the child answer “why” or “how” questions?"**  
    **Skill:** Answering 'why/how' questions  
    **Exercise:** Colourful Semantics Plus  
2. **"Can the child say what might happen next in a story or situation?"**  
    **Skill:** Predicting outcomes  
    **Exercise:** What happens next  
3. **"Can the child give clear step-by-step instructions (e.g. “How do you brush your teeth?”)?”**  
    **Skill:** Giving sequential instructions  
    **Exercise:** Task Master  
4. **"Can the child explain how they know something (e.g. “How do you know the girl is upset?”)?”**  
    **Skill:** Justifying with evidence  
    **Exercise:** In the know

 

**Exercise approximate difficulties:**

**Stage 1 (easiest \- expected to be used by early years):**

- whats in the bag  
- colourful semantics early  
- spot on  
- whos who

**Stage 2 (medium \- expected to be used by KS1 pupils)**

- Colourful semantics standard  
- Concept quest,  
- Think and Find  
- Categorisation  
- Story Train standard

**Stage 3 (hardest \- expected to be used by KS2 pupils)**

- Colourful semantics plus  
- Story train plus  
- What happens next  
- Task master  
- In the know

**Exercise Recommendation Logic:**  
Screener results should use this logic to output an array of 3 exercise IDs (we will use these to recommend user exercises on our practice page in another patch).

**Scoring:** Every “no” adds 1 point to the mapped exercise  
**Deduping:** if multiple failed questions map to the same exercise, aggregate the points  
**Recommendation:** return the top 3 unique exercises by score,  
**Tie-Breaks:** Prefer the lower stage//lower Blank level first  
**Guardrail:** Fine without significant guard rails \- It is for example okay for a child to be recommended for a stage 1 and stage 3 exercise.