from werkzeug.security import generate_password_hash
from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    flash,
    abort,
    send_file
)

from flask_login import (
    LoginManager,
    UserMixin,
    login_user,
    logout_user,
    login_required,
    current_user
)

from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)

from dotenv import load_dotenv
from functools import wraps
from datetime import datetime, timedelta

import os
import json
import io
import psycopg2

from psycopg2.extras import RealDictCursor

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from werkzeug.security import generate_password_hash


# =========================================================
# CONFIGURATION
# =========================================================

load_dotenv()

app = Flask(__name__)

app.secret_key = os.getenv(
    "SECRET_KEY",
    "cle-secrete-mon-atelier"
)

DATABASE_URL = os.getenv("DATABASE_URL")


# =========================================================
# LOGIN MANAGER
# =========================================================

login_manager = LoginManager()

login_manager.init_app(app)

login_manager.login_view = "login"

login_manager.login_message = (
    "Veuillez vous connecter pour accéder à cette page."
)

login_manager.login_message_category = "warning"


# =========================================================
# CONNEXION POSTGRESQL
# =========================================================

def get_db():

    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL n'est pas configurée dans le fichier .env"
        )

    conn = psycopg2.connect(
        DATABASE_URL,
        sslmode="require"
    )

    return conn


# =========================================================
# GESTION DES RÔLES
# =========================================================

def role_required(*roles):

    def decorator(f):

        @wraps(f)
        def decorated_function(*args, **kwargs):

            if not current_user.is_authenticated:
                return login_manager.unauthorized()

            if current_user.role not in roles:
                abort(403)

            return f(*args, **kwargs)

        return decorated_function

    return decorator


# =========================================================
# UTILISATEUR
# =========================================================

class User(UserMixin):

    def __init__(
        self,
        id,
        username,
        role
    ):

        self.id = id
        self.username = username
        self.role = role


@login_manager.user_loader
def load_user(user_id):

    conn = get_db()

    cursor = conn.cursor(
        cursor_factory=RealDictCursor
    )

    try:

        cursor.execute(
            """
            SELECT
                id,
                username,
                role
            FROM users
            WHERE id = %s
            """,
            (user_id,)
        )

        user = cursor.fetchone()

        if user:

            return User(
                user["id"],
                user["username"],
                user["role"]
            )

        return None

    finally:

        cursor.close()
        conn.close()


# =========================================================
# ERREUR 403
# =========================================================

@app.errorhandler(403)
def acces_interdit(error):

    return render_template(
        "403.html"
    ), 403


# =========================================================
# LOGIN
# =========================================================

@app.route(
    "/login",
    methods=["GET", "POST"]
)
def login():

    if current_user.is_authenticated:

        return redirect(
            url_for("index")
        )

    if request.method == "POST":

        username = request.form.get(
            "username",
            ""
        ).strip()

        password = request.form.get(
            "password",
            ""
        )

        conn = get_db()

        cursor = conn.cursor(
            cursor_factory=RealDictCursor
        )

        try:

            cursor.execute(
                """
                SELECT
                    id,
                    username,
                    password,
                    role
                FROM users
                WHERE username = %s
                """,
                (username,)
            )

            user = cursor.fetchone()

            if user and check_password_hash(
                user["password"],
                password
            ):

                utilisateur = User(
                    user["id"],
                    user["username"],
                    user["role"]
                )

                login_user(
                    utilisateur
                )

                flash(
                    "Connexion réussie.",
                    "success"
                )

                return redirect(
                    url_for("index")
                )

            flash(
                "Nom d'utilisateur ou mot de passe incorrect.",
                "danger"
            )

        finally:

            cursor.close()
            conn.close()

    return render_template(
        "login.html"
    )


# =========================================================
# LOGOUT
# =========================================================

@app.route("/logout")
@login_required
def logout():

    logout_user()

    flash(
        "Vous êtes déconnecté.",
        "success"
    )

    return redirect(
        url_for("login")
    )


# =========================================================
# PRÉPARER LES UTILISATEURS
# =========================================================

@app.route("/preparer-utilisateurs")
def preparer_utilisateurs():

    conn = get_db()

    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS role
            VARCHAR(50)
            DEFAULT 'consultation'
            """
        )

        conn.commit()

        return (
            "Colonne role préparée avec succès."
        )

    except Exception as e:

        conn.rollback()

        return (
            f"Erreur : {e}"
        )

    finally:

        cursor.close()
        conn.close()


# =========================================================
# CRÉER LES UTILISATEURS INITIAUX
# =========================================================

@app.route("/creer-utilisateurs")
def creer_utilisateurs():

    conn = get_db()

    cursor = conn.cursor()

    utilisateurs = [
        (
            "admin",
            "admin123",
            "admin"
        ),
        (
            "reception",
            "reception123",
            "reception"
        ),
        (
            "consultation",
            "consultation123",
            "consultation"
        )
    ]

    try:

        for username, password, role in utilisateurs:

            cursor.execute(
                """
                SELECT id
                FROM users
                WHERE username = %s
                """,
                (username,)
            )

            existe = cursor.fetchone()

            if not existe:

                password_hash = generate_password_hash(
                    password
                )

                cursor.execute(
                    """
                    INSERT INTO users
                    (
                        username,
                        password,
                        role
                    )
                    VALUES
                    (%s, %s, %s)
                    """,
                    (
                        username,
                        password_hash,
                        role
                    )
                )

        conn.commit()

        return (
            "Utilisateurs créés avec succès."
        )

    except Exception as e:

        conn.rollback()

        return (
            f"Erreur : {e}"
        )

    finally:

        cursor.close()
        conn.close()
@app.route("/utilisateurs")
@login_required
@role_required("admin")
def utilisateurs():

    conn = get_db()

    cursor = conn.cursor(
        cursor_factory=RealDictCursor
    )

    try:

        cursor.execute("""
            SELECT
                id,
                username,
                role
            FROM users
            ORDER BY id ASC
        """)

        utilisateurs = cursor.fetchall()

        return render_template(
            "utilisateur.html",
            utilisateurs=utilisateurs
        )

    except Exception as e:

        conn.rollback()

        flash(
            f"Erreur lors du chargement des utilisateurs : {e}",
            "danger"
        )

        return redirect(
            url_for("index")
        )

    finally:

        cursor.close()
        conn.close()

@app.route("/ajouter-utilisateur", methods=["GET", "POST"])
@login_required
@role_required("admin")
def ajouter_utilisateur():

    if request.method == "POST":

        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        role = request.form.get("role", "").strip()

        if not username or not password or not role:
            flash(
                "Veuillez remplir tous les champs.",
                "warning"
            )
            return render_template("ajouter_utilisateur.html")

        if role not in ["admin", "reception", "consultation"]:
            flash(
                "Rôle utilisateur invalide.",
                "danger"
            )
            return render_template("ajouter_utilisateur.html")

        conn = get_db()
        cursor = conn.cursor()

        try:

            cursor.execute(
                """
                SELECT id
                FROM users
                WHERE username = %s
                """,
                (username,)
            )

            if cursor.fetchone():
                flash(
                    "Ce nom d'utilisateur existe déjà.",
                    "warning"
                )
                return render_template(
                    "ajouter_utilisateur.html"
                )

            password_hash = generate_password_hash(password)

            cursor.execute(
                """
                INSERT INTO users
                (
                    username,
                    password,
                    role
                )
                VALUES
                (%s, %s, %s)
                """,
                (
                    username,
                    password_hash,
                    role
                )
            )

            conn.commit()

            flash(
                "Utilisateur créé avec succès.",
                "success"
            )

            return redirect(
                url_for("utilisateurs")
            )

        except Exception as e:

            conn.rollback()

            flash(
                f"Erreur lors de la création : {e}",
                "danger"
            )

            return render_template(
                "ajouter_utilisateur.html"
            )

        finally:

            cursor.close()
            conn.close()

    return render_template(
        "ajouter_utilisateur.html"
    )



@app.route(
    "/modifier-utilisateur/<int:id>",
    methods=["GET", "POST"]
)
@login_required
@role_required("admin")
def modifier_utilisateur(id):

    conn = get_db()
    cursor = conn.cursor(
        cursor_factory=RealDictCursor
    )

    try:

        # Récupérer l'utilisateur
        cursor.execute(
            """
            SELECT
                id,
                username,
                role
            FROM users
            WHERE id = %s
            """,
            (id,)
        )

        utilisateur = cursor.fetchone()

        print("UTILISATEUR :", utilisateur)

        # Utilisateur inexistant
        if not utilisateur:

            flash(
                "Utilisateur introuvable.",
                "danger"
            )

            return redirect(
                url_for("utilisateurs")
            )

        # Traitement du formulaire
        if request.method == "POST":

            username = request.form.get(
                "username",
                ""
            ).strip()

            password = request.form.get(
                "password",
                ""
            )

            role = request.form.get(
                "role",
                ""
            ).strip()

            # Nom obligatoire
            if not username:

                flash(
                    "Le nom d'utilisateur est obligatoire.",
                    "warning"
                )

                return render_template(
                    "modifier_utilisateur.html",
                    utilisateur=utilisateur
                )

            # Vérification du rôle
            if role not in [
                "admin",
                "reception",
                "consultation"
            ]:

                flash(
                    "Le rôle sélectionné est invalide.",
                    "danger"
                )

                return render_template(
                    "modifier_utilisateur.html",
                    utilisateur=utilisateur
                )

            # Vérifier si le nom est déjà utilisé
            cursor.execute(
                """
                SELECT id
                FROM users
                WHERE username = %s
                AND id != %s
                """,
                (
                    username,
                    id
                )
            )

            utilisateur_existant = cursor.fetchone()

            if utilisateur_existant:

                flash(
                    "Ce nom d'utilisateur est déjà utilisé.",
                    "warning"
                )

                return render_template(
                    "modifier_utilisateur.html",
                    utilisateur=utilisateur
                )

            # Nouveau mot de passe
            if password.strip():

                if len(password) < 6:

                    flash(
                        "Le mot de passe doit contenir au moins 6 caractères.",
                        "warning"
                    )

                    return render_template(
                        "modifier_utilisateur.html",
                        utilisateur=utilisateur
                    )

                password_hash = generate_password_hash(
                    password
                )

                cursor.execute(
                    """
                    UPDATE users
                    SET
                        username = %s,
                        password = %s,
                        role = %s
                    WHERE id = %s
                    """,
                    (
                        username,
                        password_hash,
                        role,
                        id
                    )
                )

            # Aucun nouveau mot de passe
            else:

                cursor.execute(
                    """
                    UPDATE users
                    SET
                        username = %s,
                        role = %s
                    WHERE id = %s
                    """,
                    (
                        username,
                        role,
                        id
                    )
                )

            conn.commit()

            flash(
                "Utilisateur modifié avec succès.",
                "success"
            )

            return redirect(
                url_for("utilisateurs")
            )

        # Afficher le formulaire
        return render_template(
            "modifier_utilisateur.html",
            utilisateur=utilisateur
        )

    except Exception as e:

        conn.rollback()

        print(
            "ERREUR MODIFICATION :",
            e
        )

        flash(
            f"Erreur lors de la modification : {e}",
            "danger"
        )

        return redirect(
            url_for("utilisateurs")
        )

    finally:

        cursor.close()
        conn.close()



@app.route("/supprimer-utilisateur/<int:id>", methods=["POST"])
@login_required
@role_required("admin")
def supprimer_utilisateur(id):

    # Empêcher un administrateur de supprimer son propre compte
    if str(current_user.id) == str(id):
        flash(
            "Vous ne pouvez pas supprimer votre propre compte.",
            "warning"
        )
        return redirect(url_for("utilisateurs"))

    conn = get_db()
    cursor = conn.cursor()

    try:

        # Vérifier que l'utilisateur existe
        cursor.execute(
            """
            SELECT username
            FROM users
            WHERE id = %s
            """,
            (id,)
        )

        utilisateur = cursor.fetchone()

        if not utilisateur:
            flash(
                "Utilisateur introuvable.",
                "danger"
            )
            return redirect(url_for("utilisateurs"))

        # Supprimer l'utilisateur
        cursor.execute(
            """
            DELETE FROM users
            WHERE id = %s
            """,
            (id,)
        )

        conn.commit()

        flash(
            "Utilisateur supprimé avec succès.",
            "success"
        )

        return redirect(
            url_for("utilisateurs")
        )

    except Exception as e:

        conn.rollback()

        flash(
            f"Erreur lors de la suppression : {e}",
            "danger"
        )

        return redirect(
            url_for("utilisateurs")
        )

    finally:

        cursor.close()
        conn.close()

# =========================================================
# DASHBOARD
# =========================================================

@app.route("/")
@login_required
def index():

    conn = get_db()

    cursor = conn.cursor(
        cursor_factory=RealDictCursor
    )

    try:

        # =================================================
        # TOTAL CLIENTS
        # =================================================

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM clients
        """)

        resultat_clients = cursor.fetchone()

        total_clients = (
            resultat_clients["total"] or 0
        )


        # =================================================
        # TOTAL RÉPARATIONS
        # =================================================

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM reparations
        """)

        resultat_reparations = cursor.fetchone()

        total_reparations = (
            resultat_reparations["total"] or 0
        )


        # =================================================
        # RÉPARATIONS EN ATTENTE
        # =================================================

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM reparations
            WHERE statut = 'En attente'
        """)

        resultat_attente = cursor.fetchone()

        reparations_attente = (
            resultat_attente["total"] or 0
        )


        # =================================================
        # RÉPARATIONS TERMINÉES
        # =================================================

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM reparations
            WHERE statut IN (
                'Terminé',
                'Terminee',
                'Terminé'
            )
        """)

        resultat_terminees = cursor.fetchone()

        reparations_terminees = (
            resultat_terminees["total"] or 0
        )


        # =================================================
        # TOTAL DEVIS
        # =================================================

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM devis
        """)

        resultat_devis = cursor.fetchone()

        total_devis = (
            resultat_devis["total"] or 0
        )


        # =================================================
        # DERNIERS CLIENTS
        # =================================================

        cursor.execute("""
            SELECT
                id,
                nom,
                telephone,
                adresse
            FROM clients
            ORDER BY id DESC
            LIMIT 5
        """)

        derniers_clients = cursor.fetchall()


        # =================================================
        # DERNIÈRES RÉPARATIONS
        # =================================================

        cursor.execute("""
            SELECT
                id,
                client_nom,
                appareil,
                panne,
                prix,
                montant_paye,
                reste_a_payer,
                statut,
                date_depot
            FROM reparations
            ORDER BY id DESC
            LIMIT 5
        """)

        dernieres_reparations = cursor.fetchall()


        # =================================================
        # DERNIERS DEVIS
        # =================================================

        cursor.execute("""
            SELECT
                d.id,
                d.numero,
                d.total,
                d.devise,
                d.statut,
                d.date_creation,
                c.nom AS client_nom
            FROM devis d
            JOIN clients c
                ON d.client_id = c.id
            ORDER BY d.date_creation DESC
            LIMIT 5
        """)

        derniers_devis = cursor.fetchall()


        # =================================================
        # MONTANTS DES RÉPARATIONS
        # =================================================

        cursor.execute("""
            SELECT
                COALESCE(SUM(prix), 0) AS total,
                COALESCE(SUM(montant_paye), 0) AS paye,
                COALESCE(SUM(reste_a_payer), 0) AS reste
            FROM reparations
        """)

        finances_reparations = cursor.fetchone()

        total_reparations_montant = float(
            finances_reparations["total"] or 0
        )

        total_reparations_paye = float(
            finances_reparations["paye"] or 0
        )

        total_reparations_reste = float(
            finances_reparations["reste"] or 0
        )


        # =================================================
        # RENDRE LE TABLEAU DE BORD
        # =================================================

        return render_template(
            "index.html",

            total_clients=total_clients,

            total_reparations=total_reparations,

            reparations_attente=reparations_attente,

            reparations_terminees=reparations_terminees,

            total_devis=total_devis,

            derniers_clients=derniers_clients,

            dernieres_reparations=dernieres_reparations,

            derniers_devis=derniers_devis,

            total_reparations_montant=total_reparations_montant,

            total_reparations_paye=total_reparations_paye,

            total_reparations_reste=total_reparations_reste
        )

    except Exception as e:

        conn.rollback()

        flash(
            f"Erreur lors du chargement du tableau de bord : {e}",
            "danger"
        )

        return render_template(
            "index.html",

            total_clients=0,

            total_reparations=0,

            reparations_attente=0,

            reparations_terminees=0,

            total_devis=0,

            derniers_clients=[],

            dernieres_reparations=[],

            derniers_devis=[],

            total_reparations_montant=0,

            total_reparations_paye=0,

            total_reparations_reste=0
        )

    finally:

        cursor.close()
        conn.close()




