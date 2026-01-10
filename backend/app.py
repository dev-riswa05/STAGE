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
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import func

# -----------------------------
# 1. Configuration & Initialisation
# -----------------------------
load_dotenv()
app = Flask(__name__)

CORS(app, origins=["http://localhost:5173", "http://localhost:5174"])

# -----------------------------
# MAIL CONFIG
# -----------------------------
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USER')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASS')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USER')

# -----------------------------
# DATABASE CONFIG
# -----------------------------
DATA_DIR = 'data'
os.makedirs(DATA_DIR, exist_ok=True)

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, DATA_DIR, 'simplon_hub.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
mail = Mail(app)

# -----------------------------
# FILE STORAGE (PERSISTANT)
# -----------------------------
UPLOAD_ARCHIVES = 'uploads/archives'
UPLOAD_IMAGES = 'uploads/images'
os.makedirs(UPLOAD_ARCHIVES, exist_ok=True)
os.makedirs(UPLOAD_IMAGES, exist_ok=True)

# -----------------------------
# 2. MODELS
# -----------------------------
class User(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    matricule = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    pseudo = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
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

# Table pour les activités/logs
class Activity(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36))
    user_name = db.Column(db.String(100))
    action = db.Column(db.String(200))
    details = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# Table pour suivre les téléchargements
class Download(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), nullable=False)
    project_id = db.Column(db.String(36), nullable=False)
    downloaded_at = db.Column(db.DateTime, default=datetime.utcnow)

with app.app_context():
    db.create_all()

# -----------------------------
# TEMP CODES (RAM)
# -----------------------------
temp_codes = {}

# -----------------------------
# 3. AUTH & ACTIVATION
# -----------------------------
@app.route('/send-code', methods=['POST'])
def send_code():
    data = request.json
    email = data.get('email', '').lower().strip()
    matricule = data.get('matricule', '').upper().strip()

    if not email or not matricule:
        return jsonify({"error": "Email et Matricule requis"}), 400

    # Validation du format du matricule
    if not (matricule.startswith("AD-") or matricule.startswith("MAT-")):
        return jsonify({"error": "Format de matricule invalide. Utilisez AD-xxx ou MAT-xxx"}), 400

    # Validation de la partie numérique
    try:
        prefix, number = matricule.split('-')
        if not number.isdigit():
            return jsonify({"error": "La partie après le tiret doit être numérique"}), 400
    except ValueError:
        return jsonify({"error": "Format de matricule invalide. Utilisez AD-xxx ou MAT-xxx"}), 400

    code = str(random.randint(100000, 999999))
    temp_codes[email] = {"code": code, "matricule": matricule}

    msg = Message("Code d'activation - Simplon Code Hub", recipients=[email])
    msg.body = f"Votre code d'activation est : {code}"
    mail.send(msg)

    return jsonify({"message": "Code envoyé"}), 200


@app.route('/verify-code', methods=['POST'])
def verify_code():
    data = request.json
    email = data.get('email', '').lower().strip()
    code = str(data.get('code', '')).strip()

    if email in temp_codes and temp_codes[email]['code'] == code:
        return jsonify({"status": "success"}), 200

    return jsonify({"error": "Code invalide"}), 400


