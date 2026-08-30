// ==========================================
// MON ATELIER - TABLEAU DE BORD
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const clients =
        JSON.parse(localStorage.getItem("clients")) || [];

    const reparations =
        JSON.parse(localStorage.getItem("reparations")) || [];

    const depenses =
        JSON.parse(localStorage.getItem("depenses")) || [];


    // ======================================
    // NOMBRE DE CLIENTS
    // ======================================

    const totalClients =
        document.getElementById("totalClients");

    if (totalClients) {
        totalClients.textContent = clients.length;
    }


    // ======================================
    // NOMBRE DE REPARATIONS
    // ======================================

    const totalReparations =
        document.getElementById("totalReparations");

    if (totalReparations) {
        totalReparations.textContent =
            reparations.length;
    }


    // ======================================
    // COMPTEURS
    // ======================================

    let terminees = 0;
    let enCours = 0;
    let nonPayees = 0;

    let totalPaye = 0;
    let totalPrix = 0;


    reparations.forEach(function (reparation) {

        const prix =
            Number(reparation.prix) || 0;

        const paye =
            Number(reparation.paye) || 0;

        const reste =
            Math.max(prix - paye, 0);


        totalPrix += prix;
        totalPaye += paye;


        // ------------------------------
        // REPARATIONS TERMINEES
        // ------------------------------

        const statut =
            String(reparation.statut || "")
                .toLowerCase()
                .trim();

        if (
            statut === "terminée" ||
            statut === "terminee" ||
            statut === "terminé" ||
            statut === "termine"
        ) {

            terminees++;

        } else {

            enCours++;

        }


        // ------------------------------
        // REPARATIONS NON PAYEES
        // ------------------------------

        if (reste > 0) {
            nonPayees++;
        }

    });


    // ======================================
    // AFFICHER TERMINEES
    // ======================================

    const elementTerminees =
        document.getElementById(
            "reparationsTerminees"
        );

    if (elementTerminees) {

        elementTerminees.textContent =
            terminees;

    }


    // ======================================
    // AFFICHER EN COURS
    // ======================================

    const elementEnCours =
        document.getElementById(
            "reparationsEnCours"
        );

    if (elementEnCours) {

        elementEnCours.textContent =
            enCours;

    }


    // ======================================
    // AFFICHER NON PAYEES
    // ======================================

    const elementNonPayees =
        document.getElementById(
            "reparationsNonPayees"
        );

    if (elementNonPayees) {

        elementNonPayees.textContent =
            nonPayees;

    }


    // ======================================
    // DEPENSES
    // ======================================

    let totalDepenses = 0;

    depenses.forEach(function (depense) {

        totalDepenses +=
            Number(depense.montant) || 0;

    });


    // ======================================
    // BENEFICE
    // ======================================

    const benefice =
        totalPaye - totalDepenses;


    // ======================================
    // FORMAT MONTANT
    // ======================================

    function formatMontant(montant) {

        return Number(montant || 0)
            .toLocaleString("fr-FR")
            + " FC";

    }


    // ======================================
    // ARGENT RECU
    // ======================================

    const elementPaye =
        document.getElementById("totalPaye");

    if (elementPaye) {

        elementPaye.textContent =
            formatMontant(totalPaye);

    }


    // ======================================
    // DEPENSES
    // ======================================

    const elementDepenses =
        document.getElementById("totalDepenses");

    if (elementDepenses) {

        elementDepenses.textContent =
            formatMontant(totalDepenses);

    }


    // ======================================
    // BENEFICE
    // ======================================

    const elementBenefice =
        document.getElementById("totalBenefice");

    if (elementBenefice) {

        elementBenefice.textContent =
            formatMontant(benefice);

    }


    // ======================================
    // DERNIERES REPARATIONS
    // ======================================

    afficherDernieresReparations(reparations);

});


// ==========================================
// DERNIERES REPARATIONS
// ==========================================

function afficherDernieresReparations(reparations) {

    const zone =
        document.getElementById(
            "dernieresReparations"
        );

    if (!zone) {
        return;
    }


    if (reparations.length === 0) {

        zone.innerHTML = `
            <p class="empty">
                Aucune réparation enregistrée.
            </p>
        `;

        return;
    }


    zone.innerHTML = "";


    reparations
        .slice()
        .reverse()
        .slice(0, 5)
        .forEach(function (reparation) {

            const prix =
                Number(reparation.prix) || 0;

            const paye =
                Number(reparation.paye) || 0;

            const reste =
                Math.max(prix - paye, 0);


            const element =
                document.createElement("div");

            element.className =
                "historique-item";


            element.innerHTML = `

                <div class="historique-header">

                    <div>

                        <h3>
                            🔧
                            ${reparation.appareil || "Appareil"}
                        </h3>

                        <p>
                            👤
                            ${reparation.client || "Client inconnu"}
                        </p>

                    </div>

                </div>


                <div class="historique-details">

                    <p>
                        📅
                        <strong>Date :</strong>
                        ${formaterDate(reparation.date)}
                    </p>

                    <p>
                        💰
                        <strong>Prix :</strong>
                        ${formatMontantAccueil(prix)}
                    </p>

                    <p>
                        💵
                        <strong>Payé :</strong>
                        ${formatMontantAccueil(paye)}
                    </p>

                    <p>
                        ⏳
                        <strong>Reste :</strong>
                        ${formatMontantAccueil(reste)}
                    </p>

                    <p>
                        📌
                        <strong>Statut :</strong>
                        ${reparation.statut || "En cours"}
                    </p>

                </div>

            `;


            zone.appendChild(element);

        });

}


// ==========================================
// FORMAT DATE
// ==========================================

function formaterDate(date) {

    if (!date) {
        return "Non renseignée";
    }

    const d = new Date(date);

    if (isNaN(d.getTime())) {
        return date;
    }

    return d.toLocaleDateString("fr-FR");

}


// ==========================================
// FORMAT MONTANT
// ==========================================

function formatMontantAccueil(montant) {

    return Number(montant || 0)
        .toLocaleString("fr-FR")
        + " FC";

}