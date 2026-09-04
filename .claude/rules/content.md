---
paths: ["content/**", "src/app/**", "src/components/**"]
---
# Content rules
- Facts only from content/facts.md. If a claim is not there, do not make it. Use the TBC component and a TODO(client) comment.
- Voice: second person, present tense, short sentences, concrete nouns, numerals for fees and durations, Indian English spelling, no exclamation marks, no em-dashes, no "unlock / elevate / journey / passion / world-class / best-in-class".
- Certificates named exactly: "Italian Barista Certificate (IBC), issued by Espresso Academy, Florence"; "SCA Coffee Skills Program". Never "SCA-certified course" until content/facts.md says AST status is confirmed; write "training aligned to the SCA Coffee Skills Program".
- Prices always "incl. GST" or "+ GST" explicitly. When null, render "Fee: TBC" not a number.
- Every course page has "Who this is for" and "Who this is not for".
- Honesty clause on certification pages: a certificate helps you get an interview; your skills get you the job.
- Placeholder copy is allowed only inside components marked data-placeholder="true" and listed in docs/STATUS.md.
