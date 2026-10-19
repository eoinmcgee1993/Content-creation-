# Prompt templates

Replace the `[brackets]`. These are starting points, not tested benchmarks.

## 1. Plain technical English (ASD-STE100, about 80%)
```
Explain [topic] for [audience].
Follow ASD-STE100 about 80% of the way: short sentences, common words,
active voice, one idea per sentence. Keep it natural. Do not sound robotic.
Keep necessary technical terms and define them once.
```
Variation: rewrite existing text. Start with "Rewrite the text below" and paste it after the rules.

## 2. Diagram
```
Show [process or concept] as a diagram, not paragraphs.
Output [Mermaid | inline SVG]. Label every step with 5 words or fewer.
After the diagram, add 3 lines of notes at most.
```

## 3. Interactive page
```
Build one HTML file, with CSS and JavaScript inline, that works as [tool].
Include [sliders for X and Y], a live chart, and smooth transitions.
No external libraries. Works on a phone screen. Show the formula used.
```
Example: "[tool] = an SIP calculator". Add "This is an illustration, not financial advice."

## 4. Explainer video
```
Write a [60]-second explainer script about [topic] in a clear, visual style.
Give a table: time, visual, narration. Narration under [150] words,
written for text-to-speech (no abbreviations, spell out numbers).
```
Then send the approved narration to your TTS tool (for example ElevenLabs).

## Combined
```
Topic: [topic]. Audience: [audience].
1. Explain it in ASD-STE100 about 80% of the way.
2. Add a diagram of the main process.
3. Offer one interactive page idea, then build it if I say yes.
4. Draft a 60-second video script from the explanation.
```
