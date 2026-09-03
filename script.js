// ==========================================
// MON ATELIER - SCRIPT PRINCIPAL
// ==========================================


// ==========================================
// MENU MOBILE
// ==========================================

function ouvrirMenu() {
    const menu = document.getElementById("menu");

    if (menu) {
        menu.classList.toggle("active");
    }
}


// ==========================================
// DONNÉES
// ==========================================

// Récupérer les clients
function getClients() {
    return JSON.parse(localStorage.getItem("clients")) || [];
}


// Récupérer les réparations
function getReparations() {
    return JSON.parse(localStorage.getItem("reparations")) || [];
}


// Sauvegarder les clients
function sauvegarderClients(clients) {
    localStorage.setItem("clients", JSON.stringify(clients));
}


// Sauvegarder les réparations
function sauvegarderReparations(reparations) {
    localStorage.setItem(
        "reparations",
        JSON.stringify(reparations)
    );
}


// ==========================================
// FORMATAGE DES MONTANTS
// ==========================================

function formatMontant(montant) {

    montant = Number(montant) || 0;

    return montant.toLocaleString("fr-FR") + " FC";
}


// ==========================================
// CALCUL DES STATISTIQUES
// ==========================================

function afficherStatistiques() {

    const clients = getClients();
    const reparations = getReparations();

    // Nombre de clients
    const nombreClients =
        document.getElementById("nombreClients");

    if (nombreClients) {
        nombreClients.textContent = clients.length;
    }


    // Nombre de réparations
    const nombreReparations =
        document.getElementById("nombreReparations");

    if (nombreReparations) {
        nombreReparations.textContent =
            reparations.length;
    }


    // Total payé
    let montantTotal = 0;

    reparations.forEach(function(reparation) {

        montantTotal +=
            Number(reparation.paye) || 0;

    });


    const totalElement =
        document.getElementById("montantTotal");

    if (totalElement) {
        totalElement.textContent =
            formatMontant(montantTotal);
    }


    // Total restant
    let montantRestant = 0;

    reparations.forEach(function(reparation) {

        const prix =
            Number(reparation.prix) || 0;

        const paye =
            Number(reparation.paye) || 0;

        montantRestant +=
            Math.max(prix - paye, 0);

    });


    const restantElement =
        document.getElementById("montantRestant");

    if (restantElement) {
        restantElement.textContent =
            formatMontant(montantRestant);
    }
}


// ==========================================
// DERNIÈRES RÉPARATIONS
// ==========================================

function afficherDernieresReparations() {

    const zone =
        document.getElementById(
            "dernieresReparations"
        );

    if (!zone) {
        return;
    }


    const reparations = getReparations();


    if (reparations.length === 0) {

        zone.innerHTML = `
            <p class="empty">
                Aucune réparation enregistrée.
            </p>
        `;

        return;
    }


    // Les plus récentes en premier
    const recentes =
        reparations.slice(-5).reverse();


    zone.innerHTML = "";


    recentes.forEach(function(reparation) {

        const prix =
            Number(reparation.prix) || 0;

        const paye =
            Number(reparation.paye) || 0;

        const reste =
            Math.max(prix - paye, 0);


        const element =
            document.createElement("div");

        element.style.padding = "15px";
        element.style.borderBottom =
            "1px solid #eee";


        element.innerHTML = `
            <strong>
                ${reparation.client || "Client inconnu"}
            </strong>

            <br>

            <span>
                ${reparation.appareil || "Appareil"}
            </span>

            <br>

            <small>
                Prix : ${formatMontant(prix)}
                |
                Payé : ${formatMontant(paye)}
                |
                Reste : ${formatMontant(reste)}
            </small>
        `;


        zone.appendChild(element);

    });
}

// ==========================================
// CHARGER LES SERVICES DANS REPARATION
// ==========================================

function chargerServicesReparation() {

    const select =
        document.getElementById("service");

    if (!select) {
        return;
    }


    const services =
        JSON.parse(
            localStorage.getItem("services")
        ) || [];


    // Garder la première option

    select.innerHTML = `
        <option value="">
            Sélectionner un service
        </option>
    `;


    services.forEach(function(service) {

        const option =
            document.createElement("option");


        option.value =
            service.id;


        option.textContent =
            service.nom
            +
            " — "
            +
            Number(service.prix || 0)
                .toLocaleString("fr-FR")
            +
            " FC";


        option.dataset.prix =
            service.prix || 0;


        select.appendChild(option);

    });

}


// ==========================================
// SELECTIONNER UN SERVICE
// ==========================================

