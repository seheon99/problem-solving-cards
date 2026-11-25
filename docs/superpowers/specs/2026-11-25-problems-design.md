# Problems card redesign

Replace the avatar donut with a difficulty-distribution card based on the supplied solved.ac markup. Keep separate slices per solved difficulty, ordered hardest first, and use one color per tier family. Add a legend showing active tier families in ascending order, their solved counts and percentages. Show the rated solved total in the center and the handle in the heading.

Count levels 1–30 only, with percentages calculated from that same population. Ignore zero-count levels. Empty profiles show a neutral ring, zero total and an empty-state label. Support all six families through Ruby and a single full-circle slice. The reference's interactive switch is omitted in this static SVG.

Use the existing renderer, D3, route signature and API data. Reuse the new tag card's theme, border and typography conventions. Default dimensions are 420×200, scaling with the existing 200–1000px height option. No image downloads or runtime dependencies.

This continues the authorized redesign using the pasted markup. A new static layout in the existing renderer matches the endpoint's purpose; an interactive browser view would change its image contract. No request-manager or cache changes are needed.
