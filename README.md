# ps-cards

Animated SVG cards of your [solved.ac](https://solved.ac) and [LeetCode](https://leetcode.com) profiles, for GitHub READMEs and anywhere else that shows images.

Pick a card below, copy its snippet, and replace `HANDLE` with your solved.ac or LeetCode handle. Every card takes `color=light` or `color=dark` (default) and a `size`; see [Options](#options).

- [Profile](#profile): tier crest, rating and progress
- [Tags](#tags): rating per algorithm tag
- [Problems](#problems): difficulty distribution
- [Streak](#streak): a year of daily activity
- [Rating](#rating): rating over the past year
- [Summary](#summary): how your rating is made up
- [LeetCode](#leetcode): solved problems by difficulty, ranking and contest rating

---

## Profile

<picture>
  <source media="(prefers-color-scheme: light)" srcset="https://ps-cards.seheon.kr/solvedac/profile/seheon99?color=light">
  <img alt="Profile card" src="https://ps-cards.seheon.kr/solvedac/profile/seheon99">
</picture>

Your tier crest, handle, rating and progress to the next tier, with tiles for solved count, class, rank and longest streak.

- The crest's laurel grows from level V to level I; Master gets the largest. Diamond and up glow.
- On load the crest is drawn stroke by stroke, the rating counts up, the progress bar fills and the tiles appear one by one. Afterwards the crest flips like a coin every few seconds and a shine slides across the bar.

```md
![Profile](https://ps-cards.seheon.kr/solvedac/profile/HANDLE)
```

720×200px by default, the same width as the Summary and Streak cards; `size` sets the height from 100 to 1000.

## Tags

<picture>
  <source media="(prefers-color-scheme: light)" srcset="https://ps-cards.seheon.kr/solvedac/tags/seheon99?color=light">
  <img alt="Tags card" src="https://ps-cards.seheon.kr/solvedac/tags/seheon99">
</picture>

Eight tag tiles with icons, tier badges and ratings, plus your next seven highest-rated tags. The highest-rated tag is highlighted in its tier colour.

```md
![Tags](https://ps-cards.seheon.kr/solvedac/tags/HANDLE)
```

| Query | Effect |
| --- | --- |
| `top=true` | Show your 8 highest-rated tags instead of the default 8 |
| `text=true` | Accepted for older links; tag names are always shown |

The default tiles are `math`, `impl`, `greedy`, `string`, `ds`, `graph`, `dp` and `geom`; missing ones show a zero rating. `top` turns on whenever it's present, whatever its value, so leave it out to use the default tiles.

704×200px by default; `size` sets the height from 200 to 1000.

## Problems

<picture>
  <source media="(prefers-color-scheme: light)" srcset="https://ps-cards.seheon.kr/solvedac/problems/seheon99?color=light">
  <img alt="Problems card" src="https://ps-cards.seheon.kr/solvedac/problems/seheon99">
</picture>

A donut of solved problems by difficulty, from hardest to easiest, with counts and percentages per tier from Bronze through Ruby. The total and percentages cover rated levels 1–30 and leave out unrated problems.

```md
![Problems](https://ps-cards.seheon.kr/solvedac/problems/HANDLE)
```

420×200px by default; `size` sets the height from 200 to 1000.

## Streak

<picture>
  <source media="(prefers-color-scheme: light)" srcset="https://ps-cards.seheon.kr/solvedac/streak/seheon99?color=light">
  <img alt="Streak card" src="https://ps-cards.seheon.kr/solvedac/streak/seheon99">
</picture>

The past year of daily activity, each day coloured by the hardest tier you solved that day, with your current and longest streak, problems solved and active days. Days follow solved.ac's day (KST); days a streak freeze covered get a blue outline.

- Weeks pop in one after another, and today's square pulses.

```md
![Streak](https://ps-cards.seheon.kr/solvedac/streak/HANDLE)
```

720×200px by default; `size` sets the height from 200 to 1000.

## Rating

<picture>
  <source media="(prefers-color-scheme: light)" srcset="https://ps-cards.seheon.kr/solvedac/rating/seheon99?color=light">
  <img alt="Rating card" src="https://ps-cards.seheon.kr/solvedac/rating/seheon99">
</picture>

Your rating over the past year on tier-coloured bands, with your current rating, the year's change and your best. The line steps at each day your rating changed and takes the colour of the tier band it's in.

- The line draws itself, the area beneath fades in, and the latest point keeps pulsing.

```md
![Rating](https://ps-cards.seheon.kr/solvedac/rating/HANDLE)
```

560×200px by default; `size` sets the height from 200 to 1000.

## Summary

<picture>
  <source media="(prefers-color-scheme: light)" srcset="https://ps-cards.seheon.kr/solvedac/summary/seheon99?color=light">
  <img alt="Summary card" src="https://ps-cards.seheon.kr/solvedac/summary/seheon99">
</picture>

How your rating is made up, and what moves it next:

- **다음 티어**: points left to the next tier, with progress through your current one.
- **레이팅 구성**: the three parts of your rating, each against its maximum: 상위 100문제의 난이도 합, CLASS and 문제수에 따른 보너스, with how many more problems raise the bonus.
- **난이도 별 얻게 될 점수**: what one solve of each level adds, for the ten levels above the lowest problem in your top 100. Your own tier is highlighted.
- The bars grow one after another.

The "다음 점수까지" count appears only while the bonus formula matches the value solved.ac reports.

```md
![Summary](https://ps-cards.seheon.kr/solvedac/summary/HANDLE)
```

720×200px by default; `size` sets the height from 200 to 1000.

## LeetCode

<picture>
  <source media="(prefers-color-scheme: light)" srcset="https://ps-cards.seheon.kr/leetcode/seheon99?color=light">
  <img alt="LeetCode card" src="https://ps-cards.seheon.kr/leetcode/seheon99">
</picture>

Your LeetCode solved count split by difficulty, against LeetCode's totals, with your global ranking, contest rating and share of all problems solved. Takes a LeetCode username (letters, digits, `_` and `-`).

- The ring draws Easy, Medium and Hard in turn, then the bars grow.

```md
![LeetCode](https://ps-cards.seheon.kr/leetcode/HANDLE)
```

720×200px by default, the same width as the Profile and Summary cards; `size` sets the height from 200 to 1000.

---

## Options

Every card accepts:

| Query | Effect |
| --- | --- |
| `color=dark` / `color=light` | Colour scheme; `dark` by default |
| `size={int}` | Card height in px, within the card's range; the width scales with it |

To follow the reader's GitHub theme, wrap a card in `<picture>` as the previews above do:

```html
<picture>
  <source media="(prefers-color-scheme: light)" srcset="https://ps-cards.seheon.kr/solvedac/profile/HANDLE?color=light">
  <img alt="solved.ac profile" src="https://ps-cards.seheon.kr/solvedac/profile/HANDLE">
</picture>
```

Animations are skipped for readers who ask their system for reduced motion.

solved.ac handles must match `[A-Za-z0-9_]{1,64}` (LeetCode also allows `-`). Other handles get `400`; unknown handles get `404`.

## Credits

Original project by [Starcea](https://github.com/star0202) ([star0202/solvedac-cards](https://github.com/star0202/solvedac-cards)). MIT licensed; see [LICENSE](LICENSE).
