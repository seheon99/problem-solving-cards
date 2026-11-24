# solvedac-cards

Generates solved.ac cards

Fork of [star0202/solvedac-cards](https://github.com/star0202/solvedac-cards), ported to the [solved.ac API v4](https://backstage.solved.ac/developer/docs) after v3 went behind a Cloudflare challenge.

Differences from upstream:

- `/problems` shows solved counts per level only; v4 has no tried/partial counts.
- `/tags` default tags use v4 keys: `math`, `impl`, `greedy`, `string`, `ds`, `graph`, `dp`, `geom`.
- `/profile` draws a tier-colored placeholder when the profile image can't be fetched.
- Handles must match `[A-Za-z0-9_]{1,64}`; anything else returns `400`.
- solved.ac responses are cached in memory for 10 minutes.

## Usage

Base URL: `https://solvedac-cards.seheon.kr/`

- `/profile/:handle`

  Show solved.ac profile

  - `?size={int}`
    - Set card's height (default: 100px, valid range: 100px ~ 500px)
  - `?color={dark|light}`
    - Set card's color scheme (default: `dark`, valid value: `light`, `dark`)

![Example (starcea)](https://solvedac-cards.seheon.kr/profile/starcea)
![Example (koosaga)](https://solvedac-cards.seheon.kr/profile/koosaga?color=light)

- `/problems/:handle`

  Show tier distribution of solved problems

  - `?size={int}`
    - Set card's height (default: 200px, valid range: 200px ~ 1000px)
  - `?color={dark|light}`
    - Set card's color scheme (default: `dark`, valid value: `light`, `dark`)

![Example (starcea)](https://solvedac-cards.seheon.kr/problems/starcea)
![Example (koosaga)](https://solvedac-cards.seheon.kr/problems/koosaga?color=light)

- `/tags/:handle`

  Show tag tier graph

  - `?size={int}`
    - Set card's height (default: 200px, valid range: 200px ~ 1000px)
  - `?color={dark|light}`
    - Set card's color scheme (default: `dark`, valid value: `light`, `dark`)
  - `?top={boolean}`
    - Show top 8 tags instead of default tags (default: `false`, valid value: `true`, `false`)
  - `?text={boolean}`
    - Show tag name on the graph (default: `false`, valid value: `true`, `false`)

![Example (starcea)](https://solvedac-cards.seheon.kr/tags/starcea)
![Example (koosaga)](https://solvedac-cards.seheon.kr/tags/koosaga?color=light)
![Example (starcea, top)](https://solvedac-cards.seheon.kr/tags/starcea?top=true)
![Example (koosaga, text)](https://solvedac-cards.seheon.kr/tags/koosaga?color=light&text=true)

## Self-hosting

Register an app at [solved.ac Backstage](https://backstage.solved.ac/developer/apps), then:

```sh
docker build -t solvedac-cards .
docker run -p 8000:8000 \
  -e SOLVEDAC_CLIENT_ID=... \
  -e SOLVEDAC_CLIENT_SECRET=... \
  solvedac-cards
```

The server exits at startup if either variable is missing. Each `/problems` card costs 31 API requests and `/tags` or `/profile` one each, against solved.ac's rate limit of 600 units refilled at 2 per second.

Pushes to `main` build, sign and deploy the image through [seheon99/build-and-deploy](https://github.com/seheon99/build-and-deploy) (`.github/workflows/releaser.yml`).

## Special Thanks

[@pikokr](https://github.com/pikokr) - Server & Domain