@app.route('/api/activation', methods=['POST'])
def final_activation():
    data = request.json
    email = data.get('email').lower().strip()
    matricule = data.get('matricule').upper().strip()
    pseudo = data.get('pseudo').strip()
    password = data.get('password')

    # Validation supplémentaire
    if not (matricule.startswith("AD-") or matricule.startswith("MAT-")):
        return jsonify({"error": "Format de matricule invalide"}), 400

    if User.query.filter((User.email == email) | (User.matricule == matricule)).first():
        return jsonify({"error": "Email ou matricule déjà utilisé"}), 400

    # Déterminer le rôle selon le format du matricule
    if matricule.startswith("AD-"):
        role = "admin"
    elif matricule.startswith("MAT-"):
        role = "stagiaire"
    else:
        role = "stagiaire"  # Par défaut

    new_user = User(
        email=email,
        matricule=matricule,
        pseudo=pseudo,
        password=generate_password_hash(password),
        role=role
    )
    db.session.add(new_user)
    db.session.commit()

    # Créer une activité log
    activity = Activity(
        user_id=new_user.id,
        user_name=new_user.pseudo,
        action="Inscription",
        details=f"Nouvel utilisateur inscrit: {pseudo} ({matricule})"
    )
    db.session.add(activity)
    db.session.commit()

    temp_codes.pop(email, None)
    return jsonify({"message": "Compte créé", "role": role}), 201


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    identifier = data.get("identifier", "").strip()
    password = data.get("password", "").strip()

    if not identifier or not password:
        return jsonify({"error": "Identifiant et mot de passe requis"}), 400

    # Recherche insensible à la casse par email ou pseudo
    user = User.query.filter(
        (func.lower(User.email) == func.lower(identifier)) | 
        (func.lower(User.pseudo) == func.lower(identifier))
    ).first()

    # Vérification utilisateur + mot de passe
    if not user or not check_password_hash(user.password, password):
        return jsonify({"error": "Identifiants incorrects"}), 401

    # Redirection selon le matricule
    if user.matricule.startswith("AD-"):
        redirect_to = "/admin-dashboard"
    elif user.matricule.startswith("MAT-"):
        redirect_to = "/dashboard"
    else:
        # Fallback selon le rôle
        redirect_to = "/admin-dashboard" if user.role == "admin" else "/dashboard"

    # Créer une activité log pour la connexion
    activity = Activity(
        user_id=user.id,
        user_name=user.pseudo,
        action="Connexion",
        details=f"Connexion réussie depuis l'adresse {request.remote_addr}"
    )
    db.session.add(activity)
    db.session.commit()

    return jsonify({
        "message": "Connexion réussie",
        "user": {
            "id": user.id,
            "pseudo": user.pseudo,
            "email": user.email,
            "matricule": user.matricule,
            "role": user.role
        },
        "redirectTo": redirect_to
    }), 200


# -----------------------------
# USER PROFILE UPDATE
# -----------------------------
@app.route('/api/users/<user_id>', methods=['PATCH'])
def update_user(user_id):
    data = request.json
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Utilisateur non trouvé"}), 404
    
    # Mettre à jour les champs autorisés
    if 'pseudo' in data:
        # Vérifier que le pseudo n'est pas déjà utilisé par un autre utilisateur
        existing_user = User.query.filter(
            User.pseudo == data['pseudo'],
            User.id != user_id
        ).first()
        if existing_user:
            return jsonify({"error": "Ce pseudo est déjà utilisé"}), 400
        user.pseudo = data['pseudo']
    
    if 'password' in data and data['password']:
        user.password = generate_password_hash(data['password'])
    
    db.session.commit()
    
    # Créer une activité log
    activity = Activity(
        user_id=user.id,
        user_name=user.pseudo,
        action="Mise à jour profil",
        details=f"Profil mis à jour par {user.pseudo}"
    )
    db.session.add(activity)
    db.session.commit()
    
    return jsonify({
        "message": "Profil mis à jour",
        "user": {
            "id": user.id,
            "pseudo": user.pseudo,
            "email": user.email,
            "matricule": user.matricule,
            "role": user.role
        }
    }), 200


# -----------------------------
# 4. PROJECTS
# -----------------------------
@app.route('/api/projects', methods=['GET', 'POST'])
def projects():
    if request.method == 'GET':
        projects = Project.query.order_by(Project.dateCreation.desc()).all()
        return jsonify([
            {
                "id": p.id,
                "titre": p.titre,
                "description": p.description,
                "technologies": p.technologies,
                "categorie": p.categorie,
                "auteurId": p.auteurId,
                "auteurNom": p.auteurNom,
                "dateCreation": p.dateCreation.isoformat() if p.dateCreation else None,
                "taille": p.taille,
                "filePath": p.filePath
            } for p in projects
        ])

    # POST un nouveau projet
    file = request.files.get('file')
    file_path = None
    size = "0 MB"

    if file:
        filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
        file_path = os.path.join(UPLOAD_ARCHIVES, filename)
        file.save(file_path)
        size = f"{os.path.getsize(file_path) / (1024 * 1024):.2f} MB"

    project = Project(
        titre=request.form.get('titre'),
        description=request.form.get('description'),
        auteurId=request.form.get('auteurId'),
        auteurNom=request.form.get('auteurNom'),
        technologies=request.form.getlist('technologies'),
        categorie=request.form.get('categorie'),
        taille=size,
        filePath=file_path
    )

    db.session.add(project)
    db.session.commit()

    # Log de l'activité
    if project.auteurId:
        user = User.query.get(project.auteurId)
        if user:
            activity = Activity(
                user_id=user.id,
                user_name=user.pseudo,
                action="Nouveau projet",
                details=f"Projet créé: {project.titre}"
            )
            db.session.add(activity)
            db.session.commit()

    return jsonify({"message": "Projet enregistré", "projectId": project.id}), 201


