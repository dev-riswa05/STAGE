import os
import json
import secrets
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText

load_dotenv()

app = Flask(__name__)
CORS(app)

# -----------------------
# FICHIERS JSON
# -----------------------
USERS_FILE = "data/users.json"
CODES_FILE = "data/codes.json"
PROJECTS_FILE = "data/projects.json"
ACTIVITIES_FILE = "data/activities.json"

os.makedirs("data", exist_ok=True)

# -----------------------
# FONCTIONS UTILITAIRES
# -----------------------
def read_json(path):
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except:
            return []

def write_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

# -----------------------
# ENVOI D'EMAIL (GMAIL SMTP)
# -----------------------
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASS = os.getenv("SMTP_PASS")

def send_activation_email(email, code):
    try:
        msg = MIMEText(f"Votre code d'activation est : {code}")
        msg["Subject"] = "Code d'activation Simplon Code Hub"
        msg["From"] = SMTP_EMAIL
        msg["To"] = email

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(SMTP_EMAIL, SMTP_PASS)
            smtp.send_message(msg)

        print("📩 Email envoyé !")
        return True
    except Exception as e:
        print("❌ Erreur email :", e)
        return False


# =====================================================================
#                          ACTIVATION DU COMPTE
# =====================================================================

@app.route("/api/send-code", methods=["POST"])
def send_code():
    data = request.json
    matricule = data.get("matricule")
    email = data.get("email")

    if not matricule or not email:
        return jsonify({"error": "Champs manquants"}), 400

    code = secrets.randbelow(900000) + 100000

    codes = read_json(CODES_FILE)
    codes = [c for c in codes if c["email"] != email]

    codes.append({
        "email": email,
        "matricule": matricule,
        "code": str(code),
        "created_at": datetime.now().isoformat()
    })

    write_json(CODES_FILE, codes)

    if send_activation_email(email, code):
        return jsonify({"message": "Code envoyé"}), 200

    return jsonify({"error": "Impossible d'envoyer le mail"}), 500


@app.route("/api/verify-code", methods=["POST"])
def verify_code():
    data = request.json
    email = data.get("email")
    matricule = data.get("matricule")
    code = data.get("code")

    codes = read_json(CODES_FILE)
    found = next((c for c in codes if c["email"] == email and c["matricule"] == matricule), None)

    if not found:
        return jsonify({"error": "Aucun code trouvé"}), 404

    if found["code"] != code:
        return jsonify({"error": "Code incorrect"}), 400

    users = read_json(USERS_FILE)
    role = "admin" if matricule.startswith("AD-") else "apprenant"

    if not any(u["matricule"] == matricule for u in users):
        users.append({
            "matricule": matricule,
            "email": email,
            "role": role,
            "created_at": datetime.now().isoformat()
        })
        write_json(USERS_FILE, users)

    return jsonify({"message": "Compte activé", "role": role}), 200


# =====================================================================
#                                LOGIN
# =====================================================================

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    identifier = data.get("identifier")
    password = data.get("password")

    users = read_json(USERS_FILE)
    user = next((u for u in users if u["matricule"] == identifier or u["email"] == identifier), None)

    if not user:
        return jsonify({"error": "Utilisateur introuvable"}), 404

    # mot de passe non géré → accès direct (à compléter si tu veux)
    return jsonify({"message": "Connexion réussie", "role": user["role"]}), 200


# =====================================================================
#                           ROUTES DASHBOARD
# =====================================================================

@app.route('/api/projects', methods=['GET'])
def get_projects():
    try:
        return jsonify(read_json(PROJECTS_FILE))
    except:
        return jsonify({'error': 'Erreur serveur'}), 500


@app.route('/api/activities', methods=['GET'])
def get_activities():
    try:
        return jsonify(read_json(ACTIVITIES_FILE))
    except:
        return jsonify({'error': 'Erreur serveur'}), 500


# =====================================================================
#                          LANCEMENT SERVEUR
# =====================================================================

if __name__ == "__main__":
    app.run(debug=True)
