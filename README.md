# VidSeek

video search engine that runs **completely in your browser**. you drop a video in, it
"watches" it (scans the frames + transcribes the speech with whisper) and builds an
index, then you ask it stuff in the chat like *"where does she say hello?"* and it
jumps to that exact timestamp.

no server, no api keys, nothing gets uploaded — the file never leaves your machine.

## features

- **speech search** — whisper transcribes everything with timestamps so you can search
  what was actually SAID, not just what's on screen
- **visual search** — CLIP embeds frames so scene questions like "find a city at night"
  work too
- **chat → timestamp** — results come back as clickable time cards, click one and the
  player seeks there
- runs on **WebGPU** if you have it, falls back to WASM otherwise. models get cached by
  the browser after the first download
- no signup, no rate limits, its all client side

## design

went for a **dark neo-brutalist** look — thick borders, hard offset shadows, acid green,
no gradients or blur. its all **tailwind css v4**, i just added a few utility classes in
`app/globals.css` (`.brute`, `.btn-brute`, `.hatch` etc). no UI kit or component
library, everything is hand written.

## tech

- next.js 16 + typescript (app router)
- tailwind css v4 for the design
- zustand for state
- `@huggingface/transformers` to run the models right in the browser:
  - **whisper-tiny** → speech to text with timestamps
  - **clip-vit-base-patch32** → frames to vectors
  - **all-MiniLM-L6-v2** (default) or **EmbeddingGemma 2** (settings) → text vectors

## running it

```bash
npm install
npm run dev
```

open http://localhost:3000, go to the studio and drop a video. the first scan downloads
the models (a few hundred mb, depends which text model you pick) and after that they
are cached so it doesn't download again.

## how it works (short version)

1. the file becomes an object url, it never gets uploaded anywhere
2. audio track gets decoded → whisper transcribes it → text lines with timestamps
3. a frame every couple seconds gets embedded with CLIP's vision tower
4. transcript lines get embedded with the text model
5. your question gets embedded into both spaces, cosine similarity, top hits become the
   clickable timestamp cards

## stuff that doesn't work yet

- it can't tell you WHO said something (no speaker diarization), only what + when
- videos longer than ~1 hour are slow without WebGPU
- the index lives in memory so if you reload the tab you have to rescan
- i'd like to try embeddinggemma's audio encoder for "find a part that sounds like
  this" but whisper already gives the actual words so idk