# -----------------------------
# USER PROJECTS
# -----------------------------
@app.route('/api/projects/user/<user_id>', methods=['GET'])
def get_user_projects(user_id):
    projects = Project.query.filter_by(auteurId=user_id).order_by(Project.dateCreation.desc()).all()
    return jsonify([{
        "id": p.id,
        "titre": p.titre,
        "description": p.description,
        "categorie": p.categorie,
        "dateCreation": p.dateCreation.isoformat() if p.dateCreation else None,
        "technologies": p.technologies,
        "taille": p.taille
    } for p in projects])


# -----------------------------
# DOWNLOAD ROUTES
# -----------------------------
@app.route('/api/download-file/<project_id>')
def download_file(project_id):
    project = Project.query.get_or_404(project_id)
    if project.filePath and os.path.exists(project.filePath):
        # Récupérer l'utilisateur connecté s'il existe
        user_id = request.args.get('user_id')
        if user_id:
            # Enregistrer le téléchargement dans la base de données
            download = Download(
                user_id=user_id,
                project_id=project_id
            )
            db.session.add(download)
        
        # Log de l'activité
        activity = Activity(
            user_id=user_id or "anonymous",
            user_name=user_id or "Anonymous",
            action="Téléchargement",
            details=f"Fichier téléchargé: {os.path.basename(project.filePath)}"
        )
        db.session.add(activity)
        db.session.commit()
        
        # Téléchargement automatique (pas de confirmation)
        response = send_from_directory(
            os.path.dirname(project.filePath),
            os.path.basename(project.filePath),
            as_attachment=True,
            mimetype='application/octet-stream'
        )
        
        # Forcer le téléchargement sans demande de confirmation
        response.headers["Content-Disposition"] = f'attachment; filename="{os.path.basename(project.filePath)}"'
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        return response
    return jsonify({"error": "Fichier introuvable"}), 404


@app.route('/api/my-downloads/<user_id>', methods=['GET'])
def get_user_downloads(user_id):
    """Récupère les projets téléchargés par un utilisateur"""
    # Récupérer les téléchargements de l'utilisateur
    downloads = Download.query.filter_by(user_id=user_id)\
        .order_by(Download.downloaded_at.desc())\
        .all()
    
    result = []
    for download in downloads:
        project = Project.query.get(download.project_id)
        if project:
            # Récupérer les informations de l'auteur
            auteur = None
            if project.auteurId:
                auteur = User.query.get(project.auteurId)
            
            result.append({
                "id": project.id,
                "titre": project.titre,
                "description": project.description,
                "taille": project.taille,
                "dateCreation": project.dateCreation.isoformat() if project.dateCreation else None,
                "downloadDate": download.downloaded_at.isoformat() if download.downloaded_at else None,
                "categorie": project.categorie,
                "technologies": project.technologies,
                "auteurNom": auteur.pseudo if auteur else project.auteurNom or "Anonyme",
                "auteurId": project.auteurId
            })
    
    return jsonify(result)


# -----------------------------
# ADMIN ROUTES
# -----------------------------
@app.route('/api/admin/activities', methods=['GET'])
def get_recent_activities():
    activities = Activity.query.order_by(Activity.timestamp.desc()).limit(50).all()
    return jsonify([{
        "id": a.id,
        "user_id": a.user_id,
        "user_name": a.user_name,
        "action": a.action,
        "details": a.details,
        "timestamp": a.timestamp.isoformat() if a.timestamp else None,
        "time": a.timestamp.strftime("%H:%M") if a.timestamp else ""
    } for a in activities])


@app.route('/api/admin/activity/<activity_id>', methods=['DELETE'])
def delete_activity(activity_id):
    """Supprime une activité spécifique"""
    activity = Activity.query.get(activity_id)
    if activity:
        db.session.delete(activity)
        db.session.commit()
        return jsonify({"message": "Activité supprimée"}), 200
    return jsonify({"error": "Activité non trouvée"}), 404