# =========================================================
# CONTEXT PROCESSOR
# =========================================================

@app.context_processor
def inject_user_role():

    return {
        "current_user": current_user
    }


# =========================================================
# CLIENTS
# =========================================================

@app.route("/clients")
@login_required
@role_required(
    "admin",
    "reception",
    "consultation"
)
def clients():

    conn = get_db()

    cursor = conn.cursor(
        cursor_factory=RealDictCursor
    )

    try:

        cursor.execute(
            """
            SELECT *
            FROM clients
            ORDER BY id DESC
            """
        )

        liste_clients = cursor.fetchall()

        return render_template(
            "clients.html",
            clients=liste_clients
        )

    finally:

        cursor.close()
        conn.close()


@app.route(
    "/ajouter-client",
    methods=["GET", "POST"]
)
@login_required
@role_required(
    "admin",
    "reception"
)
def ajouter_client():

    if request.method == "POST":

        nom = request.form.get(
            "nom",
            ""
        ).strip()

        telephone = request.form.get(
            "telephone",
            ""
        ).strip()

        adresse = request.form.get(
            "adresse",
            ""
        ).strip()

        if not nom:

            flash(
                "Le nom du client est obligatoire.",
                "danger"
            )

            return redirect(
                url_for("ajouter_client")
            )

        conn = get_db()

        cursor = conn.cursor()

        try:

            cursor.execute(
                """
                INSERT INTO clients
                (
                    nom,
                    telephone,
                    adresse
                )
                VALUES
                (%s, %s, %s)
                """,
                (
                    nom,
                    telephone,
                    adresse
                )
            )

            conn.commit()

            flash(
                "Client ajouté avec succès.",
                "success"
            )

            return redirect(
                url_for("clients")
            )

        except Exception as e:

            conn.rollback()

            flash(
                f"Erreur : {e}",
                "danger"
            )

        finally:

            cursor.close()
            conn.close()

    return render_template(
        "ajouter_client.html"
    )


@app.route(
    "/modifier-client/<int:id>",
    methods=["GET", "POST"]
)
@login_required
@role_required(
    "admin",
    "reception"
)
def modifier_client(id):

    conn = get_db()

    cursor = conn.cursor(
        cursor_factory=RealDictCursor
    )

    try:

        cursor.execute(
            """
            SELECT *
            FROM clients
            WHERE id = %s
            """,
            (id,)
        )

        client = cursor.fetchone()

        if not client:

            flash(
                "Client introuvable.",
                "danger"
            )

            return redirect(
                url_for("clients")
            )

        if request.method == "POST":

            nom = request.form.get(
                "nom",
                ""
            ).strip()

            telephone = request.form.get(
                "telephone",
                ""
            ).strip()

            adresse = request.form.get(
                "adresse",
                ""
            ).strip()

            if not nom:

                flash(
                    "Le nom est obligatoire.",
                    "danger"
                )

                return redirect(
                    url_for(
                        "modifier_client",
                        id=id
                    )
                )

            cursor.execute(
                """
                UPDATE clients
                SET
                    nom = %s,
                    telephone = %s,
                    adresse = %s
                WHERE id = %s
                """,
                (
                    nom,
                    telephone,
                    adresse,
                    id
                )
            )

            conn.commit()

            flash(
                "Client modifié avec succès.",
                "success"
            )

            return redirect(
                url_for("clients")
            )

        return render_template(
            "modifier_client.html",
            client=client
        )

    finally:

        cursor.close()
        conn.close()


