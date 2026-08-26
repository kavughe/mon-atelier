// =================================
// 1. MENU
// =================================

const boutonMenu = document.getElementById("menuBouton");
const menu = document.getElementById("menu");

if (boutonMenu && menu) {

    boutonMenu.addEventListener("click", function() {

        if (menu.style.display === "flex") {
            menu.style.display = "none";
        } else {
            menu.style.display = "flex";
        }

    });

}


// =================================
// 2. BOUTON "CLIQUEZ ICI"
// =================================

const boutonBienvenue =
    document.getElementById("boutonBienvenue");

const messageBienvenue =
    document.getElementById("messageBienvenue");

if (boutonBienvenue && messageBienvenue) {

    boutonBienvenue.addEventListener("click", function() {

        messageBienvenue.textContent =
            "Merci de visiter MON ATELIER !";

    });

}


// =================================
// 3. FORMULAIRE
// =================================

const formulaire =
    document.getElementById("formulaireContact");

if (formulaire) {

    formulaire.addEventListener("submit", function(event) {

        event.preventDefault();

        const nom =
            document.getElementById("nom").value;

        const email =
            document.getElementById("email").value;

        const telephone =
            document.getElementById("telephone").value;

        const message =
            document.getElementById("message").value;

        const resultat =
            document.getElementById("resultat");


        if (
            nom === "" ||
            email === "" ||
            telephone === "" ||
            message === ""
        ) {

            resultat.textContent =
                "Veuillez remplir tous les champs.";

            return;
        }
        // Vérification de l'email

if (!email.includes("@") || !email.includes(".")) {

    resultat.textContent =
        "Veuillez entrer une adresse email valide.";

    return;
}
// Vérification du téléphone

if (isNaN(telephone)) {

    resultat.textContent =
        "Veuillez entrer un numéro de téléphone valide.";

    return;
}

       resultat.textContent =
    "Préparation du message WhatsApp...";

const monNumero = "243977133845";

const texteWhatsApp =
    "Bonjour MON ATELIER !%0A%0A" +
    "Nom : " + nom + "%0A" +
    "Email : " + email + "%0A" +
    "Téléphone : " + telephone + "%0A" +
    "Message : " + message;

const lienWhatsApp =
    "https://wa.me/" + monNumero +
    "?text=" + texteWhatsApp;

window.open(lienWhatsApp, "_blank");

    });

}
// =================================
// DATE ET HEURE
// =================================

const dateHeure = document.getElementById("dateHeure");

if (dateHeure) {

    function afficherDateHeure() {

        const maintenant = new Date();

        dateHeure.textContent =
            maintenant.toLocaleString("fr-FR");

    }

    afficherDateHeure();

    setInterval(afficherDateHeure, 1000);
}
// ===============================
// MODE SOMBRE / MODE CLAIR
// ===============================

const modeBouton = document.getElementById("modeBouton");

if (modeBouton) {

    modeBouton.addEventListener("click", function() {

        document.body.classList.toggle("mode-sombre");

        if (document.body.classList.contains("mode-sombre")) {
            modeBouton.textContent = "☀️ Mode clair";
        } else {
            modeBouton.textContent = "🌙 Mode sombre";
        }

    });

}