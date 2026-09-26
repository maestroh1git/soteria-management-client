# One School Day: the Soteria product film

A 60-second, 1080p60 film for proprietors. It follows one pupil's day
through every seat in the school: educator, registrar, front desk, bursar,
parent and staff. It ends on the proprietor's dashboard and **Book a demo**.

Every frame is code. The screens are rebuilt in HTML from the real app
(the same labels, flows and rules), animated by a small deterministic engine,
and rendered frame by frame in headless Chromium, then encoded with ffmpeg. The
soundtrack is synthesised in Python from the same timeline, so cuts and text
slams land on the beat (120 BPM).

## Make the film

```bash
pip install numpy scipy imageio-ffmpeg     # imageio-ffmpeg only if ffmpeg isn't installed
npm i -g playwright                        # or have it in node_modules

python3 video/music.py                     # → video/out/soundtrack.wav   (~5s)
node video/render.mjs                      # → video/out/soteria-one-school-day.mp4   (~5 min)
```

Useful while editing:

```bash
node video/render.mjs --preview            # http://localhost:4173, scrub and play with sound
node video/render.mjs --stills 9,18.5,34   # PNGs of single moments
node video/render.mjs --from 30 --to 40    # render just one scene
```

## Change it

Almost everything lives in **`film.json`**:

| To change… | Edit |
|---|---|
| Colours (brand it) | `theme`: `accent` for selections and highlighted rows, `alert` for absences and the barred adult, `cta` for the button. It is monochrome by default. |
| Words on screen | `scenes[].captions`, keeping `at` on multiples of 0.5s to stay on the beat |
| School, pupil, amounts | `story` |
| Tagline, CTA, URL | `brand`. Set `ctaUrl` to show a URL under the button. |
| Scene timing | `scenes[].start` / `end`. The soundtrack follows automatically; re-run `music.py`. |

The screens themselves are in `scenes.js` (one builder per scene), styles in
`film.css`, and the animation helpers in `engine.js`.

## Accuracy rules

The film shows only what the product does today:

- **Parents don't pay online.** Online payment is not live, so the parent
  *opens* the bill from a link and the bursar *records* the bank transfer.
  There is no "Pay now" button.
- The gate shows barred adults disabled, with the reason, as the real screen does.
- Payroll posts to the same ledger as fees.

All names, numbers and the school are fictional.
