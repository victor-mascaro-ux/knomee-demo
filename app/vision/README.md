# Vision board photos

The client's vision-board imagery, served straight from `public/` (Vite copies it
verbatim into `app/`), so a new file needs no build step — drop it in and
refresh. A tile whose file is missing renders as a labelled tinted placeholder,
so the layout is always correct.

Filenames are slugs; the board maps them in `src/data/clientProfile.ts`.

| Board | Files |
|---|---|
| Coastal Life Dreams | `dream-beach-house.png`, `family-gatherings.png`, `sunset-walks.png`, `coastal-interior.png`, `peaceful-mornings.png` |
| Wellness Journey | `morning-yoga-ritual.png`, `mindful-moments.png`, `nourishing-meals.png`, `strength-balance.png`, `peaceful-sanctuary.png` |

To add one: drop the file here with a lowercase-hyphenated name and add a tile to
the matching board in `src/data/clientProfile.ts`.

Anything here is public on the deployed demo — use imagery the client is happy to
have on a shared link, not personal photographs.
