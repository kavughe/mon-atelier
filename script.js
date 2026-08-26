// ==========================================
// MON ATELIER - REPARATIONS
// ==========================================

const formulaire = document.getElementById("formulaireReparation");
const liste = document.getElementById("listeReparations");
const recherche = document.getElementById("recherche");

let reparations = JSON.parse(
    localStorage.getItem("mesReparations")
) || [];


// ==========================================
// AFFICHER LA LISTE
// ==========================================

function afficherReparations(donnees = reparations) {

    if (!liste) return;

    liste.innerHTML = "";

    donnees.forEach(function(item) {

        const ligne = document.createElement("tr");

        ligne.innerHTML = `
            <td>${item.numero}</td>
            <td>${item.date}</td>
            <td>${item.client}</td>
            <td>${item.telephone}</td>
            <td>${item.appareil}</td>
            <td>${item.marque}</td>
            <td>${item.panne}</td>
            <td>${item.prix} $</td>
            <td>${item.statut}</td>
        `;

        // Sélection de la réparation
        ligne.addEventListener("click", function() {

            const index = reparations.indexOf(item);

            if (index === -1) return;

            window.reparationSelectionnee = index;

            document.getElementById("client").value =
                item.client;

            document.getElementById("telephone").value =
                item.telephone;

            document.getElementById("appareil").value =
                item.appareil;

            document.getElementById("marque").value =
                item.marque;

            document.getElementById("panne").value =
                item.panne;

            document.getElementById("prix").value =
                item.prix;

            document.getElementById("statut").value =
                item.statut;

            document.querySelectorAll("#listeReparations tr")
                .forEach(function(tr) {
                    tr.classList.remove("selection");
                });

            ligne.classList.add("selection");

        });

        liste.appendChild(ligne);

    });
}


// ==========================================
// ENREGISTRER UN APPAREIL
// ==========================================

if (formulaire) {

    formulaire.addEventListener("submit", function(event) {

        event.preventDefault();

        const client =
            document.getElementById("client").value.trim();

        const telephone =
            document.getElementById("telephone").value.trim();

        const appareil =
            document.getElementById("appareil").value;

        const marque =
            document.getElementById("marque").value.trim();

        const panne =
            document.getElementById("panne").value.trim();

        const prix =
            document.getElementById("prix").value;

        const statut =
            document.getElementById("statut").value;


        // Vérification

        if (
            client === "" ||
            telephone === "" ||
            appareil === "" ||
            marque === "" ||
            panne === ""
        ) {

            alert("Veuillez remplir tous les champs obligatoires.");

            return;
        }


        // Nouvel appareil

        const nouvelAppareil = {

    numero: reparations.length + 1,

    date: new Date().toLocaleDateString("fr-FR"),

    client: client,

    telephone: telephone,

    appareil: appareil,

    marque: marque,

    panne: panne,

    prix: prix || "0",

    acompte:
        document.getElementById("acompte").value || "0",

    reste:
        document.getElementById("reste").value || "0",

    statut: statut

};


        // Ajouter dans la liste

        reparations.push(nouvelAppareil);
        // Ajouter l'acompte dans Finance

if (acompte > 0) {

    let operationsFinance = JSON.parse(
        localStorage.getItem("operationsFinance")
    ) || [];

    const maintenant = new Date();

    const annee = maintenant.getFullYear();

    const mois = String(
        maintenant.getMonth() + 1
    ).padStart(2, "0");

    const jour = String(
        maintenant.getDate()
    ).padStart(2, "0");


    operationsFinance.push({

        date: `${annee}-${mois}-${jour}`,

        type: "entrée",

        description:
            "Acompte réparation - " + client,

        montant: Number(acompte)

    });


    localStorage.setItem(
        "operationsFinance",
        JSON.stringify(operationsFinance)
    );

}
        // ENREGISTRER LE PAIEMENT DANS FINANCE

if (acompte > 0) {

    let operationsFinance =
        JSON.parse(
            localStorage.getItem("operationsFinance")
        ) || [];

    const maintenant = new Date();

    const annee =
        maintenant.getFullYear();

    const mois =
        String(maintenant.getMonth() + 1)
            .padStart(2, "0");

    const jour =
        String(maintenant.getDate())
            .padStart(2, "0");

    operationsFinance.push({

        date: `${annee}-${mois}-${jour}`,

        type: "entrée",

        description:
            "Acompte - " + client,

        montant: acompte

    });

    localStorage.setItem(
        "operationsFinance",
        JSON.stringify(operationsFinance)
    );
}
        // Ajouter automatiquement l'acompte dans Finance
if (acompte > 0) {

    let operations =
        JSON.parse(
            localStorage.getItem("operationsFinance")
        ) || [];

    operations.push({

        date: dateAujourdHuiFinance(),

        type: "entrée",

        description:
            "Acompte réparation - " + client,

        montant: acompte

    });

    localStorage.setItem(
        "operationsFinance",
        JSON.stringify(operations)
    );
}


        // Sauvegarder

        localStorage.setItem(
            "mesReparations",
            JSON.stringify(reparations)
        );


        // Actualiser la liste

        afficherReparations();


        // Vider le formulaire

        formulaire.reset();


        // Message

        const message =
            document.getElementById("messageReparation");

        if (message) {

            message.textContent =
                "✅ Appareil enregistré avec succès.";

        }

    });

}