@app.route(
    "/supprimer-client/<int:id>",
    methods=["POST"]
)
@login_required
@role_required("admin")
def supprimer_client(id):

    conn = get_db()

    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            DELETE FROM clients
            WHERE id = %s
            """,
            (id,)
        )

        conn.commit()

        flash(
            "Client supprimé avec succès.",
            "success"
        )

    except Exception as e:

        conn.rollback()

        flash(
            f"Erreur : {e}",
            "danger"
        )

    finally:

        cursor.close()
        conn.close()

    return redirect(
        url_for("clients")
    )
# =========================================================
# ENREGISTRER L'HISTORIQUE D'UNE RÉPARATION
# =========================================================

def enregistrer_historique_reparation(
    cursor,
    reparation_id,
    reparation,
    action
):

    # =====================================================
    # DEVISE
    # =====================================================

    devise = reparation.get("devise")

    if devise is None:
        devise = "FC"

    devise = str(devise).strip().upper()

    if devise not in ("FC", "USD"):
        devise = "FC"

    # =====================================================
    # UTILISATEUR
    # =====================================================

    utilisateur = ""

    try:
        utilisateur = getattr(
            current_user,
            "username",
            ""
        ) or ""
    except Exception:
        utilisateur = ""

    # =====================================================
    # ENREGISTRER DANS L'HISTORIQUE
    # =====================================================

    cursor.execute(
        """
        INSERT INTO historique_reparations (
            reparation_id,
            client_nom,
            appareil,
            panne,
            prix,
            montant_paye,
            reste_a_payer,
            statut,
            date_depot,
            date_recuperation,
            action,
            utilisateur,
            date_action,
            devise
        )
        VALUES (
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            CURRENT_TIMESTAMP,
            %s
        )
        """,
        (
            reparation_id,
            reparation.get("client_nom", ""),
            reparation.get("appareil", ""),
            reparation.get("panne", ""),
            reparation.get("prix", 0),
            reparation.get("montant_paye", 0),
            reparation.get("reste_a_payer", 0),
            reparation.get("statut", "En attente"),
            reparation.get("date_depot"),
            reparation.get("date_recuperation"),
            action,
            utilisateur,
            devise
        )
    )

# =========================================================
# FINANCES - FONCTION AUTOMATIQUE POUR LES RÉPARATIONS
# =========================================================

def enregistrer_entree_reparation(
    cursor,
    reparation_id,
    montant,
    client_nom,
    appareil
):
    """
    Enregistre automatiquement un paiement de réparation
    dans les finances.

    IMPORTANT :
    - On enregistre uniquement le montant réellement payé.
    - Le prix total de la réparation n'est PAS enregistré.
    - La transaction est liée à la réparation.
    """

    if montant is None:
        return

    montant = float(montant)

    if montant <= 0:
        return

    description = (
        f"Paiement réparation #{reparation_id} - "
        f"{client_nom} - {appareil}"
    )

    cursor.execute(
        """
        INSERT INTO transactions_financieres
        (
            type,
            categorie,
            description,
            montant,
            devise,
            date_transaction,
            utilisateur,
            reparation_id,
            source
        )
        VALUES
        (
            'entree',
            'Réparation',
            %s,
            %s,
            'FC',
            CURRENT_TIMESTAMP,
            %s,
            %s,
            'reparation'
        )
        """,
        (
            description,
            montant,
            current_user.username,
            reparation_id
        )
    )


def enregistrer_correction_paiement_reparation(
    cursor,
    reparation_id,
    montant,
    client_nom,
    appareil
):
    """
    Enregistre une sortie lorsque le montant payé
    d'une réparation est diminué après correction.

    Exemple :
        ancien paiement = 20 000
        nouveau paiement = 15 000

    La différence de 5 000 est considérée comme
    un remboursement/correction.
    """

    if montant is None:
        return

    montant = float(montant)

    if montant <= 0:
        return

    description = (
        f"Correction remboursement réparation #{reparation_id} - "
        f"{client_nom} - {appareil}"
    )

    cursor.execute(
        """
        INSERT INTO transactions_financieres
        (
            type,
            categorie,
            description,
            montant,
            devise,
            date_transaction,
            utilisateur,
            reparation_id,
            source
        )
        VALUES
        (
            'sortie',
            'Correction réparation',
            %s,
            %s,
            'FC',
            CURRENT_TIMESTAMP,
            %s,
            %s,
            'correction_reparation'
        )
        """,
        (
            description,
            montant,
            current_user.username,
            reparation_id
        )
    )
# =========================================================
# AJOUTER UNE ENTRÉE FINANCIÈRE
# =========================================================

@app.route("/ajouter-entree", methods=["GET", "POST"])
@login_required
@role_required("admin", "reception")
def ajouter_entree():

    if request.method == "POST":

        categorie = request.form.get(
            "categorie",
            ""
        ).strip()

        description = request.form.get(
            "description",
            ""
        ).strip()

        montant_text = request.form.get(
            "montant",
            "0"
        ).strip()

        devise = request.form.get(
            "devise",
            "FC"
        ).strip().upper()

        # =========================
        # VALIDATION
        # =========================

        if not categorie:

            flash(
                "La catégorie est obligatoire.",
                "warning"
            )

            return redirect(
                url_for("ajouter_entree")
            )

        try:

            montant = float(
                montant_text or 0
            )

        except ValueError:

            flash(
                "Le montant est invalide.",
                "danger"
            )

            return redirect(
                url_for("ajouter_entree")
            )

        if montant <= 0:

            flash(
                "Le montant doit être supérieur à zéro.",
                "warning"
            )

            return redirect(
                url_for("ajouter_entree")
            )

        if devise not in ("FC", "USD"):

            flash(
                "La devise doit être FC ou USD.",
                "danger"
            )

            return redirect(
                url_for("ajouter_entree")
            )

        conn = get_db()

        cursor = conn.cursor()

        try:

            cursor.execute(
                """
                INSERT INTO transactions_financieres
                (
                    type,
                    categorie,
                    description,
                    montant,
                    devise,
                    date_transaction,
                    utilisateur
                )
                VALUES
                (
                    'entree',
                    %s,
                    %s,
                    %s,
                    %s,
                    CURRENT_TIMESTAMP,
                    %s
                )
                """,
                (
                    categorie,
                    description,
                    montant,
                    devise,
                    current_user.username
                )
            )

            conn.commit()

            flash(
                "Entrée financière ajoutée avec succès.",
                "success"
            )

            return redirect(
                url_for("finances")
            )

        except Exception as e:

            conn.rollback()

            flash(
                f"Erreur lors de l'ajout de l'entrée : {e}",
                "danger"
            )

            return redirect(
                url_for("ajouter_entree")
            )

        finally:

            cursor.close()
            conn.close()

    return render_template(
        "ajouter_entree.html"
    )


# =========================================================
# AJOUTER UNE SORTIE FINANCIÈRE
# =========================================================

@app.route("/ajouter-sortie", methods=["GET", "POST"])
@login_required
@role_required("admin", "reception")
def ajouter_sortie():

    if request.method == "POST":

        categorie = request.form.get(
            "categorie",
            ""
        ).strip()

        description = request.form.get(
            "description",
            ""
        ).strip()

        montant_text = request.form.get(
            "montant",
            "0"
        ).strip()

        devise = request.form.get(
            "devise",
            "FC"
        ).strip().upper()

        if not categorie:

            flash(
                "La catégorie est obligatoire.",
                "warning"
            )

            return redirect(
                url_for("ajouter_sortie")
            )

        try:

            montant = float(
                montant_text or 0
            )

        except ValueError:

            flash(
                "Le montant est invalide.",
                "danger"
            )

            return redirect(
                url_for("ajouter_sortie")
            )

        if montant <= 0:

            flash(
                "Le montant doit être supérieur à zéro.",
                "warning"
            )

            return redirect(
                url_for("ajouter_sortie")
            )

        if devise not in ("FC", "USD"):

            flash(
                "La devise doit être FC ou USD.",
                "danger"
            )

            return redirect(
                url_for("ajouter_sortie")
            )

        conn = get_db()

        cursor = conn.cursor()

        try:

            cursor.execute(
                """
                INSERT INTO transactions_financieres
                (
                    type,
                    categorie,
                    description,
                    montant,
                    devise,
                    date_transaction,
                    utilisateur
                )
                VALUES
                (
                    'sortie',
                    %s,
                    %s,
                    %s,
                    %s,
                    CURRENT_TIMESTAMP,
                    %s
                )
                """,
                (
                    categorie,
                    description,
                    montant,
                    devise,
                    current_user.username
                )
            )

            conn.commit()

            flash(
                "Sortie financière ajoutée avec succès.",
                "success"
            )

            return redirect(
                url_for("finances")
            )

        except Exception as e:

            conn.rollback()

            flash(
                f"Erreur lors de l'ajout de la sortie : {e}",
                "danger"
            )

            return redirect(
                url_for("ajouter_sortie")
            )

        finally:

            cursor.close()
            conn.close()

    return render_template(
        "ajouter_sortie.html"
    )



# =========================================================
# RÉPARATIONS
# =========================================================
@app.route("/reparations")
@login_required
@role_required("admin", "reception", "consultation")
def reparations():

    conn = get_db()
    cursor = conn.cursor(
        cursor_factory=RealDictCursor
    )

    try:

        cursor.execute("""
            SELECT
                id,
                client_nom,
                appareil,
                panne,
                prix,
                montant_paye,
                reste_a_payer,
                statut,
                date_depot,
                date_recuperation
            FROM reparations
            ORDER BY id DESC
        """)

        reparations = cursor.fetchall()

        return render_template(
            "reparations.html",
            reparations=reparations
        )

    except Exception as e:

        conn.rollback()

        flash(
            f"Erreur lors du chargement des réparations : {e}",
            "danger"
        )

        return redirect(
            url_for("index")
        )

    finally:

        cursor.close()
        conn.close()

# =================================================
# ajouter-reparation
# =================================================

       
# =================================================
# AJOUTER UNE RÉPARATION
# =================================================

@app.route("/ajouter-reparation", methods=["GET", "POST"])
@login_required
@role_required("admin", "reception")
def ajouter_reparation():

    conn = get_db()
    cursor = conn.cursor(
        cursor_factory=RealDictCursor
    )

    try:

        # =================================================
        # AFFICHER LE FORMULAIRE
        # =================================================

        if request.method == "GET":

            cursor.execute("""
                SELECT
                    id,
                    nom,
                    telephone
                FROM clients
                ORDER BY nom ASC
            """)

            clients = cursor.fetchall()

            return render_template(
                "ajouter_reparation.html",
                clients=clients
            )

        # =================================================
        # RÉCUPÉRER LES DONNÉES
        # =================================================

        client_id = request.form.get(
            "client_id",
            ""
        ).strip()

        appareil = request.form.get(
            "appareil",
            ""
        ).strip()

        panne = request.form.get(
            "panne",
            ""
        ).strip()

        prix_text = request.form.get(
            "prix",
            "0"
        ).strip().replace(",", ".")

        montant_paye_text = request.form.get(
            "montant_paye",
            "0"
        ).strip().replace(",", ".")

        # IMPORTANT :
        # On récupère réellement la devise choisie
        devise = request.form.get(
            "devise",
            "FC"
        ).strip().upper()

        statut = request.form.get(
            "statut",
            "En attente"
        ).strip()

        date_recuperation = request.form.get(
            "date_recuperation",
            ""
        ).strip()

        if not date_recuperation:
            date_recuperation = None

        # =================================================
        # VALIDATION DE LA DEVISE
        # =================================================

        if devise not in ("FC", "USD"):

            flash(
                "La devise sélectionnée est invalide.",
                "danger"
            )

            return redirect(
                url_for("ajouter_reparation")
            )

        # =================================================
        # VALIDATION
        # =================================================

        if not client_id:

            flash(
                "Veuillez sélectionner un client.",
                "warning"
            )

            return redirect(
                url_for("ajouter_reparation")
            )

        if not appareil:

            flash(
                "Veuillez saisir l'appareil.",
                "warning"
            )

            return redirect(
                url_for("ajouter_reparation")
            )

        if not panne:

            flash(
                "Veuillez saisir la panne.",
                "warning"
            )

            return redirect(
                url_for("ajouter_reparation")
            )

        # =================================================
        # CONVERSION DES MONTANTS
        # =================================================

        try:

            prix = float(
                prix_text or 0
            )

            montant_paye = float(
                montant_paye_text or 0
            )

        except ValueError:

            flash(
                "Le prix et le montant payé doivent être numériques.",
                "danger"
            )

            return redirect(
                url_for("ajouter_reparation")
            )

        # =================================================
        # VALIDATION DES MONTANTS
        # =================================================

        if prix < 0:

            flash(
                "Le prix ne peut pas être négatif.",
                "danger"
            )

            return redirect(
                url_for("ajouter_reparation")
            )

        if montant_paye < 0:

            flash(
                "Le montant payé ne peut pas être négatif.",
                "danger"
            )

            return redirect(
                url_for("ajouter_reparation")
            )

        if montant_paye > prix:

            flash(
                "Le montant payé ne peut pas dépasser le prix.",
                "warning"
            )

            return redirect(
                url_for("ajouter_reparation")
            )

        reste_a_payer = prix - montant_paye

        # =================================================
        # RÉCUPÉRER LE CLIENT
        # =================================================

        cursor.execute("""
            SELECT
                id,
                nom,
                telephone
            FROM clients
            WHERE id = %s
        """, (client_id,))

        client = cursor.fetchone()

        if not client:

            flash(
                "Client introuvable.",
                "danger"
            )

            return redirect(
                url_for("ajouter_reparation")
            )

        # =================================================
        # AJOUTER LA RÉPARATION
        # =================================================

        cursor.execute("""
            INSERT INTO reparations (
                client_nom,
                appareil,
                panne,
                prix,
                montant_paye,
                reste_a_payer,
                devise,
                statut,
                date_depot,
                date_recuperation
            )
            VALUES (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                CURRENT_TIMESTAMP,
                %s
            )
            RETURNING
                id,
                client_nom,
                appareil,
                panne,
                prix,
                montant_paye,
                reste_a_payer,
                devise,
                statut,
                date_depot,
                date_recuperation
        """, (
            client["nom"],
            appareil,
            panne,
            prix,
            montant_paye,
            reste_a_payer,
            devise,
            statut,
            date_recuperation
        ))

        reparation = cursor.fetchone()

        # =================================================
        # AJOUTER À L'HISTORIQUE
        # =================================================

        enregistrer_historique_reparation(
            cursor,
            reparation["id"],
            reparation,
            "Ajout"
        )

        # =================================================
        # ENTRÉE FINANCIÈRE AUTOMATIQUE
        # =================================================

        if montant_paye > 0:

            description = (
                f"Paiement réparation #{reparation['id']} - "
                f"{client['nom']} - "
                f"{appareil}"
            )

            cursor.execute("""
                INSERT INTO transactions_financieres (
                    type,
                    categorie,
                    description,
                    montant,
                    devise,
                    date_transaction,
                    reparation_id
                )
                VALUES (
                    'entree',
                    %s,
                    %s,
                    %s,
                    %s,
                    CURRENT_TIMESTAMP,
                    %s
                )
            """, (
                "Réparation",
                description,
                montant_paye,
                devise,
                reparation["id"]
            ))

        # =================================================
        # VALIDER
        # =================================================

        conn.commit()

        # =================================================
        # MESSAGE
        # =================================================

        if montant_paye > 0:

            flash(
                f"Réparation ajoutée. "
                f"Paiement de {montant_paye:,.2f} {devise} "
                f"enregistré automatiquement dans les finances.",
                "success"
            )

        else:

            flash(
                "Réparation ajoutée avec succès.",
                "success"
            )

        return redirect(
            url_for("reparations")
        )

    except Exception as e:

        conn.rollback()

        print(
            "ERREUR AJOUT RÉPARATION :",
            e
        )

        flash(
            f"Erreur lors de l'ajout de la réparation : {e}",
            "danger"
        )

        return redirect(
            url_for("reparations")
        )

    finally:

        cursor.close()
        conn.close()
# =========================================================
# MODIFIER UNE RÉPARATION
# =========================================================

@app.route(
    "/modifier-reparation/<int:id>",
    methods=["GET", "POST"]
)
@login_required
@role_required("admin", "reception")
def modifier_reparation(id):

    conn = get_db()

    cursor = conn.cursor(
        cursor_factory=RealDictCursor
    )

    try:

        # =================================================
        # RÉCUPÉRER LA RÉPARATION
        # =================================================

        cursor.execute(
            """
            SELECT
                id,
                client_nom,
                appareil,
                panne,
                prix,
                montant_paye,
                reste_a_payer,
                statut,
                date_depot,
                date_recuperation
            FROM reparations
            WHERE id = %s
            """,
            (id,)
        )

        reparation = cursor.fetchone()

        if not reparation:

            flash(
                "Réparation introuvable.",
                "danger"
            )

            return redirect(
                url_for("reparations")
            )

        # =================================================
        # TRAITEMENT DU FORMULAIRE
        # =================================================

        if request.method == "POST":

            client_id = request.form.get(
                "client_id",
                ""
            ).strip()

            appareil = request.form.get(
                "appareil",
                ""
            ).strip()

            panne = request.form.get(
                "panne",
                ""
            ).strip()

            prix_text = request.form.get(
                "prix",
                "0"
            ).strip()

            montant_paye_text = request.form.get(
                "montant_paye",
                "0"
            ).strip()

            statut = request.form.get(
                "statut",
                "En attente"
            ).strip()

            date_recuperation = request.form.get(
                "date_recuperation",
                ""
            ).strip()

            # =================================================
            # VALIDATION
            # =================================================

            if not client_id:

                flash(
                    "Veuillez sélectionner un client.",
                    "danger"
                )

                return redirect(
                    url_for(
                        "modifier_reparation",
                        id=id
                    )
                )

            if not appareil:

                flash(
                    "Le nom de l'appareil est obligatoire.",
                    "danger"
                )

                return redirect(
                    url_for(
                        "modifier_reparation",
                        id=id
                    )
                )

            if not panne:

                flash(
                    "Veuillez décrire la panne.",
                    "danger"
                )

                return redirect(
                    url_for(
                        "modifier_reparation",
                        id=id
                    )
                )

            # =================================================
            # CONVERSION DES MONTANTS
            # =================================================

            try:

                prix = float(
                    prix_text or 0
                )

                montant_paye = float(
                    montant_paye_text or 0
                )

            except ValueError:

                flash(
                    "Le prix et le montant payé doivent être des nombres.",
                    "danger"
                )

                return redirect(
                    url_for(
                        "modifier_reparation",
                        id=id
                    )
                )

            if prix < 0:
                prix = 0

            if montant_paye < 0:
                montant_paye = 0

            if montant_paye > prix:
                montant_paye = prix

            reste_a_payer = prix - montant_paye

            # =================================================
            # RÉCUPÉRER LE CLIENT
            # =================================================

            cursor.execute(
                """
                SELECT
                    id,
                    nom
                FROM clients
                WHERE id = %s
                """,
                (client_id,)
            )

            client = cursor.fetchone()

            if not client:

                flash(
                    "Le client sélectionné n'existe pas.",
                    "danger"
                )

                return redirect(
                    url_for(
                        "modifier_reparation",
                        id=id
                    )
                )

            # =================================================
            # MODIFIER LA RÉPARATION
            # =================================================

            cursor.execute(
                """
                UPDATE reparations
                SET
                    client_nom = %s,
                    appareil = %s,
                    panne = %s,
                    prix = %s,
                    montant_paye = %s,
                    reste_a_payer = %s,
                    statut = %s,
                    date_recuperation = %s
                WHERE id = %s
                """,
                (
                    client["nom"],
                    appareil,
                    panne,
                    prix,
                    montant_paye,
                    reste_a_payer,
                    statut,
                    date_recuperation if date_recuperation else None,
                    id
                )
            )

            conn.commit()

            flash(
                "Réparation modifiée avec succès.",
                "success"
            )

            return redirect(
                url_for("reparations")
            )

        # =================================================
        # LISTE DES CLIENTS
        # =================================================

        cursor.execute(
            """
            SELECT
                id,
                nom,
                telephone
            FROM clients
            ORDER BY nom ASC
            """
        )

        clients = cursor.fetchall()

        # =================================================
        # AFFICHAGE
        # =================================================

        return render_template(
            "modifier_reparation.html",
            reparation=reparation,
            clients=clients
        )

    except Exception as e:

        conn.rollback()

        flash(
            f"Erreur lors de la modification de la réparation : {e}",
            "danger"
        )

        return redirect(
            url_for("reparations")
        )

    finally:

        cursor.close()
        conn.close()


# =========================================================
# SUPPRIMER UNE RÉPARATION
# =========================================================
@app.route(
    "/supprimer-reparation/<int:id>",
    methods=["POST"]
)
@login_required
@role_required("admin", "reception")
def supprimer_reparation(id):

    conn = get_db()
    cursor = conn.cursor()

    try:

        # Vérifier que la réparation existe
        cursor.execute("""
            SELECT id
            FROM reparations
            WHERE id = %s
        """, (id,))

        reparation = cursor.fetchone()

        if not reparation:
            flash(
                "Réparation introuvable.",
                "warning"
            )
            return redirect(
                url_for("reparations")
            )

        # Supprimer la réparation
        cursor.execute("""
            DELETE FROM reparations
            WHERE id = %s
        """, (id,))

        conn.commit()

        flash(
            "Réparation supprimée avec succès.",
            "success"
        )

    except Exception as e:

        conn.rollback()

        flash(
            f"Erreur lors de la suppression de la réparation : {e}",
            "danger"
        )

    finally:

        cursor.close()
        conn.close()

    return redirect(
        url_for("reparations")
    )
# =========================================================
# PAIEMENT D'UNE RÉPARATION
# =========================================================

# =========================================================
# PAIEMENT D'UNE RÉPARATION
# =========================================================

@app.route("/paiement/<int:id>", methods=["GET", "POST"])
@login_required
def paiement(id):

    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # Valeur par défaut pour éviter une erreur
    reparation = None

    try:

        # =====================================================
        # 1. RÉCUPÉRER LA RÉPARATION
        # =====================================================

        cur.execute("""
            SELECT
                id,
                client_nom,
                appareil,
                panne,
                prix,
                montant_paye,
                reste_a_payer,
                devise,
                statut,
                date_depot,
                date_recuperation
            FROM reparations
            WHERE id = %s
            FOR UPDATE
        """, (id,))

        reparation = cur.fetchone()

        if not reparation:

            flash(
                "Réparation introuvable.",
                "danger"
            )

            return redirect(
                url_for("reparations")
            )

        # =====================================================
        # 2. DONNÉES DE LA RÉPARATION
        # =====================================================

        prix = float(
            reparation.get("prix") or 0
        )

        ancien_paye = float(
            reparation.get("montant_paye") or 0
        )

        reste_a_payer = float(
            reparation.get("reste_a_payer") or 0
        )

        # Recalcul de sécurité
        reste_calcule = prix - ancien_paye

        if reste_calcule < 0:
            reste_calcule = 0

        # On utilise le montant réellement calculé
        reste_a_payer = reste_calcule

        # =====================================================
        # 3. DEVISE DE LA RÉPARATION
        # =====================================================

        devise_reparation = str(
            reparation.get("devise") or "FC"
        ).strip().upper()

        if devise_reparation not in ("FC", "USD"):

            devise_reparation = "FC"

        # =====================================================
        # 4. INFORMATIONS
        # =====================================================

        client_nom = str(
            reparation.get("client_nom") or ""
        ).strip()

        appareil = str(
            reparation.get("appareil") or ""
        ).strip()

        panne = str(
            reparation.get("panne") or ""
        ).strip()

        ancien_statut = (
            reparation.get("statut")
            or "En attente"
        )

        # =====================================================
        # 5. AFFICHER LE FORMULAIRE
        # =====================================================

        if request.method == "GET":

            return render_template(
                "paiement.html",
                reparation=reparation
            )

        # =====================================================
        # 6. RÉCUPÉRER LES DONNÉES DU FORMULAIRE
        # =====================================================

        montant_str = request.form.get(
            "montant",
            ""
        ).strip()

        devise_paiement = request.form.get(
            "devise",
            ""
        ).strip().upper()

        mode_paiement = request.form.get(
            "mode_paiement",
            ""
        ).strip()

        observation = request.form.get(
            "observation",
            ""
        ).strip()

        # =====================================================
        # 7. VÉRIFIER LA DEVISE
        # =====================================================

        if devise_paiement not in ("FC", "USD"):

            flash(
                "Devise de paiement invalide.",
                "danger"
            )

            return render_template(
                "paiement.html",
                reparation=reparation
            )

        # =====================================================
        # 8. EMPÊCHER LE MÉLANGE DES DEVISES
        # =====================================================

        if devise_paiement != devise_reparation:

            flash(
                "La devise du paiement doit être la même "
                f"que celle de la réparation : "
                f"{devise_reparation}.",
                "danger"
            )

            return render_template(
                "paiement.html",
                reparation=reparation
            )

        # =====================================================
        # 9. VÉRIFIER LE MONTANT
        # =====================================================

        try:

            montant = float(
                montant_str.replace(",", ".")
            )

        except (ValueError, TypeError):

            flash(
                "Veuillez entrer un montant valide.",
                "danger"
            )

            return render_template(
                "paiement.html",
                reparation=reparation
            )

        # =====================================================
        # 10. VALIDATION DU MONTANT
        # =====================================================

        if montant <= 0:

            flash(
                "Le montant doit être supérieur à zéro.",
                "danger"
            )

            return render_template(
                "paiement.html",
                reparation=reparation
            )

        if reste_a_payer <= 0:

            flash(
                "Cette réparation est déjà entièrement payée.",
                "warning"
            )

            return render_template(
                "paiement.html",
                reparation=reparation
            )

        if montant > reste_a_payer:

            flash(
                "Le montant du paiement ne peut pas dépasser "
                f"le reste à payer de "
                f"{reste_a_payer:,.2f} {devise_reparation}.",
                "danger"
            )

            return render_template(
                "paiement.html",
                reparation=reparation
            )

        # =====================================================
        # 11. CALCUL DU NOUVEAU TOTAL
        # =====================================================

        nouveau_paye = (
            ancien_paye + montant
        )

        nouveau_reste = (
            prix - nouveau_paye
        )

        if nouveau_reste < 0:
            nouveau_reste = 0

        # Petite sécurité contre les problèmes de flottants
        if abs(nouveau_reste) < 0.000001:
            nouveau_reste = 0

        # =====================================================
        # 12. NOUVEAU STATUT
        # =====================================================

        if nouveau_reste == 0:

            nouveau_statut = "Terminée"

        else:

            nouveau_statut = ancien_statut

        # =====================================================
        # 13. UTILISATEUR
        # =====================================================

        utilisateur = ""

        try:

            utilisateur = getattr(
                current_user,
                "username",
                ""
            ) or ""

        except Exception:

            utilisateur = ""

        # =====================================================
        # 14. IDENTIFIANT UTILISATEUR
        # =====================================================

        utilisateur_id = getattr(
            current_user,
            "id",
            None
        )

        # =====================================================
        # 15. METTRE À JOUR LA RÉPARATION
        # =====================================================

        cur.execute("""
            UPDATE reparations
            SET
                montant_paye = %s,
                reste_a_payer = %s,
                statut = %s
            WHERE id = %s
        """, (
            nouveau_paye,
            nouveau_reste,
            nouveau_statut,
            id
        ))

        # =====================================================
        # 16. HISTORIQUE DES PAIEMENTS
        # =====================================================

        cur.execute("""
            INSERT INTO historique_paiements
            (
                reparation_id,
                client_nom,
                appareil,
                montant,
                devise,
                ancien_total_paye,
                nouveau_total_paye,
                reste_a_payer,
                date_paiement,
                utilisateur_id
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                CURRENT_TIMESTAMP,
                %s
            )
        """, (
            id,
            client_nom,
            appareil,
            montant,
            devise_reparation,
            ancien_paye,
            nouveau_paye,
            nouveau_reste,
            utilisateur_id
        ))

        # =====================================================
        # 17. HISTORIQUE DES RÉPARATIONS
        # =====================================================

        cur.execute("""
            INSERT INTO historique_reparations
            (
                reparation_id,
                client_nom,
                appareil,
                panne,
                prix,
                montant_paye,
                reste_a_payer,
                statut,
                date_depot,
                date_recuperation,
                action,
                utilisateur,
                date_action,
                devise
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                CURRENT_TIMESTAMP,
                %s
            )
        """, (
            id,
            client_nom,
            appareil,
            panne,
            prix,
            nouveau_paye,
            nouveau_reste,
            nouveau_statut,
            reparation.get("date_depot"),
            reparation.get("date_recuperation"),
            "Paiement",
            utilisateur,
            devise_reparation
        ))

        # =====================================================
        # 18. DESCRIPTION FINANCIÈRE
        # =====================================================

        description = (
            f"Paiement réparation #{id}"
        )

        if client_nom:

            description += (
                f" - {client_nom}"
            )

        if appareil:

            description += (
                f" - {appareil}"
            )

        if mode_paiement:

            description += (
                f" - {mode_paiement}"
            )

        if observation:

            description += (
                f" - {observation}"
            )

        # =====================================================
        # 19. CRÉER UNE ENTRÉE FINANCIÈRE
        # =====================================================

        # IMPORTANT :
        # transactions_financieres ne possède PAS
        # de colonne "utilisateur".

        cur.execute("""
            INSERT INTO transactions_financieres
            (
                type,
                categorie,
                description,
                montant,
                devise,
                date_transaction,
                reparation_id
            )
            VALUES
            (
                'entree',
                %s,
                %s,
                %s,
                %s,
                CURRENT_TIMESTAMP,
                %s
            )
        """, (
            "Réparation",
            description,
            montant,
            devise_reparation,
            id
        ))

        # =====================================================
        # 20. VALIDER TOUTES LES OPÉRATIONS
        # =====================================================

        conn.commit()

        # =====================================================
        # 21. MESSAGE DE SUCCÈS
        # =====================================================

        if nouveau_reste == 0:

            flash(
                f"Paiement de "
                f"{montant:,.2f} {devise_reparation} "
                "enregistré avec succès. "
                "La réparation est entièrement payée.",
                "success"
            )

        else:

            flash(
                f"Paiement de "
                f"{montant:,.2f} {devise_reparation} "
                "enregistré avec succès. "
                f"Total payé : "
                f"{nouveau_paye:,.2f} {devise_reparation}. "
                f"Reste : "
                f"{nouveau_reste:,.2f} {devise_reparation}.",
                "success"
            )

        # =====================================================
        # 22. RETOUR AUX FINANCES
        # =====================================================

        return redirect(
            url_for("finances")
        )

    # =========================================================
    # ERREUR
    # =========================================================

    except Exception as e:

        conn.rollback()

        print(
            "ERREUR PAIEMENT :",
            e
        )

        flash(
            f"Erreur lors de l'enregistrement du paiement : {e}",
            "danger"
        )

        return render_template(
            "paiement.html",
            reparation=reparation
        )

    # =========================================================
    # FERMER
    # =========================================================

    finally:

        cur.close()
        conn.close()
@app.route("/historique-paiements")
@login_required
def historique_paiements():
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute("""
            SELECT
                hp.id,
                hp.reparation_id,
                hp.client_nom,
                hp.appareil,
                hp.montant,
                hp.devise,
                hp.ancien_total_paye,
                hp.nouveau_total_paye,
                hp.reste_a_payer,
                hp.date_paiement,
                hp.utilisateur_id
            FROM historique_paiements hp
            ORDER BY hp.date_paiement DESC
        """)

        paiements = cursor.fetchall()

        return render_template(
            "historique_paiements.html",
            paiements=paiements
        )

    except Exception as e:
        flash(
            f"Erreur lors du chargement de l'historique : {e}",
            "danger"
        )
        return redirect(url_for("historique_reparations"))

    finally:
        cursor.close()
        conn.close()

# =========================================================
# HISTORIQUE DES RÉPARATIONS
# =========================================================

@app.route(
    "/historique-reparations",
    methods=["GET"]
)
@login_required
@role_required(
    "admin",
    "reception",
    "consultation"
)
def historique_reparations():

    conn = get_db()

    cursor = conn.cursor(
        cursor_factory=RealDictCursor
    )

    try:

        cursor.execute("""
            SELECT
                id,
                reparation_id,
                client_nom,
                appareil,
                panne,
                prix,
                montant_paye,
                reste_a_payer,
                devise,
                statut,
                action,
                utilisateur,
                date_action,
                date_depot,
                date_recuperation
            FROM historique_reparations
            ORDER BY
                date_action DESC,
                id DESC
        """)

        historique = cursor.fetchall()

        return render_template(
            "historique_reparations.html",
            historique=historique
        )

    except Exception as e:

        conn.rollback()

        print("ERREUR HISTORIQUE RÉPARATIONS :", e)

        flash(
            f"Erreur lors du chargement de l'historique : {e}",
            "danger"
        )

        return redirect(
            url_for("reparations")
        )

    finally:

        cursor.close()
        conn.close()

# =========================================================
# MATÉRIELS
# =========================================================

@app.route("/materiels")
@login_required
@role_required(
    "admin",
    "reception",
    "consultation"
)
def materiels():

    conn = get_db()

    cursor = conn.cursor(
        cursor_factory=RealDictCursor
    )

    try:

        cursor.execute(
            """
            SELECT *
            FROM materiels
            ORDER BY designation ASC
            """
        )

        liste_materiels = cursor.fetchall()

        return render_template(
            "materials.html",
            materiels=liste_materiels
        )

    finally:

        cursor.close()
        conn.close()


@app.route(
    "/ajouter-materiel",
    methods=["GET", "POST"]
)
@login_required
@role_required(
    "admin",
    "reception"
)
def ajouter_materiel():

    if request.method == "POST":

        designation = request.form.get(
            "designation",
            ""
        ).strip()

        categorie = request.form.get(
            "categorie",
            ""
        ).strip()

        unite = request.form.get(
            "unite",
            ""
        ).strip()

        prix = request.form.get(
            "prix",
            "0"
        )

        devise = request.form.get(
            "devise",
            "FC"
        ).strip().upper()

        description = request.form.get(
            "description",
            ""
        ).strip()

        try:

            prix = float(prix)

            if prix < 0:
                raise ValueError

        except ValueError:

            flash(
                "Prix invalide.",
                "danger"
            )

            return redirect(
                url_for("ajouter_materiel")
            )

        if devise not in [
            "FC",
            "USD"
        ]:

            flash(
                "La devise doit être FC ou USD.",
                "danger"
            )

            return redirect(
                url_for("ajouter_materiel")
            )

        if not designation:

            flash(
                "La désignation est obligatoire.",
                "danger"
            )

            return redirect(
                url_for("ajouter_materiel")
            )

        conn = get_db()

        cursor = conn.cursor()

        try:

            cursor.execute(
                """
                INSERT INTO materiels
                (
                    designation,
                    categorie,
                    unite,
                    prix,
                    description,
                    devise
                )
                VALUES
                (%s, %s, %s, %s, %s, %s)
                """,
                (
                    designation,
                    categorie,
                    unite,
                    prix,
                    description,
                    devise
                )
            )

            conn.commit()

            flash(
                "Matériel ajouté avec succès.",
                "success"
            )

            return redirect(
                url_for("materiels")
            )

        except Exception as e:

            conn.rollback()

            flash(
                f"Erreur : {e}",
                "danger"
            )

        finally:

            cursor.close()
            conn.close()

    return render_template(
        "ajouter_materiel.html"
    )


@app.route(
    "/modifier-materiel/<int:id>",
    methods=["GET", "POST"]
)
@login_required
@role_required(
    "admin",
    "reception"
)
def modifier_materiel(id):

    conn = get_db()

    cursor = conn.cursor(
        cursor_factory=RealDictCursor
    )

    try:

        cursor.execute(
            """
            SELECT *
            FROM materiels
            WHERE id = %s
            """,
            (id,)
        )

        materiel = cursor.fetchone()

        if not materiel:

            flash(
                "Matériel introuvable.",
                "danger"
            )

            return redirect(
                url_for("materiels")
            )

        if request.method == "POST":

            designation = request.form.get(
                "designation",
                ""
            ).strip()

            categorie = request.form.get(
                "categorie",
                ""
            ).strip()

            unite = request.form.get(
                "unite",
                ""
            ).strip()

            prix = request.form.get(
                "prix",
                "0"
            )

            devise = request.form.get(
                "devise",
                "FC"
            ).strip().upper()

            description = request.form.get(
                "description",
                ""
            ).strip()

            try:

                prix = float(prix)

                if prix < 0:
                    raise ValueError

            except ValueError:

                flash(
                    "Prix invalide.",
                    "danger"
                )

                return redirect(
                    url_for(
                        "modifier_materiel",
                        id=id
                    )
                )

            if devise not in [
                "FC",
                "USD"
            ]:

                flash(
                    "La devise doit être FC ou USD.",
                    "danger"
                )

                return redirect(
                    url_for(
                        "modifier_materiel",
                        id=id
                    )
                )

            cursor.execute(
                """
                UPDATE materiels
                SET
                    designation = %s,
                    categorie = %s,
                    unite = %s,
                    prix = %s,
                    description = %s,
                    devise = %s
                WHERE id = %s
                """,
                (
                    designation,
                    categorie,
                    unite,
                    prix,
                    description,
                    devise,
                    id
                )
            )

            conn.commit()

            flash(
                "Matériel modifié avec succès.",
                "success"
            )

            return redirect(
                url_for("materiels")
            )

        return render_template(
            "modifier_materiel.html",
            materiel=materiel
        )

    finally:

        cursor.close()
        conn.close()


@app.route(
    "/supprimer-materiel/<int:id>",
    methods=["POST"]
)
@login_required
@role_required("admin")
def supprimer_materiel(id):

    conn = get_db()

    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            DELETE FROM materiels
            WHERE id = %s
            """,
            (id,)
        )

        conn.commit()

        flash(
            "Matériel supprimé.",
            "success"
        )

    except Exception as e:

        conn.rollback()

        flash(
            f"Impossible de supprimer le matériel : {e}",
            "danger"
        )

    finally:

        cursor.close()
        conn.close()

    return redirect(
        url_for("materiels")
    )


