import os
from flask import Flask, request, jsonify, send_file
from generate_pitch import (
    generate_content_with_claude,
    build_presentation,
    get_pexels_image
)
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
    return "Fynoy Slides API is running!", 200

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "OK"}), 200

@app.route('/generate', methods=['POST'])
def generate():
    raw_json = request.json
    if not raw_json:
        return jsonify({"status": "error", "message": "No JSON body provided."}), 400

    try:
        # Step 1: Generate structured content with Claude
        sc = generate_content_with_claude(raw_json)
        company = sc.get("company_name", "")
        sector = sc.get("sector", "")
        pkey = os.environ.get("PEXELS_API_KEY")

        # Extract protected valuation metrics from input early
        protected_val = {}
        raw_fields = raw_json.get("fields", raw_json)
        for key, canon in [("P/E", "pe"), ("PE", "pe"), ("pe", "pe"), ("p_e", "pe"),
                           ("Forward P/E", "fwd_pe"), ("forward_pe", "fwd_pe"), ("fwd_pe", "fwd_pe"),
                           ("EV/EBITDA", "ev_ebitda"), ("ev_ebitda", "ev_ebitda")]:
            v = raw_fields.get(key)
            if v and canon not in protected_val:
                protected_val[canon] = str(v)
        sc["_protected_valuation"] = protected_val

        # Step 2: Fetch images from Pexels
        imgs = {}
        q_cover = f"{company} {sector} corporate header"
        imgs["cover"] = get_pexels_image(q_cover, pkey, orientation="landscape") if pkey else None

        q_overview = f"{company} {sector} corporate business operations"
        imgs["overview"] = get_pexels_image(q_overview, pkey, orientation="portrait") if pkey else None

        # Step 3: Build presentation
        fn = build_presentation(sc, imgs)

        return send_file(
            fn,
            as_attachment=True,
            download_name=fn,
            mimetype='application/vnd.openxmlformats-officedocument.presentationml.presentation'
        )

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
