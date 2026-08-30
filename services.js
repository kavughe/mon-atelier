
// ==========================================
// MON ATELIER - SERVICES
// ==========================================


// ==========================================
// RECUPERER LES SERVICES
// ==========================================

function getServices() {

    return JSON.parse(
        localStorage.getItem("services")
    ) || [];

}


// ==========================================
// SAUVEGARDER LES SERVICES
// ==========================================

function sauvegarderServices(services) {

    localStorage.setItem(
        "services",
        JSON.stringify(services)
    );

}


// ==========================================
// AFFICHER LES SERVICES
// ==========================================

function afficherServices() {

    const liste =
        document.getElementById("listeServices");

    if (!liste) {
        return;
    }


    const services =
        getServices();


    if (services.length === 0) {

        liste.innerHTML = `
            <div class="empty">
                Aucun service enregistré.
            </div>
        `;

        return;

    }


    liste.innerHTML = "";


    services.forEach(function(service) {

        const carte =
            document.createElement("div");

        carte.className = "service-card";


        carte.innerHTML = `

            <div class="service-icon">
                ${service.icone || "🛠️"}
            </div>

            <div class="service-content">

                <h3>
                    ${service.nom}
                </h3>

                <p>
                    ${service.description || ""}
                </p>

                <strong>
                    ${formatMontantService(service.prix)}
                </strong>

            </div>

            <div class="service-actions">

                <button
                    class="btn-edit"
                    onclick="modifierService('${service.id}')">

                    ✏️ Modifier

                </button>

                <button
                    class="btn-delete"
                    onclick="supprimerService('${service.id}')">

                    🗑️ Supprimer

                </button>

            </div>

        `;


        liste.appendChild(carte);

    });

}


// ==========================================
// FORMAT MONTANT
// ==========================================

function formatMontantService(montant) {

    return (
        Number(montant) || 0
    ).toLocaleString("fr-FR") + " FC";

}


// ==========================================
// AJOUTER UN SERVICE
// ==========================================

function ajouterService() {

    const nom =
        document.getElementById("nomService").value.trim();


    const description =
        document.getElementById("descriptionService").value.trim();


    const prix =
        Number(
            document.getElementById("prixService").value
        ) || 0;


    const icone =
        document.getElementById("iconeService").value.trim();


    if (!nom) {

        alert(
            "Veuillez entrer le nom du service."
        );

        return;

    }


    const services =
        getServices();


    const nouveauService = {

        id:
            Date.now().toString(),

        nom:
            nom,

        description:
            description,

        prix:
            prix,

        icone:
            icone || "🛠️"

    };


    services.push(
        nouveauService
    );


    sauvegarderServices(
        services
    );


    document.getElementById(
        "formService"
    ).reset();


    afficherServices();


    alert(
        "Service ajouté avec succès !"
    );

}


// ==========================================
// MODIFIER UN SERVICE
// ==========================================

function modifierService(id) {

    const services =
        getServices();


    const service =
        services.find(function(item) {

            return item.id === id;

        });


    if (!service) {
        return;
    }


    const nouveauNom =
        prompt(
            "Nom du service :",
            service.nom
        );


    if (nouveauNom === null) {
        return;
    }


    const nouveauPrix =
        prompt(
            "Prix du service :",
            service.prix
        );


    if (nouveauPrix === null) {
        return;
    }


    service.nom =
        nouveauNom.trim();


    service.prix =
        Number(nouveauPrix) || 0;


    sauvegarderServices(
        services
    );


    afficherServices();


    alert(
        "Service modifié avec succès !"
    );

}


// ==========================================
// SUPPRIMER UN SERVICE
// ==========================================

function supprimerService(id) {

    const confirmation =
        confirm(
            "Voulez-vous vraiment supprimer ce service ?"
        );


    if (!confirmation) {
        return;
    }


    let services =
        getServices();


    services =
        services.filter(function(service) {

            return service.id !== id;

        });


    sauvegarderServices(
        services
    );


    afficherServices();


    alert(
        "Service supprimé avec succès !"
    );

}


// ==========================================
// INITIALISATION
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        afficherServices();

    }
);
