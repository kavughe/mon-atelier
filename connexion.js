// =====================================
// CONNEXION MON ATELIER
// =====================================

const formConnexion = document.getElementById("formConnexion");

if (formConnexion) {

    formConnexion.addEventListener("submit", function(event) {

        event.preventDefault();

        const utilisateur =
            document.getElementById("utilisateur").value.trim();

        const motDePasse =
            document.getElementById("motDePasse").value;

        const erreur =
            document.getElementById("erreurConnexion");


        // ADMINISTRATEUR
        if (utilisateur === "admin" && motDePasse === "1234") {

            sessionStorage.setItem("accesReparation", "autorise");
            sessionStorage.setItem("role", "admin");

            window.location.href = "reparation.html";

            return;
        }


        // RÉCEPTION
        if (utilisateur === "reception" && motDePasse === "5678") {

            sessionStorage.setItem("accesReparation", "autorise");
            sessionStorage.setItem("role", "reception");

            window.location.href = "reparation.html";

            return;
        }


        // CONSULTATION
        if (utilisateur === "consultation" && motDePasse === "9999") {

            sessionStorage.setItem("accesReparation", "autorise");
            sessionStorage.setItem("role", "consultation");

            window.location.href = "reparation.html";

            return;
        }


        // ERREUR
        erreur.textContent =
            "❌ Nom d'utilisateur ou mot de passe incorrect.";

    });

}