
// ==========================================
// MON ATELIER - HISTORIQUE
// ==========================================


// ==========================================
// RECUPERER LES REPARATIONS
// ==========================================

function getReparationsHistorique() {

    return JSON.parse(
        localStorage.getItem("reparations")
    ) || [];

}


// ==========================================
// SAUVEGARDER
// ==========================================

function sauvegarderHistorique(reparations) {

    localStorage.setItem(
        "reparations",
        JSON.stringify(reparations)
    );

}


// ==========================================
// FORMAT MONTANT
// ==========================================

function formatMontantHistorique(montant) {

    return (
        Number(montant) || 0
    ).toLocaleString("fr-FR") + " FC";

}


// ==========================================
// FORMAT DATE
// ==========================================

function formatDateHistorique(date) {

    if (!date) {
        return "Date inconnue";
    }

    const d = new Date(date);

    if (isNaN(d.getTime())) {
        return "Date inconnue";
    }

    return d.toLocaleDateString(
        "fr-FR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}


// ==========================================
// AFFICHER L'HISTORIQUE
// ==========================================

function afficherHistorique() {

    const liste =
        document.getElementById(
            "listeHistorique"
        );

    if (!liste) {
        return;
    }


    const reparations =
        getReparationsHistorique();


    if (reparations.length === 0) {

        liste.innerHTML = `
            <div class="empty">
                📭 Aucune réparation enregistrée.
            </div>
        `;

        return;

    }


    liste.innerHTML = "";


    reparations
        .slice()
        .reverse()
        .forEach(function(reparation) {


            const prix =
                Number(reparation.prix) || 0;


            const paye =
                Number(reparation.paye) || 0;


            const reste =
                Math.max(
                    prix - paye,
                    0
                );


            const element =
                document.createElement("div");


            element.className =
                "historique-card";


            element.innerHTML = `

                <div class="historique-header">

                    <div>

                        <h3>
                            🔧
                            ${reparation.appareil || "Appareil"}
                        </h3>

                        <small>
                            📅
                            ${formatDateHistorique(
                                reparation.date
                            )}
                        </small>

                    </div>

                    <span class="statut-badge">
                        ${reparation.statut || "En attente"}
                    </span>

                </div>


                <div class="historique-info">

                    <p>
                        👤
                        <strong>Client :</strong>
                        ${reparation.client || "Inconnu"}
                    </p>


                    <p>
                        📞
                        <strong>Téléphone :</strong>
                        ${reparation.telephone || "Non renseigné"}
                    </p>


                    <p>
                        🛠️
                        <strong>Service :</strong>
                        ${reparation.service || "Non renseigné"}
                    </p>


                    <p>
                        🔍
                        <strong>Panne :</strong>
                        ${reparation.panne || "Non renseignée"}
                    </p>

                </div>


                <div class="historique-finance">

                    <div>

                        <span>Prix</span>

                        <strong>
                            ${formatMontantHistorique(prix)}
                        </strong>

                    </div>


                    <div>

                        <span>Payé</span>

                        <strong>
                            ${formatMontantHistorique(paye)}
                        </strong>

                    </div>


                    <div>

                        <span>Reste</span>

                        <strong>
                            ${formatMontantHistorique(reste)}
                        </strong>

                    </div>

                </div>


                <div class="historique-actions">

                    ${
                        reste > 0
                        ?

                        `
                        <button
                            class="btn-pay"
                            onclick="payerReste('${reparation.id}')">

                            💵 Payer le reste

                        </button>
                        `

                        :

                        `
                        <span class="paye-complet">
                            ✅ Entièrement payé
                        </span>
                        `
                    }


                    <button
                        class="btn-edit"
                        onclick="modifierReparation('${reparation.id}')">

                        ✏️ Modifier

                    </button>


                    <button
                        class="btn-delete"
                        onclick="supprimerReparation('${reparation.id}')">

                        🗑️ Supprimer

                    </button>

                </div>

            `;


            liste.appendChild(element);

        });

}


// ==========================================
// PAYER UNE TRANCHE
// ==========================================

function payerReste(id) {

    const reparations =
        getReparationsHistorique();


    const reparation =
        reparations.find(function(item) {

            return item.id === id;

        });


    if (!reparation) {
        return;
    }


    const prix =
        Number(reparation.prix) || 0;


    const paye =
        Number(reparation.paye) || 0;


    const reste =
        Math.max(
            prix - paye,
            0
        );


    if (reste <= 0) {

        alert(
            "Cette réparation est déjà entièrement payée."
        );

        return;

    }


    const montant =
        prompt(
            "Montant à payer maintenant :\nReste : "
            +
            formatMontantHistorique(reste)
        );


    if (
        montant === null ||
        montant.trim() === ""
    ) {

        return;

    }


    const paiement =
        Number(montant);


    if (
        isNaN(paiement) ||
        paiement <= 0
    ) {

        alert(
            "Veuillez entrer un montant valide."
        );

        return;

    }


    if (paiement > reste) {

        alert(
            "Le paiement ne peut pas dépasser le reste."
        );

        return;

    }


    reparation.paye =
        paye + paiement;


    reparation.reste =
        Math.max(
            prix - reparation.paye,
            0
        );


    if (reparation.reste === 0) {

        reparation.statut =
            "Terminée";

    }


    sauvegarderHistorique(
        reparations
    );


    afficherHistorique();


    alert(
        "Paiement enregistré : "
        +
        formatMontantHistorique(
            paiement
        )
    );

}


// ==========================================
// MODIFIER
// ==========================================

function modifierReparation(id) {

    localStorage.setItem(
        "reparationAModifier",
        id
    );


    window.location.href =
        "reparations.html";

}


// ==========================================
// SUPPRIMER
// ==========================================

function supprimerReparation(id) {

    const confirmation =
        confirm(
            "Voulez-vous vraiment supprimer cette réparation ?"
        );


    if (!confirmation) {
        return;
    }


    let reparations =
        getReparationsHistorique();


    reparations =
        reparations.filter(function(item) {

            return item.id !== id;

        });


    sauvegarderHistorique(
        reparations
    );


    afficherHistorique();

}


// ==========================================
// INITIALISATION
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        afficherHistorique();

    }
);
