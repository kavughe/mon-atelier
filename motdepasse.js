
// ==========================================
// MON ATELIER - CHANGEMENT DE MOT DE PASSE
// ADMIN + RECEPTION + CONSULTATION
// ==========================================


// ==========================================
// COMPTES PAR DEFAUT
// ==========================================

const comptesParDefaut = [

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

function recupererComptes() {

    const donnees =
        localStorage.getItem(
            "monAtelierComptes"
        );


    if (!donnees) {

        localStorage.setItem(
            "monAtelierComptes",
            JSON.stringify(comptesParDefaut)
        );

        return comptesParDefaut;
    }


    try {

        return JSON.parse(donnees);

    } catch (erreur) {

        console.error(
            "Erreur lors de la lecture des comptes :",
            erreur
        );

        localStorage.setItem(
            "monAtelierComptes",
            JSON.stringify(comptesParDefaut)
        );

        return comptesParDefaut;
    }

}


// ==========================================
// AFFICHER / CACHER MOT DE PASSE
// ==========================================

function afficherMotDePasse(id, bouton) {

    const champ =
        document.getElementById(id);


    if (!champ) {
        return;
    }


    if (champ.type === "password") {

        champ.type = "text";

        if (bouton) {
            bouton.textContent = "🙈";
        }

    } else {

        champ.type = "password";

        if (bouton) {
            bouton.textContent = "👁️";
        }

    }

}


// ==========================================
// AFFICHER LE COMPTE CONNECTE
// ==========================================

function afficherUtilisateurConnecte() {

    const utilisateur =
        sessionStorage.getItem(
            "monAtelierUtilisateur"
        );

    const role =
        sessionStorage.getItem(
            "monAtelierRole"
        );


    const elementUtilisateur =
        document.getElementById(
            "utilisateurConnecte"
        );


    const elementRole =
        document.getElementById(
            "roleConnecte"
        );


    if (elementUtilisateur) {

        elementUtilisateur.textContent =
            utilisateur || "admin";

    }


    if (elementRole) {

        if (role === "admin") {

            elementRole.textContent =
                "Administrateur";

        } else if (role === "reception") {

            elementRole.textContent =
                "Réception";

        } else if (role === "consultation") {

            elementRole.textContent =
                "Consultation";

        } else {

            elementRole.textContent =
                "Utilisateur";

        }

    }

}


// ==========================================
// FORMULAIRE
// ==========================================

const formMotDePasse =
    document.getElementById(
        "formMotDePasse"
    );


if (formMotDePasse) {

    formMotDePasse.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            // ==================================
            // RECUPERER LES CHAMPS
            // ==================================

            const ancien =
                document.getElementById(
                    "ancienMotDePasse"
                ).value;


            const nouveau =
                document.getElementById(
                    "nouveauMotDePasse"
                ).value;


            const confirmation =
                document.getElementById(
                    "confirmationMotDePasse"
                ).value;


            const message =
                document.getElementById(
                    "messageMotDePasse"
                );


            // ==================================
            // UTILISATEUR CONNECTE
            // ==================================

            const utilisateur =
                sessionStorage.getItem(
                    "monAtelierUtilisateur"
                );


            const role =
                sessionStorage.getItem(
                    "monAtelierRole"
                );


            // ==================================
            // VERIFIER LA CONNEXION
            // ==================================

            if (!utilisateur) {

                if (message) {

                    message.textContent =
                        "❌ Aucun utilisateur connecté.";

                    message.className =
                        "password-message error";

                }

                return;
            }


            // ==================================
            // RECUPERER LES COMPTES
            // ==================================

            const comptes =
                recupererComptes();


            // ==================================
            // TROUVER LE COMPTE
            // ==================================

            const index =
                comptes.findIndex(
                    function(compte) {

                        return (
                            compte.utilisateur
                                .toLowerCase() ===
                            utilisateur.toLowerCase()
                        );

                    }
                );


            if (index === -1) {

                if (message) {

                    message.textContent =
                        "❌ Compte introuvable.";

                    message.className =
                        "password-message error";

                }

                return;
            }


            const compte =
                comptes[index];


            // ==================================
            // VERIFIER L'ANCIEN MOT DE PASSE
            // ==================================

            if (ancien !== compte.motDePasse) {

                if (message) {

                    message.textContent =
                        "❌ Ancien mot de passe incorrect.";

                    message.className =
                        "password-message error";

                }

                return;
            }


            // ==================================
            // VERIFIER LE NOUVEAU MOT DE PASSE
            // ==================================

            if (nouveau.length < 4) {

                if (message) {

                    message.textContent =
                        "❌ Le nouveau mot de passe doit contenir au moins 4 caractères.";

                    message.className =
                        "password-message error";

                }

                return;
            }


            // ==================================
            // CONFIRMATION
            // ==================================

            if (nouveau !== confirmation) {

                if (message) {

                    message.textContent =
                        "❌ Les deux mots de passe ne correspondent pas.";

                    message.className =
                        "password-message error";

                }

                return;
            }


            // ==================================
            // VERIFIER DIFFERENCE
            // ==================================

            if (nouveau === ancien) {

                if (message) {

                    message.textContent =
                        "❌ Le nouveau mot de passe doit être différent de l'ancien.";

                    message.className =
                        "password-message error";

                }

                return;
            }


            // ==================================
            // MODIFIER LE MOT DE PASSE
            // ==================================

            comptes[index].motDePasse =
                nouveau;


            // Conserver le rôle

            comptes[index].role =
                compte.role || role;


            // ==================================
            // SAUVEGARDER
            // ==================================

            localStorage.setItem(
                "monAtelierComptes",
                JSON.stringify(comptes)
            );


            // ==================================
            // VERIFICATION
            // ==================================

            const verification =
                localStorage.getItem(
                    "monAtelierComptes"
                );


            if (!verification) {

                if (message) {

                    message.textContent =
                        "❌ Erreur lors de l'enregistrement.";

                    message.className =
                        "password-message error";

                }

                return;
            }


            // ==================================
            // SUCCES
            // ==================================

            if (message) {

                message.textContent =
                    "✅ Mot de passe modifié avec succès !";

                message.className =
                    "password-message success";

            }


            // Vider le formulaire

            formMotDePasse.reset();

        }
    );

}


// ==========================================
// INITIALISATION
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        afficherUtilisateurConnecte();

    }
);
