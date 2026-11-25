# Tag card redesign

Replace the radar chart with a fresh design based on the supplied solved.ac markup: eight icon tiles showing tag keys, tier badges and ratings, followed by seven secondary tags in rating order. Highlight the strongest positive rating. Use real profile data, never the pasted example values.

Keep the SVG endpoint, 200–1000px height scaling, dark/light themes and `top` selection. Names are always visible; `text` remains accepted for existing links. Missing default tags show zero. Sort copies of stats. Embed all artwork so rendering needs no image downloads.

The chosen approach is a new layout in the existing Satori renderer, using inline SVG artwork and the existing tier thresholds and themes. Keeping the radar chart would not match the reference. Adding a browser-based renderer would add unnecessary runtime dependencies. The pasted CSS class definitions are absent, so spacing and styling are original design choices.

Scope: `src/cards/tags.tsx`, README option descriptions, a runnable rendering/selection regression check and its package script. No API, cache or other card changes.
