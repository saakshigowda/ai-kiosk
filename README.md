# FaceOrFake

An interactive kiosk experiment that measures how well participants can tell **real
photographs of faces apart from AI‑generated ones** — and whether a short training
phase improves that ability.

Participants work through three phases (a baseline test, a training round with
feedback, and a final test). Each trial shows two faces side by side; the participant
picks the one they believe is real. Choices, response times, and corrections are
logged to CSV for later analysis. The kiosk can be driven either with on‑screen
buttons or with **hand gestures via the webcam** (powered by MediaPipe).

---

## Architecture

| Layer | Technology | Role |
|-------|-----------|------|
| **Frontend** | Vanilla HTML / CSS / JavaScript (ES modules), [MediaPipe Tasks Vision](https://developers.google.com/mediapipe) | The kiosk UI, image pairs, gesture detection. Lives in [`frontend/`](frontend/). |
| **Backend (primary)** | Node.js + [Express](https://expressjs.com/) | Serves the frontend and exposes the data‑collection API. See [`server.js`](server.js). |
| **Backend (alternative)** | Python + [Flask](https://flask.palletsprojects.com/) | Drop‑in alternative API with the same endpoints. See [`backend/app.py`](backend/app.py). |

You only need **one** backend. The Node server is the default — it serves the
frontend *and* the API from a single port. The Flask app is an equivalent option if
you prefer a Python stack (it does not serve the frontend; you host that separately).

---

## Quick Start (Node.js — recommended)

**Requirements:** Node.js 14+.

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start            # or: npm run dev   (auto-reload via nodemon)

# 3. Open the kiosk
#    → http://localhost:3000
```

The server creates a `data/` directory on first run and writes all results there.

### Alternative: Flask backend

```bash
cd backend
pip install -r requirements.txt
python app.py        # API on http://localhost:5000
```

When using Flask, serve the `frontend/` directory separately (e.g. `npx serve frontend`)
and point the frontend's API base URL at `http://localhost:5000`.

---

## Experiment Phases

| Phase | Description | Feedback | Counterbalanced |
|-------|-------------|----------|-----------------|
| **Demo** | Practice round using animal images (cats vs. dogs) to learn the controls | — | No |
| **Phase I** | Baseline assessment — real vs. AI face pairs | No | Yes (Set A / B) |
| **Phase II** | Training round — same task, with correct/incorrect feedback | Yes | No |
| **Phase III** | Final assessment — a fresh image set | No | Yes (Set A / B) |

**Counterbalancing:** sessions alternate between set order **A** and **B**
automatically (tracked in `data/session_counter.json`) so that image-set effects are
balanced across participants.

### Image sets

Images live under [`frontend/assets/`](frontend/assets/):

- `faces/` — primary real/AI face pairs (Set A)
- `SetB/` — alternate face set (Set B)
- `Training/` — images used in the Phase II training round
- `animals/` — cat/dog images for the demo

---

## Controls

- **Buttons / touch** — tap the left or right image, then confirm.
- **Hand gestures (webcam)** — move a raised hand left/right to select a side, then
  a **thumbs‑up** to confirm. Tunable thresholds (cooldown, position, raise height)
  live in [`frontend/js/webcam.js`](frontend/js/webcam.js). If no webcam is available
  the kiosk silently falls back to button control.

---

## Data Output

Results are written as CSV to the `data/` directory (created automatically):

| File | Contents |
|------|----------|
| `phase1_results.csv` | Phase I trials (includes `set_order`) |
| `phase2_results.csv` | Phase II training trials |
| `phase3_results.csv` | Phase III trials (includes `set_order`) |
| `demo_results.csv` | Demo trials |
| `summary_results.csv` | Per‑participant improvement summary (Phase I → III) |
| `undo_events.csv` | One row per time a participant reversed a choice before confirming |
| `participants/<id>.csv` | All phases for a single participant in one file |

The Node server is resilient to a CSV being open in Excel/locked by OneDrive: rows
that can't be written are queued to a `.pending` sidecar and flushed back
automatically once the file is writable.

### API endpoints

Both backends expose the same core API:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/start-session` | Start a session, get a user ID + set order |
| `POST` | `/api/save-trial` | Save one trial |
| `POST` | `/api/save-undo` | Log a reversed selection *(Node only)* |
| `POST` | `/api/save-summary` | Save the Phase I→III improvement summary *(Node only)* |
| `POST` | `/api/save-session` | Batch‑save a session |
| `GET`  | `/api/stats` | Trial counts per phase |
| `GET`  | `/api/download/:mode` | Download a CSV (`phase1`, `phase3`, `summary`, `undo`, …) |
| `GET`  | `/api/health` | Health check |

---

## Project Structure

```
ai-kiosk/
├── server.js              # Node/Express backend (primary)
├── package.json
├── backend/
│   ├── app.py             # Flask backend (alternative)
│   └── requirements.txt
├── frontend/
│   ├── index.html         # Kiosk UI
│   ├── js/                # Game logic, webcam/gesture, API client, results
│   ├── css/
│   └── assets/            # faces/, SetB/, Training/, animals/
└── data/                  # Generated CSV results (git-ignored)
```

---

## Development

```bash
npm run dev    # Node server with auto-reload (nodemon)
```

Collected participant data under `data/` is git‑ignored by default — keep research
data out of version control and back it up separately.
