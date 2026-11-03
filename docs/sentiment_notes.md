# Sentiment Engine Notes (for the NLP member)

## Where we are
- `data/hinglish_test_set.csv` has 64 labelled comments: 27 English, 28 Hinglish, 9 hard cases (sarcasm, mixed opinions, negation).
- The baseline `lexicon-v1` engine scores about 75% overall, but only 22% on hard cases. See `docs/accuracy_report.md`.
- Its main weakness: when a comment contains no known word it says "neutral", so many negative comments are missed (negative recall is 50%).

## Important caveat
The test set and the lexicon were written by the same person, so the baseline score is probably higher than it would be on comments from real citizens. Review the labels as a team and add comments written by other people.

## How to compare models
```bash
python manage.py evaluate_sentiment --engine lexicon --write
pip install transformers torch                 # large download, needs internet
python manage.py evaluate_sentiment --engine all --write
```
The transformer engine uses `cardiffnlp/twitter-xlm-roberta-base-sentiment` as a first candidate. It has not been run yet because it needs a download. Try 2 or 3 candidate models by changing `MODEL_ID` in `sentiment/transformer_engine.py` and compare the reports.

## Rules for fair testing
1. Do not edit the word lists after looking at the wrong predictions and then re-score on the same file. That inflates the score. Keep 20 comments in a separate file (for example `data/hinglish_holdout.csv`) that you never tune on.
2. Add at least 20 more comments written by people who did not build the engine.
3. Report accuracy by type (English, Hinglish, hard) and say plainly that sarcasm is a known weakness.
4. Show the confidence score in the dashboard so officials know when the model is unsure.

## Choosing the final engine
Pick the engine with the best Hinglish accuracy that also fits free hosting memory (often about 512 MB). If the best model is too large, keep it for local demos and use the lexicon engine or a hosted inference API when deployed.