// ==========================================
// RECHERCHE
// ==========================================

if (recherche) {

    recherche.addEventListener("input", function() {

        const texte =
            recherche.value.toLowerCase().trim();


        const resultats =
            reparations.filter(function(item) {

                return (

                    item.client.toLowerCase().includes(texte) ||

                    item.telephone.toLowerCase().includes(texte) ||

                    item.appareil.toLowerCase().includes(texte) ||

                    item.marque.toLowerCase().includes(texte) ||

                    item.panne.toLowerCase().includes(texte) ||

                    item.statut.toLowerCase().includes(texte)

                );

            });


        afficherReparations(resultats);

    });

}


// ==========================================
// AFFICHAGE AU CHARGEMENT
// ==========================================

afficherReparations();
const btnModifier =
    document.getElementById("btnModifier");

if (btnModifier) {

    btnModifier.addEventListener("click", function() {

        const index =
            window.reparationSelectionnee;

        if (index === undefined) {

            alert(
                "Sélectionnez d'abord une réparation dans la liste."
            );

            return;
        }

        reparations[index].client =
            document.getElementById("client").value.trim();

        reparations[index].telephone =
            document.getElementById("telephone").value.trim();

        reparations[index].appareil =
            document.getElementById("appareil").value;

        reparations[index].marque =
            document.getElementById("marque").value.trim();

        reparations[index].panne =
            document.getElementById("panne").value.trim();

        reparations[index].prix =
            document.getElementById("prix").value;

        reparations[index].statut =
            document.getElementById("statut").value;


        localStorage.setItem(
            "mesReparations",
            JSON.stringify(reparations)
        );


        afficherReparations();


        document.getElementById(
            "formulaireReparation"
        ).reset();


        window.reparationSelectionnee = undefined;


        alert(
            "✅ Réparation modifiée avec succès."
        );

    });

}
const btnEffacer =
    document.getElementById("btnEffacer");

if (btnEffacer) {

    btnEffacer.addEventListener("click", function() {

        const index =
            window.reparationSelectionnee;


        // Aucune réparation sélectionnée

        if (index === undefined) {

            alert(
                "⚠️ Sélectionnez d'abord une réparation."
            );

            return;
        }


        // Confirmation

        const confirmation = confirm(
            "Voulez-vous vraiment supprimer cette réparation ?"
        );


        if (!confirmation) {
            return;
        }


        // Suppression

        reparations.splice(index, 1);


        // Renumérotation

        reparations.forEach(function(item, i) {

            item.numero = i + 1;

        });


        // Sauvegarde

        localStorage.setItem(
            "mesReparations",
            JSON.stringify(reparations)
        );


        // Actualiser la liste

        afficherReparations();


        // Vider le formulaire

        document.getElementById(
            "formulaireReparation"
        ).reset();


        window.reparationSelectionnee =
            undefined;


        // Message

        const message =
            document.getElementById(
                "messageReparation"
            );

        if (message) {

            message.textContent =
                "🗑️ Réparation supprimée avec succès.";

        }

    });

}
const champPrix =
    document.getElementById("prix");

const champAcompte =
    document.getElementById("acompte");

const champReste =
    document.getElementById("reste");


function calculerReste() {

    const prix =
        parseFloat(champPrix.value) || 0;

    const acompte =
        parseFloat(champAcompte.value) || 0;


    let reste =
        prix - acompte;


    if (reste < 0) {
        reste = 0;
    }


    champReste.value =
        reste.toFixed(2);
}


if (champPrix && champAcompte) {

    champPrix.addEventListener(
        "input",
        calculerReste
    );

    champAcompte.addEventListener(
        "input",
        calculerReste
    );

}
function dateAujourdHuiFinance() {

    const maintenant = new Date();

    const jour =
        String(maintenant.getDate())
            .padStart(2, "0");

    const mois =
        String(maintenant.getMonth() + 1)
            .padStart(2, "0");

    const annee =
        maintenant.getFullYear();

    return `${annee}-${mois}-${jour}`;
}