function selectionnerService() {

    const select =
        document.getElementById("service");


    const prix =
        document.getElementById("prix");


    if (!select || !prix) {
        return;
    }


    const option =
        select.options[
            select.selectedIndex
        ];


    if (!option) {
        return;
    }


    const montant =
        Number(
            option.dataset.prix
        ) || 0;


    if (montant > 0) {

        prix.value =
            montant;

        // Recalculer le reste

        if (
            typeof calculerReste ===
            "function"
        ) {

            calculerReste();

        }

    }

}



// ==========================================
// EVENEMENT SERVICE
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        chargerServicesReparation();


        const service =
            document.getElementById(
                "service"
            );


        if (service) {

            service.addEventListener(
                "change",
                selectionnerService
            );

        }

    }
);
// ==========================================
// SERVICES : CHOISIR OU ECRIRE
// ==========================================

function chargerServicesDansReparation() {

    const liste =
        document.getElementById(
            "listeServicesReparation"
        );

    if (!liste) {
        return;
    }


    const services =
        JSON.parse(
            localStorage.getItem("services")
        ) || [];


    liste.innerHTML = "";


    services.forEach(function(service) {

        const option =
            document.createElement("option");


        option.value =
            service.nom;


        /*
         * Le prix est affiché dans la liste
         * mais le service reste sélectionnable
         */

        option.label =
            Number(service.prix || 0)
                .toLocaleString("fr-FR")
            + " FC";


        liste.appendChild(option);

    });

}


// ==========================================
// REMPLIR AUTOMATIQUEMENT LE PRIX
// ==========================================

function prixServiceAutomatique() {

    const champService =
        document.getElementById("service");


    const champPrix =
        document.getElementById("prix");


    if (!champService || !champPrix) {
        return;
    }


    const nomService =
        champService.value.trim();


    const services =
        JSON.parse(
            localStorage.getItem("services")
        ) || [];


    const service =
        services.find(function(item) {

            return item.nom.toLowerCase()
                === nomService.toLowerCase();

        });


    // Si le service existe

    if (service) {

        champPrix.value =
            Number(service.prix) || 0;


        if (
            typeof calculerReste ===
            "function"
        ) {

            calculerReste();

        }

    }

}


// ==========================================
// INITIALISATION
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        chargerServicesDansReparation();


        const service =
            document.getElementById(
                "service"
            );


        if (service) {

            service.addEventListener(
                "change",
                prixServiceAutomatique
            );


            service.addEventListener(
                "input",
                prixServiceAutomatique
            );

        }

    }
);


// ==========================================
// DECONNEXION
// ==========================================

function deconnexion() {

    const confirmation = confirm(
        "Voulez-vous vraiment vous déconnecter ?"
    );

    if (!confirmation) {
        return;
    }

    // Supprimer la connexion
    sessionStorage.removeItem(
        "monAtelierConnecte"
    );

    // Retour à la connexion
    window.location.replace(
        "connexion.html"
    );
}

// ==========================================
// GESTION DES DROITS UTILISATEUR
// ==========================================

function appliquerPermissions() {

    const role =
        sessionStorage.getItem(
            "monAtelierRole"
        );


    if (!role) {
        return;
    }


    // ==========================================
    // ELEMENTS ADMIN UNIQUEMENT
    // ==========================================

    const elementsAdmin =
        document.querySelectorAll(
            ".admin-only"
        );


    elementsAdmin.forEach(function(element) {

        if (role !== "admin") {

            element.style.display = "none";

        }

    });


    // ==========================================
    // ELEMENTS ADMIN + RECEPTION
    // ==========================================

    const elementsModification =
        document.querySelectorAll(
            ".modification-only"
        );


    elementsModification.forEach(function(element) {

        if (
            role !== "admin" &&
            role !== "reception"
        ) {

            element.style.display = "none";

        }

    });


    // ==========================================
    // ELEMENTS CONSULTATION
    // ==========================================

    const elementsConsultation =
        document.querySelectorAll(
            ".consultation-only"
        );


    elementsConsultation.forEach(function(element) {

        if (role !== "consultation") {

            element.style.display = "none";

        }

    });


    // ==========================================
    // AFFICHER LE ROLE
    // ==========================================

    const roleElements =
        document.querySelectorAll(
            ".role-utilisateur"
        );


    roleElements.forEach(function(element) {

        if (role === "admin") {

            element.textContent =
                "Administrateur";

        } else if (role === "reception") {

            element.textContent =
                "Réception";

        } else {

            element.textContent =
                "Consultation";

        }

    });

}


// ==========================================
// INITIALISATION
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        appliquerPermissions();

    }
);
