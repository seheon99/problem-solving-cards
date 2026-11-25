# solvedac-cards

SVG cards of a [solved.ac](https://solved.ac) profile, for GitHub READMEs and anywhere else that shows images.

![Profile](https://solvedac-cards.seheon.kr/profile/seheon99)

![Tags](https://solvedac-cards.seheon.kr/tags/seheon99?text=true) ![Problems](https://solvedac-cards.seheon.kr/problems/seheon99)

## Usage

Put an image link in Markdown, replacing `HANDLE` with a solved.ac handle:

```md
![Profile](https://solvedac-cards.seheon.kr/profile/HANDLE)
![Tags](https://solvedac-cards.seheon.kr/tags/HANDLE?text=true)
![Problems](https://solvedac-cards.seheon.kr/problems/HANDLE)
```

### Cards

| Path | Shows | Default height | Height range |
| --- | --- | --- | --- |
| `/profile/:handle` | Tier, rating, class, solved count and progress to the next tier | 100px | 100–500px |
| `/tags/:handle` | Tag tiles with icons, tiers and ratings, plus your next 7 highest-rated tags | 200px | 200–1000px |
| `/problems/:handle` | Difficulty donut with tier counts and percentages | 200px | 200–1000px |

### Options

| Query | Cards | Effect |
| --- | --- | --- |
| `size={int}` | all | Card height in px, within the range above |
| `color=dark` / `color=light` | all | Color scheme; `dark` by default |
| `top=true` | `/tags` | Show your 8 highest-rated tags instead of the default 8 |
| `text=true` | `/tags` | Accepted for older links; tag names are always shown |

`top` turns on whenever it's present, whatever its value, so leave it out to use the default tiles.

The default tiles are `math`, `impl`, `greedy`, `string`, `ds`, `graph`, `dp` and `geom`. The highest-rated tag is highlighted in its tier color. Missing default tags show a zero rating. At the default height the card is 704px wide; both dimensions scale with `size`.

The problems card is 420px wide at its default height. Its center total and tier percentages include rated difficulties (levels 1–30), excluding unrated problems. Slices run from hardest to easiest; the breakdown lists active tiers from Bronze through Ruby. Both dimensions scale with `size`.

Handles must match `[A-Za-z0-9_]{1,64}`. Other handles get `400`; unknown handles get `404`.

## Credits

Original project by [Starcea](https://github.com/star0202) ([star0202/solvedac-cards](https://github.com/star0202/solvedac-cards)). MIT licensed; see [LICENSE](LICENSE).
