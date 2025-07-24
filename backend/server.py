from flask import Flask, request, jsonify
import csv, time

app = Flask(__name__)
LOG = "votes.csv"

@app.post("/vote")
def vote():
    data = request.json
    with open(LOG, "a", newline="") as f:
        csv.writer(f).writerow(
            [time.time(), data["image_id"], data["choice"]]
        )
    return jsonify(ok=True)

if __name__ == "__main__":
    app.run(debug=True)