# =========================================================
# LISTE DES DEVIS
# =========================================================

@app.route("/devis")
@login_required
@role_required(
    "admin",
    "reception",
    "consultation"
)
def devis():

    conn = get_db()

    cursor = conn.cursor(
        cursor_factory=RealDictCursor
    )

    try:

        cursor.execute(
            """
            SELECT
                d.id,
                d.numero,
                d.devise,
                d.main_oeuvre,
                d.transport,
                d.remise,
                d.total,
                d.statut,
                d.date_creation,
                d.date_validite,

                c.nom AS client_nom,
                c.telephone AS client_telephone

            FROM devis d

            JOIN clients c
                ON d.client_id = c.id

            ORDER BY
                d.date_creation DESC
            """
        )

        liste_devis = cursor.fetchall()

        date_du_jour = datetime.now().date()

        return render_template(
            "devis.html",
            devis=liste_devis,
            date_du_jour=date_du_jour
        )

    finally:

        cursor.close()
        conn.close()


# =========================================================
# AJOUTER UN DEVIS
# =========================================================

@app.route(
    "/ajouter-devis",
    methods=["GET", "POST"]
)
@login_required
@role_required(
    "admin",
    "reception"
)
def ajouter_devis():

    conn = get_db()

    cursor = conn.cursor(
        cursor_factory=RealDictCursor
    )

    try:

        if request.method == "POST":

            client_id = request.form.get(
                "client_id"
            )

            devise = request.form.get(
                "devise",
                "FC"
            ).strip().upper()

            lignes_json = request.form.get(
                "lignes",
                "[]"
            )

            transport_text = request.form.get(
                "transport",
                "0"
            )

            remise_text = request.form.get(
                "remise",
                "0"
            )

            date_validite_text = request.form.get(
                "date_validite",
                ""
            ).strip()

            if devise not in [
                "FC",
                "USD"
            ]:

                flash(
                    "La devise doit être FC ou USD.",
                    "danger"
                )

                return redirect(
                    url_for("ajouter_devis")
                )

            if date_validite_text:

                try:

                    date_validite = datetime.strptime(
                        date_validite_text,
                        "%Y-%m-%d"
                    ).date()

                except ValueError:

                    flash(
                        "La date de validité est invalide.",
                        "danger"
                    )

                    return redirect(
                        url_for("ajouter_devis")
                    )

            else:

                date_validite = (
                    datetime.now().date()
                    + timedelta(days=30)
                )

            if date_validite < datetime.now().date():

                flash(
                    "La date de validité ne peut pas être dans le passé.",
                    "danger"
                )

                return redirect(
                    url_for("ajouter_devis")
                )

            try:

                transport = float(
                    transport_text or 0
                )

                if transport < 0:
                    raise ValueError

            except ValueError:

                flash(
                    "Le montant du transport est invalide.",
                    "danger"
                )

                return redirect(
                    url_for("ajouter_devis")
                )

            try:

                remise = float(
                    remise_text or 0
                )

                if remise < 0:
                    raise ValueError

            except ValueError:

                flash(
                    "La remise est invalide.",
                    "danger"
                )

                return redirect(
                    url_for("ajouter_devis")
                )

            if not client_id:

                flash(
                    "Veuillez sélectionner un client.",
                    "danger"
                )

                return redirect(
                    url_for("ajouter_devis")
                )

            cursor.execute(
                """
                SELECT id
                FROM clients
                WHERE id = %s
                """,
                (client_id,)
            )

            client = cursor.fetchone()

            if not client:

                flash(
                    "Client introuvable.",
                    "danger"
                )

                return redirect(
                    url_for("ajouter_devis")
                )

            try:

                lignes = json.loads(
                    lignes_json
                )

            except Exception:

                flash(
                    "Les lignes du devis sont invalides.",
                    "danger"
                )

                return redirect(
                    url_for("ajouter_devis")
                )

            if not isinstance(lignes, list) or not lignes:

                flash(
                    "Veuillez ajouter au moins un matériel.",
                    "danger"
                )

                return redirect(
                    url_for("ajouter_devis")
                )

            lignes_finales = []

            sous_total = 0

            for ligne in lignes:

                try:

                    materiel_id = int(
                        ligne.get(
                            "materiel_id"
                        )
                    )

                    quantite = float(
                        ligne.get(
                            "quantite",
                            0
                        )
                    )

                except Exception:

                    flash(
                        "Une ligne du devis est invalide.",
                        "danger"
                    )

                    return redirect(
                        url_for("ajouter_devis")
                    )

                if quantite <= 0:

                    flash(
                        "La quantité doit être supérieure à zéro.",
                        "danger"
                    )

                    return redirect(
                        url_for("ajouter_devis")
                    )

                cursor.execute(
                    """
                    SELECT
                        id,
                        designation,
                        unite,
                        prix,
                        devise
                    FROM materiels
                    WHERE id = %s
                    """,
                    (materiel_id,)
                )

                materiel = cursor.fetchone()

                if not materiel:

                    flash(
                        "Un matériel sélectionné n'existe plus.",
                        "danger"
                    )

                    return redirect(
                        url_for("ajouter_devis")
                    )

                if materiel["devise"] != devise:

                    flash(
                        f"Le matériel « {materiel['designation']} » "
                        f"est en {materiel['devise']} alors que le devis "
                        f"est en {devise}.",
                        "danger"
                    )

                    return redirect(
                        url_for("ajouter_devis")
                    )

                prix_unitaire = float(
                    materiel["prix"]
                )

                total_ligne = (
                    quantite
                    * prix_unitaire
                )

                sous_total += total_ligne

                lignes_finales.append(
                    {
                        "materiel_id": materiel["id"],
                        "designation": materiel["designation"],
                        "quantite": quantite,
                        "prix_unitaire": prix_unitaire,
                        "total": total_ligne
                    }
                )

            main_oeuvre = (
                sous_total * 0.25
            )

            total = (
                sous_total
                + main_oeuvre
                + transport
                - remise
            )

            if total < 0:
                total = 0

            date_str = datetime.now().strftime(
                "%Y%m%d"
            )

            cursor.execute(
                """
                SELECT COUNT(*) AS nombre
                FROM devis
                """
            )

            resultat = cursor.fetchone()

            nombre_devis = (
                resultat["nombre"] + 1
            )

            numero = (
                f"DEV-{date_str}-"
                f"{nombre_devis:03d}"
            )

            cursor.execute(
                """
                INSERT INTO devis
                (
                    numero,
                    client_id,
                    devise,
                    main_oeuvre,
                    transport,
                    remise,
                    total,
                    statut,
                    date_validite
                )
                VALUES
                (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )
                RETURNING id
                """,
                (
                    numero,
                    client_id,
                    devise,
                    main_oeuvre,
                    transport,
                    remise,
                    total,
                    "Brouillon",
                    date_validite
                )
            )

            devis_id = cursor.fetchone()["id"]

            for ligne in lignes_finales:

                cursor.execute(
                    """
                    INSERT INTO devis_lignes
                    (
                        devis_id,
                        materiel_id,
                        designation,
                        quantite,
                        prix_unitaire,
                        total
                    )
                    VALUES
                    (
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s
                    )
                    """,
                    (
                        devis_id,
                        ligne["materiel_id"],
                        ligne["designation"],
                        ligne["quantite"],
                        ligne["prix_unitaire"],
                        ligne["total"]
                    )
                )

            conn.commit()

            flash(
                f"Devis {numero} créé avec succès.",
                "success"
            )

            return redirect(
                url_for(
                    "voir_devis",
                    id=devis_id
                )
            )

        cursor.execute(
            """
            SELECT *
            FROM clients
            ORDER BY nom ASC
            """
        )

        liste_clients = cursor.fetchall()

        cursor.execute(
            """
            SELECT *
            FROM materiels
            ORDER BY designation ASC
            """
        )

        liste_materiels = cursor.fetchall()

        date_defaut = (
            datetime.now().date()
            + timedelta(days=30)
        )

        return render_template(
            "ajouter_devis.html",
            clients=liste_clients,
            materiels=liste_materiels,
            date_defaut=date_defaut
        )

    except Exception as e:

        conn.rollback()

        flash(
            f"Erreur lors de la création du devis : {e}",
            "danger"
        )

        return redirect(
            url_for("devis")
        )

    finally:

        cursor.close()
        conn.close()


