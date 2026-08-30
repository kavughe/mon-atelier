
// ==========================================
// MON ATELIER - SYSTEME DE CONNEXION
// ADMIN + RECEPTION + CONSULTATION
// ==========================================


// ==========================================
// ELEMENTS
// ==========================================

const formConnexion =
    document.getElementById("formConnexion");

const motDePasse =
    document.getElementById("motDePasse");

const voirMotDePasse =
    document.getElementById("voirMotDePasse");

const messageConnexion =
    document.getElementById("messageConnexion");


// ==========================================
// COMPTES PAR DEFAUT
// ==========================================
//
// Ces comptes sont utilisés uniquement si
// aucun compte n'a encore été enregistré.
// ==========================================

const comptesDefaut = [

    {
        utilisateur: "admin",
        motDePasse: "1234",
        role: "admin"
    },

    {
        utilisateur: "reception",
        motDePasse: "1234",
        role: "reception"
    },

    {
        utilisateur: "consultation",
        motDePasse: "1234",
        role: "consultation"
    }

];


// ==========================================
// RECUPERER LES COMPTES
// ==========================================

function getComptes() {

    const comptes =
        localStorage.getItem(
            "monAtelierComptes"
        );


    if (comptes) {

        try {

            return JSON.parse(comptes);

        } catch (erreur) {

            console.error(
                "Erreur dans les comptes :",
                erreur
            );

        }

    }


    // Première utilisation
    // Enregistrer les comptes par défaut

    localStorage.setItem(
        "monAtelierComptes",
        JSON.stringify(comptesDefaut)
    );


    return comptesDefaut;
}


// ==========================================
// AFFICHER / CACHER MOT DE PASSE
// ==========================================

if (voirMotDePasse && motDePasse) {

    voirMotDePasse.addEventListener(
        "click",
        function () {

            if (
                motDePasse.type ===
                "password"
            ) {

                motDePasse.type =
                    "text";

                voirMotDePasse.textContent =
                    "🙈";

            } else {

                motDePasse.type =
                    "password";

                voirMotDePasse.textContent =
                    "👁️";

            }

        }
    );

}


// ==========================================
// CONNEXION
// ==========================================

if (formConnexion) {

    formConnexion.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            // ==================================
            // RECUPERER LES CHAMPS
            // ==================================

            const utilisateur =
                document
                    .getElementById(
                        "nomUtilisateur"
                    )
                    .value
                    .trim()
                    .toLowerCase();


            const motDePasseSaisi =
                motDePasse.value;


            // ==================================
            // RECUPERER LES COMPTES
            // ==================================

            const comptes =
                getComptes();


            // ==================================
            // CHERCHER L'UTILISATEUR
            // ==================================

            const compte =
                comptes.find(
                    function (item) {

                        return (
                            item.utilisateur
                                .toLowerCase() ===
                            utilisateur
                        );

                    }
                );


            // ==================================
            // UTILISATEUR INCONNU
            // ==================================

            if (!compte) {

                afficherErreur(
                    "❌ Nom d'utilisateur ou mot de passe incorrect."
                );

                return;
            }


            // ==================================
            // VERIFIER LE MOT DE PASSE
            // ==================================

            if (
                motDePasseSaisi !==
                compte.motDePasse
            ) {

                afficherErreur(
                    "❌ Nom d'utilisateur ou mot de passe incorrect."
                );

                return;
            }


            // ==================================
            // VERIFIER LE ROLE
            // ==================================

            if (
                compte.role !== "admin" &&
                compte.role !== "reception" &&
                compte.role !== "consultation"
            ) {

                afficherErreur(
                    "❌ Le rôle de ce compte est invalide."
                );

                return;
            }


            // ==================================
            // CONNEXION REUSSIE
            // ==================================

            sessionStorage.setItem(
                "monAtelierConnecte",
                "true"
            );


            // Nom utilisateur

            sessionStorage.setItem(
                "monAtelierUtilisateur",
                compte.utilisateur
            );


            // Rôle

            sessionStorage.setItem(
                "monAtelierRole",
                compte.role
            );


            // ==================================
            // MESSAGE
            // ==================================

            if (messageConnexion) {

                let nomRole = "";


                if (compte.role === "admin") {

                    nomRole =
                        "Administrateur";

                } else if (
                    compte.role === "reception"
                ) {

                    nomRole =
                        "Réception";

                } else {

                    nomRole =
                        "Consultation";

                }


                messageConnexion.textContent =
                    "✅ Connexion réussie — " +
                    nomRole;


                messageConnexion.className =
                    "message-connexion success";

            }


            // ==================================
            // REDIRECTION
            // ==================================

            setTimeout(
                function () {

                    window.location.replace(
                        "index.html"
                    );

                },
                500
            );

        }
    );

}


// ==========================================
// AFFICHER UNE ERREUR
// ==========================================

function afficherErreur(message) {

    if (messageConnexion) {

        messageConnexion.textContent =
            message;

        messageConnexion.className =
            "message-connexion error";

    }


    if (motDePasse) {

        motDePasse.value = "";

        motDePasse.focus();

    }

}
