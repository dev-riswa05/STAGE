import os
import uuid
import random
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_mail import Mail, Message
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

# -----------------------------
# 1. Configuration & Initialisation
# -----------------------------
load_dotenv()
app = Flask(__name__)

# Autorisation des ports React (Vite)
CORS(app, origins=["http://localhost:5173", "http://localhost:5174"])

# Configuration SMTP Gmail
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USER')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASS')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USER')

# Configuration SQLITE
DATA_DIR = 'data'
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, DATA_DIR, 'simplon_hub.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
mail = Mail(app)

# Structure des dossiers pour les fichiers
UPLOAD_ARCHIVES = 'uploads/archives'
UPLOAD_IMAGES = 'uploads/images'
for folder in [UPLOAD_ARCHIVES, UPLOAD_IMAGES]:
    os.makedirs(folder, exist_ok=True)

# -----------------------------
# 2. MODELES DE DONNEES
# -----------------------------

class User(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    matricule = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    pseudo = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), default="stagiaire")
    dateInscription = db.Column(db.DateTime, default=datetime.utcnow)

class Project(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    titre = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    technologies = db.Column(db.JSON) 
    categorie = db.Column(db.String(50))
    auteurId = db.Column(db.String(36))
    auteurNom = db.Column(db.String(100))
    dateCreation = db.Column(db.DateTime, default=datetime.utcnow)
    taille = db.Column(db.String(20))
    images = db.Column(db.JSON)      
    filePath = db.Column(db.String(255))

with app.app_context():
    db.create_all()

temp_codes = {}

# -----------------------------
# 3. ROUTES AUTH & ACTIVATION
# -----------------------------

@app.route('/send-code', methods=['POST'])
def send_code():
    data = request.json
    email = data.get('email', '').lower().strip()
    matricule = data.get('matricule', '').upper().strip()
    code = str(random.randint(100000, 999999))
    temp_codes[email] = {"code": code, "matricule": matricule}
    try:
        msg = Message("Code d'activation - Simplon Code Hub", recipients=[email])
        msg.body = f"Votre code d'activation est : {code}"
        mail.send(msg)
        return jsonify({"message": "Code envoyé"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/verify-code', methods=['POST'])
def verify_code():
    data = request.json
    email = data.get('email', '').lower().strip()
    code_saisi = str(data.get('code', '')).strip()
    if email in temp_codes and temp_codes[email]['code'] == code_saisi:
        return jsonify({"message": "Code vérifié"}), 200
    return jsonify({"error": "Code incorrect"}), 400

@app.route('/api/activation', methods=['POST'])
def final_activation():
    data = request.json
    role = "admin" if data.get('matricule', '').upper().startswith("AD-") else "stagiaire"
    new_user = User(
        matricule=data.get('matricule', '').upper(),
        email=data.get('email', '').lower(),
        pseudo=data.get('pseudo'),
        password=data.get('password'),
        role=role
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "Compte créé", "role": role}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    idnt = data.get("identifier", "").lower().strip()
    pwd = data.get("password", "").strip()
    user = User.query.filter(((User.pseudo == idnt) | (User.email == idnt)) & (User.password == pwd)).first()
    if not user:
        return jsonify({"error": "Identifiants incorrects"}), 401
    return jsonify({
        "user": {
            "id": user.id, 
            "pseudo": user.pseudo, 
            "role": user.role, 
            "email": user.email,
            "matricule": user.matricule
        }
    })

# -----------------------------
# 4. GESTION DES PROJETS
# -----------------------------

@app.route('/api/projects', methods=['GET', 'POST'])
def handle_projects():
    if request.method == 'GET':
        projects = Project.query.order_by(Project.dateCreation.desc()).all()
        return jsonify({'projects': [{
            "id": p.id, "titre": p.titre, "description": p.description,
            "technologies": p.technologies, "auteurNom": p.auteurNom,
            "dateCreation": p.dateCreation.isoformat(), "taille": p.taille, "images": p.images
        } for p in projects]})

    if request.method == 'POST':
        file_obj = request.files.get('file')
        file_path, file_size = None, "0 MB"
        if file_obj:
            fname = f"{uuid.uuid4()}_{secure_filename(file_obj.filename)}"
            file_path = os.path.join(UPLOAD_ARCHIVES, fname)
            file_obj.save(file_path)
            file_size = f"{(os.path.getsize(file_path) / (1024*1024)):.1f} MB"

        new_p = Project(
            titre=request.form.get('titre'),
            description=request.form.get('description'),
            auteurId=request.form.get('auteurId'),
            auteurNom=request.form.get('auteurNom'),
            technologies=request.form.getlist('technologies'),
            categorie=request.form.get('categorie'),
            taille=file_size,
            filePath=file_path
        )
        db.session.add(new_p)
        db.session.commit()
        return jsonify({"message": "Projet créé"}), 201

# --- ROUTES AJOUTÉES POUR RÉSOUDRE LES 404 ---

@app.route('/api/my-downloads/<user_id>', methods=['GET'])
def get_my_downloads(user_id):
    projects = Project.query.filter_by(auteurId=user_id).all()
    return jsonify({'projects': [{
        "id": p.id, "titre": p.titre, "taille": p.taille, 
        "dateCreation": p.dateCreation.isoformat(), "technologies": p.technologies
    } for p in projects]})

@app.route('/api/download-file/<project_id>', methods=['GET'])
def download_file(project_id):
    project = Project.query.get_or_404(project_id)
    if project.filePath and os.path.exists(project.filePath):
        return send_from_directory(
            os.path.dirname(project.filePath), 
            os.path.basename(project.filePath), 
            as_attachment=True
        )
    return jsonify({"error": "Fichier introuvable"}), 404

@app.route('/api/uploads/images/<filename>')
def serve_image(filename):
    return send_from_directory(UPLOAD_IMAGES, filename)

if __name__ == "__main__":
    app.run(debug=True, port=5000)