@app.route('/api/admin/activities', methods=['DELETE'])
def clear_all_activities():
    """Supprime toutes les activités"""
    Activity.query.delete()
    db.session.commit()
    return jsonify({"message": "Toutes les activités ont été supprimées"}), 200


@app.route('/api/admin/users', methods=['GET'])
def get_all_users():
    users = User.query.all()
    return jsonify([{
        "id": u.id,
        "matricule": u.matricule,
        "email": u.email,
        "pseudo": u.pseudo,
        "role": u.role,
        "dateInscription": u.dateInscription.isoformat() if u.dateInscription else None
    } for u in users])


@app.route('/api/admin/projects', methods=['GET'])
def admin_projects():
    projects = Project.query.all()
    return jsonify([{
        "id": p.id,
        "titre": p.titre,
        "auteur": p.auteurNom,
        "dateCreation": p.dateCreation.isoformat() if p.dateCreation else None,
        "categorie": p.categorie
    } for p in projects])


@app.route('/api/admin/project/<project_id>', methods=['DELETE'])
def delete_project(project_id):
    project = Project.query.get_or_404(project_id)
    if project.filePath and os.path.exists(project.filePath):
        os.remove(project.filePath)
    
    # Supprimer aussi les téléchargements associés
    Download.query.filter_by(project_id=project_id).delete()
    
    # Log de l'activité
    activity = Activity(
        user_id="system",
        user_name="Administrateur",
        action="Suppression projet",
        details=f"Projet supprimé: {project.titre}"
    )
    db.session.add(activity)
    
    db.session.delete(project)
    db.session.commit()
    return jsonify({"message": "Projet supprimé"}), 200


# -----------------------------
# SEARCH & FILTER
# -----------------------------
@app.route('/api/projects/search')
def search_projects():
    q = request.args.get('q', '')
    tech = request.args.get('tech')

    query = Project.query

    if q:
        query = query.filter(Project.titre.ilike(f"%{q}%"))

    if tech:
        query = query.filter(Project.technologies.contains([tech]))

    results = query.all()
    return jsonify([{
        "id": p.id,
        "titre": p.titre,
        "technologies": p.technologies,
        "auteurNom": p.auteurNom,
        "categorie": p.categorie
    } for p in results])


# -----------------------------
# USER PROFILE
# -----------------------------
@app.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "User ID requis"}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Utilisateur non trouvé"}), 404
    
    # Compter les projets de l'utilisateur
    project_count = Project.query.filter_by(auteurId=user_id).count()
    
    # Compter les téléchargements de l'utilisateur
    download_count = Download.query.filter_by(user_id=user_id).count()
    
    return jsonify({
        "id": user.id,
        "matricule": user.matricule,
        "email": user.email,
        "pseudo": user.pseudo,
        "role": user.role,
        "dateInscription": user.dateInscription.isoformat() if user.dateInscription else None,
        "projectCount": project_count,
        "downloadCount": download_count
    }), 200


# -----------------------------
# RECORD DOWNLOAD
# -----------------------------
@app.route('/api/record-download', methods=['POST'])
def record_download():
    """Enregistre un téléchargement dans la base de données"""
    data = request.json
    
    user_id = data.get('user_id')
    project_id = data.get('project_id')
    
    if not user_id or not project_id:
        return jsonify({"error": "Données manquantes"}), 400
    
    # Vérifier si le projet existe
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Projet non trouvé"}), 404
    
    # Créer l'entrée de téléchargement
    download = Download(
        user_id=user_id,
        project_id=project_id
    )
    
    db.session.add(download)
    db.session.commit()
    
    return jsonify({
        "message": "Téléchargement enregistré",
        "download": {
            "id": download.id,
            "user_id": download.user_id,
            "project_id": download.project_id,
            "downloaded_at": download.downloaded_at.isoformat()
        }
    }), 201


# -----------------------------
# HEALTH CHECK
# -----------------------------
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected",
        "users_count": User.query.count(),
        "projects_count": Project.query.count(),
        "downloads_count": Download.query.count(),
        "activities_count": Activity.query.count()
    }), 200


# -----------------------------
# START
# -----------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5001)  # Changez 5000 à 5001 ou autre