# =========================================================
# VOIR UN DEVIS
# =========================================================

@app.route(
    "/voir-devis/<int:id>"
)
@login_required
@role_required(
    "admin",
    "reception",
    "consultation"
)
def voir_devis(id):

    conn = get_db()

    cursor = conn.cursor(
        cursor_factory=RealDictCursor
    )

    try:

        cursor.execute(
            """
            SELECT
                d.id,
                d.numero,
                d.devise,
                d.main_oeuvre,
                d.transport,
                d.remise,
                d.total,
                d.statut,
                d.date_creation,
                d.date_validite,

                c.id AS client_id,
                c.nom AS client_nom,
                c.telephone AS client_telephone,
                c.adresse AS client_adresse

            FROM devis d

            JOIN clients c
                ON d.client_id = c.id

            WHERE d.id = %s
            """,
            (id,)
        )

        devis_data = cursor.fetchone()

        if not devis_data:

            flash(
                "Devis introuvable.",
                "danger"
            )

            return redirect(
                url_for("devis")
            )

        cursor.execute(
            """
            SELECT
                id,
                materiel_id,
                designation,
                quantite,
                prix_unitaire,
                total
            FROM devis_lignes
            WHERE devis_id = %s
            ORDER BY id ASC
            """,
            (id,)
        )

        lignes = cursor.fetchall()

        date_du_jour = (
            datetime.now().date()
        )

        return render_template(
            "voir_devis.html",
            devis=devis_data,
            lignes=lignes,
            date_du_jour=date_du_jour
        )

    except Exception as e:

        conn.rollback()

        flash(
            f"Erreur lors de l'affichage du devis : {e}",
            "danger"
        )

        return redirect(
            url_for("devis")
        )

    finally:

        cursor.close()
        conn.close()


