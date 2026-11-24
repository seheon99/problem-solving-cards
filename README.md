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
| `/tags/:handle` | Rating per tag as a radar chart | 200px | 200–1000px |
| `/problems/:handle` | Solved problems per level as a donut chart | 200px | 200–1000px |

### Options

| Query | Cards | Effect |
| --- | --- | --- |
| `size={int}` | all | Card height in px, within the range above |
| `color=dark` / `color=light` | all | Color scheme; `dark` by default |
| `top=true` | `/tags` | Show your 8 highest-rated tags instead of the default 8 |
| `text=true` | `/tags` | Label each tag on the chart |

`top` and `text` turn on whenever they're present, whatever their value, so leave them out to turn them off.

The default tags are `math`, `impl`, `greedy`, `string`, `ds`, `graph`, `dp` and `geom`.

Handles must match `[A-Za-z0-9_]{1,64}`. Other handles get `400`; unknown handles get `404`.

## Self-hosting

1. Register an app at [solved.ac Backstage](https://backstage.solved.ac/developer/apps) to get a client ID and secret.
2. Build and run the image:

   ```sh
   docker build -t solvedac-cards .
   docker run -p 8000:8000 \
     -e SOLVEDAC_CLIENT_ID=... \
     -e SOLVEDAC_CLIENT_SECRET=... \
     solvedac-cards
   ```

   The server stops at startup if either variable is missing.

For development, `pnpm install` then `pnpm dev` with the same two variables set.

### Rate limits

solved.ac gives each caller 600 request units, refilled at 2 per second.

| Card | Requests |
| --- | --- |
| `/profile`, `/tags` | 1 |
| `/problems` | 32: one profile lookup, then one search per level (0–30) |

Responses are cached in memory for 10 minutes, so repeat views cost nothing. If many different handles are rendered at once, a card can fail with `500` until the budget refills.

### Deployment

Pushes to `main` build, sign and deploy the image with [seheon99/build-and-deploy](https://github.com/seheon99/build-and-deploy) (see `.github/workflows/releaser.yml`). Pull requests run the same build without deploying.

## Differences from upstream

This is a fork of [star0202/solvedac-cards](https://github.com/star0202/solvedac-cards), ported to the [solved.ac API v4](https://backstage.solved.ac/developer/docs) because v3 now sits behind a Cloudflare challenge.

- `/problems` counts solved problems only. v4 has no tried or partial counts.
- `/tags` uses v4 tag keys (`impl` rather than `implementation`).
- `/profile` shows one `+` for any class plus; v4 doesn't tell silver from gold.
- `/profile` draws a tier-colored square when the profile picture can't be fetched. `static.solved.ac` blocks most servers.

## Credits

Original project by [Starcea](https://github.com/star0202), with the server and domain provided by [@pikokr](https://github.com/pikokr). MIT licensed; see [LICENSE](LICENSE).
