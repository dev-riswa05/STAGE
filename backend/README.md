# 🚀 Simplon Hub Backend

Backend Flask pour la plateforme de gestion de projets **Simplon Code Hub**.

## 📋 Table des matières

- [Installation & Démarrage](#installation--démarrage)
- [Structure des données](#structure-des-données)
- [Endpoints API](#endpoints-api)
- [Exemples d'utilisation](#exemples-dutilisation)

---

## Installation & Démarrage

### 1. Installer les dépendances

```bash
cd backend
pip install flask flask-cors python-dotenv flask-mail
```

### 2. Configuration (optionnel pour emails)

Créer un fichier `.env` à la racine du backend :

```env
SENDGRID_API_KEY=votre_clé_sendgrid
FROM_EMAIL=votremail@simplon.co
```

**Note** : L'envoi d'emails est optionnel. Si non configuré, les codes seront générés mais ne seront pas envoyés par email (log en console).

### 3. Lancer le serveur

```bash
python app.py
```

Le serveur démarre à `http://localhost:5000`

Vérifiez le statut :
```bash
curl http://localhost:5000/api/health
```

---

## Structure des données

### Fichiers JSON (dans `backend/data/`)

- **`users.json`** : Liste de tous les utilisateurs activés
- **`pending_users.json`** : Utilisateurs en attente d'activation
- **`codes.json`** : Codes de vérification temporaires
- **`projects.json`** : Tous les projets déposés
- **`activities.json`** : Journal des activités récentes

### Format utilisateur
```json
{
  "id": "uuid",
  "pseudo": "john_doe",
  "email": "john@simplon.co",
  "matricule": "AD-001 ou MAT-001",
  "role": "administrateur | formateur | apprenant",
  "password": "hashed_password",
  "date_creation": "2025-11-30T10:30:00"
}
```

### Format projet
```json
{
  "id": "uuid",
  "titre": "Mon projet React",
  "description": "Description détaillée",
  "technologies": ["React", "JavaScript", "Tailwind"],
  "categorie": "frontend | backend | fullstack | mobile | autres",
  "auteurId": "uuid",
  "auteurNom": "Jean Dupont",
  "dateCreation": "2025-11-30T10:30:00",
  "taille": "5.2 MB",
  "statut": "en_attente | approuve | rejete",
  "est_public": true,
  "filePath": "uploads/uuid_nomfichier.zip"
}
```

---

## Endpoints API

### 🔐 Authentification & Activation

#### **POST /send-code**
Envoie un code de vérification par email.

**Body:**
```json
{
  "email": "user@simplon.co",
  "matricule": "AD-001 ou MAT-001"
}
```

**Response:**
```json
{
  "message": "Code envoyé avec succès !"
}
```

---

#### **POST /verify-code**
Vérifie le code envoyé.

**Body:**
```json
{
  "email": "user@simplon.co",
  "matricule": "AD-001",
  "code": "123456"
}
```

**Response:**
```json
{
  "message": "Code validé avec succès"
}
```

---

#### **POST /api/activation**
Active le compte utilisateur après vérification du code.

**Body:**
```json
{
  "email": "user@simplon.co",
  "matricule": "AD-001",
  "pseudo": "johndoe",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "message": "Compte activé avec succès!",
  "user": {
    "id": "uuid",
    "pseudo": "johndoe",
    "email": "user@simplon.co",
    "role": "administrateur | apprenant",
    "matricule": "AD-001",
    "date_creation": "2025-11-30T10:30:00"
  }
}
```

---

#### **POST /api/login**
Authentifie un utilisateur.

**Body:**
```json
{
  "identifier": "johndoe ou user@simplon.co",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "message": "Connexion réussie",
  "user": { /* utilisateur sans password */ },
  "current_user": { /* même objet pour compatibilité */ }
}
```

---

### 📁 Gestion des Projets

#### **GET /api/projects**
Récupère tous les projets (ou filtrer par utilisateur).

**Query Params:**
- `userId` (optionnel) : Filtrer par auteur

**Response:**
```json
[
  { /* projet 1 */ },
  { /* projet 2 */ }
]
```

---

#### **POST /api/projects**
Crée un nouveau projet avec fichier ZIP.

**Content-Type:** `multipart/form-data`

**Fields:**
- `titre` (string, requis)
- `description` (string, requis)
- `categorie` (string, optionnel : frontend|backend|fullstack|mobile|autres)
- `auteurId` (string, requis)
- `auteurNom` (string, requis)
- `technologies` (array, peut être multi) : ex. `technologies=React&technologies=JavaScript`
- `file` (binary, optionnel) : ZIP du projet

**Response:**
```json
{
  "message": "Projet créé avec succès!",
  "project": { /* objet projet */ }
}
```

---

#### **DELETE /api/projects/<project_id>**
Supprime un projet et son fichier.

**Response:**
```json
{
  "message": "Projet supprimé avec succès"
}
```

---

### 📊 Gestion des Activités

#### **GET /api/activities**
Récupère les activités récentes.

**Query Params:**
- `limit` (int, optionnel, default=10)

**Response:**
```json
[
  {
    "id": "uuid",
    "type": "upload | download | etc",
    "description": "Dépôt du projet 'Mon Projet'",
    "user": "Jean Dupont",
    "userId": "uuid",
    "time": "2025-11-30T10:30:00",
    "timestamp": "2025-11-30T10:30:00"
  }
]
```

---

#### **POST /api/activities**
Crée une nouvelle activité.

**Body:**
```json
{
  "type": "upload | download | etc",
  "description": "Description de l'activité",
  "user": "Jean Dupont",
  "userId": "uuid"
}
```

**Response:**
```json
{
  "message": "Activité enregistrée",
  "activity": { /* objet activité */ }
}
```

---

### 💾 Téléchargements

#### **GET /api/downloads/<project_id>**
Récupère les infos de téléchargement d'un projet.

**Response:**
```json
{
  "download_url": "/api/file/project_id",
  "project": "Mon Projet",
  "filename": "project.zip",
  "size": "5.2 MB"
}
```

---

#### **GET /api/file/<project_id>**
Télécharge le fichier ZIP du projet.

**Response:** Fichier binaire ZIP

---

### 🔍 Utilitaires

#### **GET /api/health**
Vérifie l'état du serveur et le nombre de données.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-11-30T10:30:00",
  "files": {
    "users": 5,
    "pending": 2,
    "codes": 0,
    "projects": 12,
    "activities": 45
  }
}
```

---

#### **GET /api/init**
Récupère les données initiales pour initialiser le localStorage du frontend.

**Response:**
```json
{
  "simplon_users": [ /* tableau users */ ],
  "simplon_projects": [ /* tableau projects */ ],
  "recent_activities": [ /* tableau activities */ ],
  "current_user": null
}
```

---

## Exemples d'utilisation

### 1. Flow d'activation complet

```bash
# 1. Envoyer un code
curl -X POST http://localhost:5000/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"user@simplon.co", "matricule":"MAT-001"}'

# 2. Vérifier le code (voir logs pour le code généré)
curl -X POST http://localhost:5000/verify-code \
  -H "Content-Type: application/json" \
  -d '{"email":"user@simplon.co", "matricule":"MAT-001", "code":"123456"}'

# 3. Activer le compte
curl -X POST http://localhost:5000/api/activation \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@simplon.co",
    "matricule":"MAT-001",
    "pseudo":"johndoe",
    "password":"Pass123!"
  }'
```

---

### 2. Créer un projet avec fichier

```bash
# Préparer un fichier ZIP
# Puis faire un POST multipart

curl -X POST http://localhost:5000/api/projects \
  -F "titre=Mon Projet React" \
  -F "description=Un super projet en React" \
  -F "categorie=frontend" \
  -F "auteurId=uuid_utilisateur" \
  -F "auteurNom=Jean Dupont" \
  -F "technologies=React" \
  -F "technologies=JavaScript" \
  -F "file=@/chemin/vers/projet.zip"
```

---

### 3. Récupérer les projets d'un utilisateur

```bash
curl "http://localhost:5000/api/projects?userId=uuid_utilisateur"
```

---

### 4. Télécharger un projet

```bash
# 1. Récupérer l'URL
curl "http://localhost:5000/api/downloads/project_id"

# 2. Télécharger le fichier
curl -O http://localhost:5000/api/file/project_id
```

---

## 📝 Notes importantes

### ⚠️ Sécurité
- **Les mots de passe ne sont PAS hachés** dans cette version. En production, utilisez `werkzeug.security` ou similaire.
- CORS est configuré pour `http://localhost:5173` uniquement. À adapter en production.
- Pas d'authentification par token (JWT). À implémenter pour la production.

### 📂 Dossiers générés
- `backend/data/` : Fichiers JSON des données
- `backend/uploads/` : Fichiers ZIP uploadés par les utilisateurs

### 🐛 Débogage
- Activez `debug=True` dans `app.run()` pour le mode développement
- Les logs s'affichent directement dans la console

---

## 🚀 Prochaines étapes

1. Ajouter le hachage des mots de passe
2. Implémenter l'authentification JWT
3. Ajouter des validations de données plus robustes
4. Implémenter un système de permissions
5. Ajouter des tests unitaires

---

**Besoin d'aide ?** Consultez les commentaires dans `app.py` ou posez une question ! 🎉