# =========================================================
# MODIFIER UN DEVIS
# =========================================================

@app.route(
    "/modifier-devis/<int:id>",
    methods=["GET", "POST"]
)
@login_required
@role_required(
    "admin",
    "reception"
)
def modifier_devis(id):

    conn = get_db()

    cursor = conn.cursor(
        cursor_factory=RealDictCursor
    )

    try:

        cursor.execute(
            """
            SELECT *
            FROM devis
            WHERE id = %s
            """,
            (id,)
        )

        devis_data = cursor.fetchone()

        if not devis_data:

            flash(
                "Devis introuvable.",
                "danger"
            )

            return redirect(
                url_for("devis")
            )

        if request.method == "POST":

            client_id = request.form.get(
                "client_id"
            )

            devise = request.form.get(
                "devise",
                "FC"
            ).strip().upper()

            statut = request.form.get(
                "statut",
                "Brouillon"
            ).strip()

            lignes_json = request.form.get(
                "lignes",
                "[]"
            )

            transport_text = request.form.get(
                "transport",
                "0"
            )

            remise_text = request.form.get(
                "remise",
                "0"
            )

            date_validite_text = request.form.get(
                "date_validite",
                ""
            ).strip()

            if devise not in [
                "FC",
                "USD"
            ]:

                flash(
                    "Devise invalide.",
                    "danger"
                )

                return redirect(
                    url_for(
                        "modifier_devis",
                        id=id
                    )
                )

            if date_validite_text:

                try:

                    date_validite = datetime.strptime(
                        date_validite_text,
                        "%Y-%m-%d"
                    ).date()

                except ValueError:

                    flash(
                        "Date de validité invalide.",
                        "danger"
                    )

                    return redirect(
                        url_for(
                            "modifier_devis",
                            id=id
                        )
                    )

            else:

                date_validite = (
                    datetime.now().date()
                    + timedelta(days=30)
                )

            if date_validite < datetime.now().date():

                flash(
                    "La date de validité ne peut pas être dans le passé.",
                    "danger"
                )

                return redirect(
                    url_for(
                        "modifier_devis",
                        id=id
                    )
                )

            statuts_autorises = [
                "Brouillon",
                "Envoyé",
                "Accepté",
                "Refusé"
            ]

            if statut not in statuts_autorises:

                flash(
                    "Statut invalide.",
                    "danger"
                )

                return redirect(
                    url_for(
                        "modifier_devis",
                        id=id
                    )
                )

            cursor.execute(
                """
                SELECT id
                FROM clients
                WHERE id = %s
                """,
                (client_id,)
            )

            client = cursor.fetchone()

            if not client:

                flash(
                    "Client introuvable.",
                    "danger"
                )

                return redirect(
                    url_for(
                        "modifier_devis",
                        id=id
                    )
                )

            try:

                transport = float(
                    transport_text or 0
                )

                if transport < 0:
                    raise ValueError

            except ValueError:

                flash(
                    "Transport invalide.",
                    "danger"
                )

                return redirect(
                    url_for(
                        "modifier_devis",
                        id=id
                    )
                )

            try:

                remise = float(
                    remise_text or 0
                )

                if remise < 0:
                    raise ValueError

            except ValueError:

                flash(
                    "Remise invalide.",
                    "danger"
                )

                return redirect(
                    url_for(
                        "modifier_devis",
                        id=id
                    )
                )

            try:

                lignes = json.loads(
                    lignes_json
                )

            except Exception:

                flash(
                    "Les lignes du devis sont invalides.",
                    "danger"
                )

                return redirect(
                    url_for(
                        "modifier_devis",
                        id=id
                    )
                )

            if not isinstance(lignes, list) or not lignes:

                flash(
                    "Le devis doit contenir au moins un matériel.",
                    "danger"
                )

                return redirect(
                    url_for(
                        "modifier_devis",
                        id=id
                    )
                )

            lignes_finales = []

            sous_total = 0

            for ligne in lignes:

                try:

                    materiel_id = int(
                        ligne.get(
                            "materiel_id"
                        )
                    )

                    quantite = float(
                        ligne.get(
                            "quantite",
                            0
                        )
                    )

                except Exception:

                    flash(
                        "Une ligne est invalide.",
                        "danger"
                    )

                    return redirect(
                        url_for(
                            "modifier_devis",
                            id=id
                        )
                    )

                if quantite <= 0:

                    flash(
                        "La quantité doit être supérieure à zéro.",
                        "danger"
                    )

                    return redirect(
                        url_for(
                            "modifier_devis",
                            id=id
                        )
                    )

                cursor.execute(
                    """
                    SELECT
                        id,
                        designation,
                        unite,
                        prix,
                        devise
                    FROM materiels
                    WHERE id = %s
                    """,
                    (materiel_id,)
                )

                materiel = cursor.fetchone()

                if not materiel:

                    flash(
                        "Un matériel n'existe plus.",
                        "danger"
                    )

                    return redirect(
                        url_for(
                            "modifier_devis",
                            id=id
                        )
                    )

                if materiel["devise"] != devise:

                    flash(
                        f"Le matériel « {materiel['designation']} » "
                        f"est en {materiel['devise']} "
                        f"et le devis est en {devise}.",
                        "danger"
                    )

                    return redirect(
                        url_for(
                            "modifier_devis",
                            id=id
                        )
                    )

                prix_unitaire = float(
                    materiel["prix"]
                )

                total_ligne = (
                    quantite
                    * prix_unitaire
                )

                sous_total += total_ligne

                lignes_finales.append(
                    {
                        "materiel_id": materiel["id"],
                        "designation": materiel["designation"],
                        "quantite": quantite,
                        "prix_unitaire": prix_unitaire,
                        "total": total_ligne
                    }
                )

            main_oeuvre = (
                sous_total * 0.25
            )

            total = (
                sous_total
                + main_oeuvre
                + transport
                - remise
            )

            if total < 0:
                total = 0

            cursor.execute(
                """
                UPDATE devis
                SET
                    client_id = %s,
                    devise = %s,
                    main_oeuvre = %s,
                    transport = %s,
                    remise = %s,
                    total = %s,
                    statut = %s,
                    date_validite = %s
                WHERE id = %s
                """,
                (
                    client_id,
                    devise,
                    main_oeuvre,
                    transport,
                    remise,
                    total,
                    statut,
                    date_validite,
                    id
                )
            )

            cursor.execute(
                """
                DELETE FROM devis_lignes
                WHERE devis_id = %s
                """,
                (id,)
            )

            for ligne in lignes_finales:

                cursor.execute(
                    """
                    INSERT INTO devis_lignes
                    (
                        devis_id,
                        materiel_id,
                        designation,
                        quantite,
                        prix_unitaire,
                        total
                    )
                    VALUES
                    (
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s
                    )
                    """,
                    (
                        id,
                        ligne["materiel_id"],
                        ligne["designation"],
                        ligne["quantite"],
                        ligne["prix_unitaire"],
                        ligne["total"]
                    )
                )

            conn.commit()

            flash(
                "Devis modifié avec succès.",
                "success"
            )

            return redirect(
                url_for(
                    "voir_devis",
                    id=id
                )
            )

        cursor.execute(
            """
            SELECT *
            FROM clients
            ORDER BY nom ASC
            """
        )

        liste_clients = cursor.fetchall()

        cursor.execute(
            """
            SELECT *
            FROM materiels
            ORDER BY designation ASC
            """
        )

        liste_materiels = cursor.fetchall()

        cursor.execute(
            """
            SELECT *
            FROM devis_lignes
            WHERE devis_id = %s
            ORDER BY id ASC
            """,
            (id,)
        )

        lignes = cursor.fetchall()

        return render_template(
            "modifier_devis.html",
            devis=devis_data,
            lignes=lignes,
            clients=liste_clients,
            materiels=liste_materiels
        )

    except Exception as e:

        conn.rollback()

        flash(
            f"Erreur lors de la modification : {e}",
            "danger"
        )

        return redirect(
            url_for("devis")
        )

    finally:

        cursor.close()
        conn.close()


