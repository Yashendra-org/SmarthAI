# Sentiment Accuracy Report

Test set: `data/hinglish_test_set.csv`. Labels were assigned by the team, so results show how well the engine agrees with our own judgement, not a universal measure.

## Summary

| Engine | Comments | Accuracy | Macro F1 |
|---|---|---|---|
| lexicon-v1 | 64 | 75% | 0.75 |

## lexicon-v1

**By comment type**

| Type | Correct | Total | Accuracy |
|---|---|---|---|
| english | 24 | 27 | 89% |
| hard | 2 | 9 | 22% |
| hinglish | 22 | 28 | 79% |

**Per label**

| Label | Precision | Recall | F1 | Support |
|---|---|---|---|---|
| positive | 0.85 | 0.85 | 0.85 | 20 |
| negative | 0.92 | 0.50 | 0.65 | 24 |
| neutral | 0.61 | 0.95 | 0.75 | 20 |

**Confusion matrix** (rows = true label, columns = predicted)

| True \ Predicted | positive | negative | neutral |
|---|---|---|---|
| positive | 17 | 0 | 3 |
| negative | 3 | 12 | 9 |
| neutral | 0 | 1 | 19 |

**Wrong predictions (16)**

| Comment | True | Predicted | Confidence |
|---|---|---|---|
| Mere parivar ke liye yeh yojana vardaan sabit hui | positive | neutral | 0.5 |
| Sab kuch online ho gaya, bahut convenient raha | positive | neutral | 0.5 |
| Pehle dikkat thi par ab sab theek ho gaya, achha laga | positive | neutral | 0.5 |
| Money has not reached my account even after three months | negative | neutral | 0.5 |
| Officers were rude and nobody answered my questions | negative | neutral | 0.5 |
| This policy is useless for small farmers, only big landowners benefit | negative | neutral | 0.5 |
| Aavedan reject ho gaya aur koi karan nahi bataya | negative | neutral | 0.5 |
| Server hamesha down rehta hai, time barbaad hua | negative | neutral | 0.5 |
| Is yojana ka koi laabh nahi mila, sirf dhokha hai | negative | neutral | 0.5 |
| Bank mein paisa aane mein bahut deri ho rahi hai, ye theek nahi | negative | neutral | 0.5 |
| Yeh scheme sirf kagaz par hai, kisi ko fayda nahi mila | negative | positive | 0.6 |
| Kaam nahi hota, chakkar kaat kaat ke thak gaye | negative | neutral | 0.5 |
| Great, another portal that never loads | negative | positive | 0.6 |
| Wow, three months and still no payment, amazing service | negative | neutral | 0.5 |
| Scheme is good but the website is terrible | negative | positive | 0.6 |
| Form bhar diya hai, ab intezaar hai | neutral | negative | 0.6 |