# =========================================================
# SUPPRIMER UN DEVIS
# =========================================================

@app.route(
    "/supprimer-devis/<int:id>",
    methods=["POST"]
)
@login_required
@role_required(
    "admin",
    "reception"
)
def supprimer_devis(id):

    conn = get_db()

    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            DELETE FROM devis
            WHERE id = %s
            """,
            (id,)
        )

        conn.commit()

        flash(
            "Devis supprimé avec succès.",
            "success"
        )

    except Exception as e:

        conn.rollback()

        flash(
            f"Erreur lors de la suppression : {e}",
            "danger"
        )

    finally:

        cursor.close()
        conn.close()

    return redirect(
        url_for("devis")
    )


# =========================================================

# RAPPORTS

# =========================================================

# =========================================================

# RAPPORTS

# =========================================================

# =========================================================
# RAPPORTS
# =========================================================

@app.route("/rapport")
@login_required
@role_required(
    "admin",
    "reception",
    "consultation"
)
def rapport():

    conn = get_db()

    cursor = conn.cursor(
        cursor_factory=RealDictCursor
    )

    try:

        cursor.execute("""
            SELECT
                COALESCE(
                    SUM(
                        CASE
                            WHEN type = 'entree'
                            AND devise = 'FC'
                            THEN montant
                            ELSE 0
                        END
                    ),
                    0
                ) AS entrees_fc,

                COALESCE(
                    SUM(
                        CASE
                            WHEN type = 'sortie'
                            AND devise = 'FC'
                            THEN montant
                            ELSE 0
                        END
                    ),
                    0
                ) AS sorties_fc

            FROM transactions_financieres
        """)

        finance_fc = cursor.fetchone()

        entrees_fc = float(
            finance_fc["entrees_fc"] or 0
        )

        sorties_fc = float(
            finance_fc["sorties_fc"] or 0
        )

        solde_fc = entrees_fc - sorties_fc

        cursor.execute("""
            SELECT
                COALESCE(
                    SUM(
                        CASE
                            WHEN type = 'entree'
                            AND devise = 'USD'
                            THEN montant
                            ELSE 0
                        END
                    ),
                    0
                ) AS entrees_usd,

                COALESCE(
                    SUM(
                        CASE
                            WHEN type = 'sortie'
                            AND devise = 'USD'
                            THEN montant
                            ELSE 0
                        END
                    ),
                    0
                ) AS sorties_usd

            FROM transactions_financieres
        """)

        finance_usd = cursor.fetchone()

        entrees_usd = float(
            finance_usd["entrees_usd"] or 0
        )

        sorties_usd = float(
            finance_usd["sorties_usd"] or 0
        )

        solde_usd = entrees_usd - sorties_usd

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM reparations
        """)

        total_reparations = cursor.fetchone()["total"]

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM clients
        """)

        total_clients = cursor.fetchone()["total"]

        cursor.execute("""
            SELECT
                id,
                type,
                categorie,
                description,
                montant,
                devise,
                date_transaction,
                utilisateur
            FROM transactions_financieres
            ORDER BY date_transaction DESC
            LIMIT 10
        """)

        dernieres_transactions = cursor.fetchall()

        return render_template(
            "rapport.html",
            entrees_fc=entrees_fc,
            sorties_fc=sorties_fc,
            solde_fc=solde_fc,
            entrees_usd=entrees_usd,
            sorties_usd=sorties_usd,
            solde_usd=solde_usd,
            total_reparations=total_reparations,
            total_clients=total_clients,
            dernieres_transactions=dernieres_transactions
        )

    except Exception as e:

        conn.rollback()

        flash(
            f"Erreur lors du chargement du rapport : {e}",
            "danger"
        )

        return redirect(
            url_for("index")
        )

    finally:

        cursor.close()
        conn.close()




# =========================================================
# PDF DU DEVIS
# =========================================================

@app.route(
    "/devis/<int:id>/pdf"
)
@login_required
@role_required(
    "admin",
    "reception",
    "consultation"
)
def devis_pdf(id):

    conn = get_db()

    cursor = conn.cursor(
        cursor_factory=RealDictCursor
    )

    try:

        cursor.execute(
            """
            SELECT
                d.id,
                d.numero,
                d.devise,
                d.main_oeuvre,
                d.transport,
                d.remise,
                d.total,
                d.statut,
                d.date_creation,
                d.date_validite,

                c.nom AS client_nom,
                c.telephone AS client_telephone,
                c.adresse AS client_adresse

            FROM devis d

            JOIN clients c
                ON d.client_id = c.id

            WHERE d.id = %s
            """,
            (id,)
        )

        devis_data = cursor.fetchone()

        if not devis_data:

            flash(
                "Devis introuvable.",
                "danger"
            )

            return redirect(
                url_for("devis")
            )

        cursor.execute(
            """
            SELECT
                designation,
                quantite,
                prix_unitaire,
                total
            FROM devis_lignes
            WHERE devis_id = %s
            ORDER BY id ASC
            """,
            (id,)
        )

        lignes = cursor.fetchall()

        buffer = io.BytesIO()

        largeur, hauteur = A4

        pdf = canvas.Canvas(
            buffer,
            pagesize=A4
        )

        # =================================================
        # EN-TÊTE
        # =================================================

        pdf.setFont(
            "Helvetica-Bold",
            20
        )

        pdf.drawString(
            25 * mm,
            hauteur - 25 * mm,
            "MON ATELIER"
        )

        pdf.setFont(
            "Helvetica",
            9
        )

        pdf.drawString(
            25 * mm,
            hauteur - 31 * mm,
            "Gestion d'atelier et devis"
        )

        pdf.drawString(
            25 * mm,
            hauteur - 36 * mm,
            "Téléphone : +243 977 133 845"
        )

        pdf.drawString(
            25 * mm,
            hauteur - 41 * mm,
            "Adresse : Butembo / Bulengera / Kalemire / Lyambo"
        )

        pdf.drawString(
            25 * mm,
            hauteur - 46 * mm,
            "Email : irkavughemagnifique@gmail.com"
        )

        pdf.setFont(
            "Helvetica-Bold",
            15
        )

        pdf.drawRightString(
            largeur - 25 * mm,
            hauteur - 25 * mm,
            "DEVIS"
        )

        pdf.setFont(
            "Helvetica",
            9
        )

        pdf.drawRightString(
            largeur - 25 * mm,
            hauteur - 32 * mm,
            f"N° : {devis_data['numero']}"
        )

        date_creation_text = "-"

        if devis_data["date_creation"]:

            date_creation_text = (
                devis_data["date_creation"]
                .strftime("%d/%m/%Y")
            )

        pdf.drawRightString(
            largeur - 25 * mm,
            hauteur - 38 * mm,
            f"Date : {date_creation_text}"
        )

        date_validite_text = "-"

        if devis_data["date_validite"]:

            date_validite_text = (
                devis_data["date_validite"]
                .strftime("%d/%m/%Y")
            )

        pdf.drawRightString(
            largeur - 25 * mm,
            hauteur - 44 * mm,
            f"Valable jusqu'au : {date_validite_text}"
        )

        # =================================================
        # CLIENT
        # =================================================

        y = hauteur - 65 * mm

        pdf.setFont(
            "Helvetica-Bold",
            11
        )

        pdf.drawString(
            25 * mm,
            y,
            "Client"
        )

        pdf.setFont(
            "Helvetica",
            9
        )

        y -= 6 * mm

        pdf.drawString(
            25 * mm,
            y,
            f"Nom : {devis_data['client_nom'] or '-'}"
        )

        y -= 5 * mm

        pdf.drawString(
            25 * mm,
            y,
            f"Téléphone : {devis_data['client_telephone'] or '-'}"
        )

        y -= 5 * mm

        pdf.drawString(
            25 * mm,
            y,
            f"Adresse : {devis_data['client_adresse'] or '-'}"
        )

        # =================================================
        # INFORMATIONS DEVIS
        # =================================================

        y -= 12 * mm

        pdf.setFont(
            "Helvetica-Bold",
            10
        )

        pdf.drawString(
            25 * mm,
            y,
            f"Devise : {devis_data['devise']}"
        )

        pdf.drawRightString(
            largeur - 25 * mm,
            y,
            f"Statut : {devis_data['statut']}"
        )

        # =================================================
        # TABLEAU
        # =================================================

        y -= 10 * mm

        x_designation = 25 * mm
        x_quantite = 112 * mm
        x_prix = 138 * mm
        x_total = 172 * mm

        pdf.setFillColor(
            colors.lightgrey
        )

        pdf.rect(
            20 * mm,
            y - 5 * mm,
            largeur - 40 * mm,
            8 * mm,
            fill=1,
            stroke=0
        )

        pdf.setFillColor(
            colors.black
        )

        pdf.setFont(
            "Helvetica-Bold",
            8
        )

        pdf.drawString(
            x_designation,
            y - 2 * mm,
            "Désignation"
        )

        pdf.drawString(
            x_quantite,
            y - 2 * mm,
            "Qté"
        )

        pdf.drawString(
            x_prix,
            y - 2 * mm,
            "Prix unit."
        )

        pdf.drawString(
            x_total,
            y - 2 * mm,
            "Total"
        )

        y -= 11 * mm

        pdf.setFont(
            "Helvetica",
            8
        )

        for ligne in lignes:

            if y < 45 * mm:

                pdf.showPage()

                y = hauteur - 25 * mm

                pdf.setFont(
                    "Helvetica-Bold",
                    8
                )

                pdf.drawString(
                    x_designation,
                    y,
                    "Désignation"
                )

                pdf.drawString(
                    x_quantite,
                    y,
                    "Qté"
                )

                pdf.drawString(
                    x_prix,
                    y,
                    "Prix unit."
                )

                pdf.drawString(
                    x_total,
                    y,
                    "Total"
                )

                y -= 8 * mm

                pdf.setFont(
                    "Helvetica",
                    8
                )

            designation = (
                str(
                    ligne["designation"]
                )[:45]
            )

            quantite = float(
                ligne["quantite"]
            )

            prix_unitaire = float(
                ligne["prix_unitaire"]
            )

            total_ligne = float(
                ligne["total"]
            )

            pdf.drawString(
                x_designation,
                y,
                designation
            )

            pdf.drawRightString(
                x_quantite + 10 * mm,
                y,
                f"{quantite:g}"
            )

            pdf.drawRightString(
                x_prix + 22 * mm,
                y,
                f"{prix_unitaire:,.2f}"
            )

            pdf.drawRightString(
                largeur - 25 * mm,
                y,
                f"{total_ligne:,.2f}"
            )

            y -= 6 * mm

        # =================================================
        # TOTAUX
        # =================================================

        y -= 5 * mm

        sous_total = sum(
            float(ligne["total"])
            for ligne in lignes
        )

        main_oeuvre = float(
            devis_data["main_oeuvre"] or 0
        )

        transport = float(
            devis_data["transport"] or 0
        )

        remise = float(
            devis_data["remise"] or 0
        )

        total = float(
            devis_data["total"] or 0
        )

        pdf.line(
            120 * mm,
            y,
            largeur - 20 * mm,
            y
        )

        y -= 7 * mm

        pdf.setFont(
            "Helvetica",
            9
        )

        pdf.drawString(
            120 * mm,
            y,
            "Sous-total matériel :"
        )

        pdf.drawRightString(
            largeur - 25 * mm,
            y,
            f"{sous_total:,.2f} {devis_data['devise']}"
        )

        y -= 6 * mm

        pdf.drawString(
            120 * mm,
            y,
            "Main d'œuvre (25 %) :"
        )

        pdf.drawRightString(
            largeur - 25 * mm,
            y,
            f"{main_oeuvre:,.2f} {devis_data['devise']}"
        )

        y -= 6 * mm

        pdf.drawString(
            120 * mm,
            y,
            "Transport :"
        )

        pdf.drawRightString(
            largeur - 25 * mm,
            y,
            f"{transport:,.2f} {devis_data['devise']}"
        )

        y -= 6 * mm

        pdf.drawString(
            120 * mm,
            y,
            "Remise :"
        )

        pdf.drawRightString(
            largeur - 25 * mm,
            y,
            f"{remise:,.2f} {devis_data['devise']}"
        )

        y -= 9 * mm

        pdf.setFont(
            "Helvetica-Bold",
            12
        )

        pdf.drawString(
            120 * mm,
            y,
            "TOTAL :"
        )

        pdf.drawRightString(
            largeur - 25 * mm,
            y,
            f"{total:,.2f} {devis_data['devise']}"
        )

        # =================================================
        # SIGNATURE
        # =================================================

        y -= 25 * mm

        pdf.setFont(
            "Helvetica",
            9
        )

        pdf.drawString(
            30 * mm,
            y,
            "Signature du client"
        )

        pdf.drawString(
            135 * mm,
            y,
            "Signature autorisée"
        )

        pdf.line(
            25 * mm,
            y - 15 * mm,
            85 * mm,
            y - 15 * mm
        )

        pdf.line(
            130 * mm,
            y - 15 * mm,
            190 * mm,
            y - 15 * mm
        )

        pdf.setFont(
            "Times-Italic",
            13
        )

        pdf.drawCentredString(
            160 * mm,
            y - 9 * mm,
            "Mon Atelier"
        )

        # =================================================
        # FOOTER
        # =================================================

        pdf.setFont(
            "Helvetica",
            7
        )

        pdf.drawCentredString(
            largeur / 2,
            12 * mm,
            "Mon Atelier - +243 977 133 845"
        )

        pdf.drawCentredString(
            largeur / 2,
            8 * mm,
            "irkavughemagnifique@gmail.com"
        )

        pdf.drawCentredString(
            largeur / 2,
            4 * mm,
            "Butembo / Bulengera / Kalemire / Lyambo"
        )

        pdf.save()

        buffer.seek(0)

        filename = (
            f"{devis_data['numero']}.pdf"
        )

        return send_file(
            buffer,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=filename
        )

    except Exception as e:

        conn.rollback()

        flash(
            f"Erreur lors de la génération du PDF : {e}",
            "danger"
        )

        return redirect(
            url_for(
                "voir_devis",
                id=id
            )
        )

    finally:

        cursor.close()
        conn.close()


# =========================================================
# LANCEMENT
# =========================================================
# =========================================================
# À PROPOS
# =========================================================

@app.route("/apropos")
@login_required
def apropos():

    return render_template(
        "apropos.html"
    )
print("historique_reparations:",
      "historique_reparations" in app.view_functions)

print(app.url_map)

# =========================================================
# FINANCES - ENTRÉES / SORTIES
# =========================================================

@app.route("/finances")
@login_required
def finances():

    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:

        # =====================================================
        # FILTRES
        # =====================================================

        type_filtre = request.args.get(
            "type", ""
        ).strip()

        categorie_filtre = request.args.get(
            "categorie", ""
        ).strip()

        devise_filtre = request.args.get(
            "devise", ""
        ).strip()

        date_debut = request.args.get(
            "date_debut", ""
        ).strip()

        date_fin = request.args.get(
            "date_fin", ""
        ).strip()

        # =====================================================
        # TRANSACTIONS
        # =====================================================

        query = """
            SELECT
                id,
                type,
                categorie,
                description,
                montant,
                devise,
                date_transaction,
                utilisateur,
                created_at
            FROM transactions_financieres
            WHERE 1 = 1
        """

        params = []

        if type_filtre in ("entree", "sortie"):
            query += """
                AND type = %s
            """
            params.append(type_filtre)

        if categorie_filtre:
            query += """
                AND categorie = %s
            """
            params.append(categorie_filtre)

        if devise_filtre in ("FC", "USD"):
            query += """
                AND devise = %s
            """
            params.append(devise_filtre)

        if date_debut:
            query += """
                AND date_transaction >= %s::date
            """
            params.append(date_debut)

        if date_fin:
            query += """
                AND date_transaction < (%s::date + INTERVAL '1 day')
            """
            params.append(date_fin)

        query += """
            ORDER BY
                date_transaction DESC,
                id DESC
        """

        cursor.execute(query, params)

        transactions = cursor.fetchall()

        # =====================================================
        # CATÉGORIES
        # =====================================================

        cursor.execute("""
            SELECT DISTINCT categorie
            FROM transactions_financieres
            WHERE categorie IS NOT NULL
              AND categorie <> ''
            ORDER BY categorie ASC
        """)

        categories = cursor.fetchall()

        # =====================================================
        # TOTAL ENTRÉES FC
        # =====================================================

        cursor.execute("""
            SELECT COALESCE(SUM(montant), 0) AS total
            FROM transactions_financieres
            WHERE type = 'entree'
              AND devise = 'FC'
        """)

        entree_fc = cursor.fetchone()

        # =====================================================
        # TOTAL SORTIES FC
        # =====================================================

        cursor.execute("""
            SELECT COALESCE(SUM(montant), 0) AS total
            FROM transactions_financieres
            WHERE type = 'sortie'
              AND devise = 'FC'
        """)

        sortie_fc = cursor.fetchone()

        # =====================================================
        # TOTAL ENTRÉES USD
        # =====================================================

        cursor.execute("""
            SELECT COALESCE(SUM(montant), 0) AS total
            FROM transactions_financieres
            WHERE type = 'entree'
              AND devise = 'USD'
        """)

        entree_usd = cursor.fetchone()

        # =====================================================
        # TOTAL SORTIES USD
        # =====================================================

        cursor.execute("""
            SELECT COALESCE(SUM(montant), 0) AS total
            FROM transactions_financieres
            WHERE type = 'sortie'
              AND devise = 'USD'
        """)

        sortie_usd = cursor.fetchone()

        # =====================================================
        # CONVERSION
        # =====================================================

        entree_fc_total = float(
            entree_fc["total"] or 0
        )

        sortie_fc_total = float(
            sortie_fc["total"] or 0
        )

        entree_usd_total = float(
            entree_usd["total"] or 0
        )

        sortie_usd_total = float(
            sortie_usd["total"] or 0
        )

        # =====================================================
        # SOLDES
        # =====================================================

        solde_fc = (
            entree_fc_total
            - sortie_fc_total
        )

        solde_usd = (
            entree_usd_total
            - sortie_usd_total
        )

        # =====================================================
        # ENTRÉES DU JOUR
        # =====================================================

        cursor.execute("""
            SELECT
                devise,
                COALESCE(SUM(montant), 0) AS total
            FROM transactions_financieres
            WHERE type = 'entree'
              AND date_transaction >= CURRENT_DATE
            GROUP BY devise
            ORDER BY devise
        """)

        entrees_jour = cursor.fetchall()

        # =====================================================
        # SORTIES DU JOUR
        # =====================================================

        cursor.execute("""
            SELECT
                devise,
                COALESCE(SUM(montant), 0) AS total
            FROM transactions_financieres
            WHERE type = 'sortie'
              AND date_transaction >= CURRENT_DATE
            GROUP BY devise
            ORDER BY devise
        """)

        sorties_jour = cursor.fetchall()

        # =====================================================
        # ENTRÉES DE LA SEMAINE
        # =====================================================

        cursor.execute("""
            SELECT
                devise,
                COALESCE(SUM(montant), 0) AS total
            FROM transactions_financieres
            WHERE type = 'entree'
              AND date_transaction >= date_trunc(
                    'week',
                    CURRENT_TIMESTAMP
              )
            GROUP BY devise
            ORDER BY devise
        """)

        entrees_semaine = cursor.fetchall()

        # =====================================================
        # SORTIES DE LA SEMAINE
        # =====================================================

        cursor.execute("""
            SELECT
                devise,
                COALESCE(SUM(montant), 0) AS total
            FROM transactions_financieres
            WHERE type = 'sortie'
              AND date_transaction >= date_trunc(
                    'week',
                    CURRENT_TIMESTAMP
              )
            GROUP BY devise
            ORDER BY devise
        """)

        sorties_semaine = cursor.fetchall()

        # =====================================================
        # ENTRÉES DU MOIS
        # =====================================================

        cursor.execute("""
            SELECT
                devise,
                COALESCE(SUM(montant), 0) AS total
            FROM transactions_financieres
            WHERE type = 'entree'
              AND date_transaction >= date_trunc(
                    'month',
                    CURRENT_TIMESTAMP
              )
            GROUP BY devise
            ORDER BY devise
        """)

        entrees_mois = cursor.fetchall()

        # =====================================================
        # SORTIES DU MOIS
        # =====================================================

        cursor.execute("""
            SELECT
                devise,
                COALESCE(SUM(montant), 0) AS total
            FROM transactions_financieres
            WHERE type = 'sortie'
              AND date_transaction >= date_trunc(
                    'month',
                    CURRENT_TIMESTAMP
              )
            GROUP BY devise
            ORDER BY devise
        """)

        sorties_mois = cursor.fetchall()

        # =====================================================
        # DERNIÈRES TRANSACTIONS
        # =====================================================

        cursor.execute("""
            SELECT
                id,
                type,
                categorie,
                description,
                montant,
                devise,
                date_transaction,
                utilisateur
            FROM transactions_financieres
            ORDER BY
                date_transaction DESC,
                id DESC
            LIMIT 10
        """)

        dernieres_transactions = cursor.fetchall()

        # =====================================================
        # AFFICHAGE
        # =====================================================

        return render_template(
            "finances.html",

            transactions=transactions,

            dernieres_transactions=dernieres_transactions,

            categories=categories,

            # Totaux
            entree_fc=entree_fc_total,
            sortie_fc=sortie_fc_total,

            entree_usd=entree_usd_total,
            sortie_usd=sortie_usd_total,

            # Soldes
            solde_fc=solde_fc,
            solde_usd=solde_usd,

            # Jour
            entrees_jour=entrees_jour,
            sorties_jour=sorties_jour,

            # Semaine
            entrees_semaine=entrees_semaine,
            sorties_semaine=sorties_semaine,

            # Mois
            entrees_mois=entrees_mois,
            sorties_mois=sorties_mois,

            # Filtres
            type_filtre=type_filtre,
            categorie_filtre=categorie_filtre,
            devise_filtre=devise_filtre,
            date_debut=date_debut,
            date_fin=date_fin
        )

    except Exception as e:

        conn.rollback()

        print(
            "ERREUR FINANCES :",
            e
        )

        flash(
            f"Erreur lors du chargement des finances : {e}",
            "danger"
        )

        return render_template(
            "finances.html",

            transactions=[],
            dernieres_transactions=[],
            categories=[],

            entree_fc=0,
            sortie_fc=0,

            entree_usd=0,
            sortie_usd=0,

            solde_fc=0,
            solde_usd=0,

            entrees_jour=[],
            sorties_jour=[],

            entrees_semaine=[],
            sorties_semaine=[],

            entrees_mois=[],
            sorties_mois=[],

            type_filtre="",
            categorie_filtre="",
            devise_filtre="",
            date_debut="",
            date_fin=""
        )

    finally:

        cursor.close()
        conn.close()
@app.route("/historique-finance")
@login_required
def historique_finance():
    # récupérer les opérations depuis PostgreSQL
    return render_template(
        "historique_finance.html",
        operations=operations
    )


if __name__ == "__main__":

    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )
