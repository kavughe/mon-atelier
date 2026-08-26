
// ==========================================
// MON ATELIER - FINANCE
// ==========================================

const formulaireFinance =
    document.getElementById("formulaireFinance");

const listeOperations =
    document.getElementById("listeOperations");

const rechercheFinance =
    document.getElementById("rechercheFinance");


// ==========================================
// CHARGER LES OPÉRATIONS
// ==========================================

let operations = JSON.parse(
    localStorage.getItem("operationsFinance")
) || [];


// ==========================================
// FORMAT FC
// ==========================================

function formatFC(montant) {

    return Number(montant || 0)
        .toLocaleString("fr-FR") + " FC";

}


// ==========================================
// DATE AU FORMAT YYYY-MM-DD
// ==========================================

function dateDuJour() {

    const maintenant = new Date();

    const annee =
        maintenant.getFullYear();

    const mois =
        String(
            maintenant.getMonth() + 1
        ).padStart(2, "0");

    const jour =
        String(
            maintenant.getDate()
        ).padStart(2, "0");

    return `${annee}-${mois}-${jour}`;

}


// ==========================================
// AFFICHER LES OPÉRATIONS
// ==========================================

function afficherOperations(donnees = operations) {

    if (!listeOperations) return;

    listeOperations.innerHTML = "";

    donnees.forEach(function(operation, index) {

        const ligne =
            document.createElement("tr");

        const symbole =
            operation.type === "entrée"
                ? "💰"
                : "💸";

        ligne.innerHTML = `

            <td>${operation.date}</td>

            <td>
                ${symbole}
                ${operation.type}
            </td>

            <td>
                ${operation.description}
            </td>

            <td>
                ${formatFC(operation.montant)}
            </td>

            <td>

                <button
                    type="button"
                    onclick="supprimerOperation(${index})">

                    🗑️ Effacer

                </button>

            </td>

        `;

        listeOperations.appendChild(ligne);

    });

    calculerTotaux();

}


// ==========================================
// CALCULER LES TOTAUX
// ==========================================

function calculerTotaux() {

    const aujourdHui =
        dateDuJour();

    const maintenant =
        new Date();

    const moisActuel =
        maintenant.getMonth() + 1;

    const anneeActuelle =
        maintenant.getFullYear();


    let entreesJour = 0;
    let sortiesJour = 0;
    let entreesMois = 0;
    let sortiesMois = 0;


    operations.forEach(function(operation) {

        const montant =
            Number(operation.montant) || 0;


        // ==========================
        // JOUR
        // ==========================

        if (operation.date === aujourdHui) {

            if (operation.type === "entrée") {

                entreesJour += montant;

            }

            if (operation.type === "sortie") {

                sortiesJour += montant;

            }

        }


        // ==========================
        // MOIS
        // ==========================

        if (operation.date) {

            const morceaux =
                operation.date.split("-");

            if (morceaux.length === 3) {

                const annee =
                    Number(morceaux[0]);

                const mois =
                    Number(morceaux[1]);


                if (
                    annee === anneeActuelle &&
                    mois === moisActuel
                ) {

                    if (
                        operation.type === "entrée"
                    ) {

                        entreesMois += montant;

                    }

                    if (
                        operation.type === "sortie"
                    ) {

                        sortiesMois += montant;

                    }

                }

            }

        }

    });


    // ==========================
    // SOLDE
    // ==========================

    const soldeJour =
        entreesJour - sortiesJour;

    const soldeMois =
        entreesMois - sortiesMois;


    // ==========================
    // AFFICHAGE
    // ==========================

    const elementEntreesJour =
        document.getElementById("entreesJour");

    const elementSortiesJour =
        document.getElementById("sortiesJour");

    const elementSoldeJour =
        document.getElementById("soldeJour");

    const elementEntreesMois =
        document.getElementById("entreesMois");

    const elementSortiesMois =
        document.getElementById("sortiesMois");

    const elementSoldeMois =
        document.getElementById("soldeMois");


    if (elementEntreesJour) {

        elementEntreesJour.textContent =
            formatFC(entreesJour);

    }


    if (elementSortiesJour) {

        elementSortiesJour.textContent =
            formatFC(sortiesJour);

    }


    if (elementSoldeJour) {

        elementSoldeJour.textContent =
            formatFC(soldeJour);

    }


    if (elementEntreesMois) {

        elementEntreesMois.textContent =
            formatFC(entreesMois);

    }


    if (elementSortiesMois) {

        elementSortiesMois.textContent =
            formatFC(sortiesMois);

    }


    if (elementSoldeMois) {

        elementSoldeMois.textContent =
            formatFC(soldeMois);

    }

}


// ==========================================
// ENREGISTRER UNE OPÉRATION
// ==========================================

if (formulaireFinance) {

    formulaireFinance.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const type =
                document.getElementById(
                    "typeOperation"
                ).value;


            const description =
                document.getElementById(
                    "descriptionOperation"
                ).value.trim();


            const montant =
                Number(
                    document.getElementById(
                        "montantOperation"
                    ).value
                );


            if (
                type === "" ||
                description === "" ||
                montant <= 0
            ) {

                alert(
                    "⚠️ Remplissez correctement les champs."
                );

                return;

            }


            const nouvelleOperation = {

                date:
                    dateDuJour(),

                type:
                    type,

                description:
                    description,

                montant:
                    montant

            };


            operations.push(
                nouvelleOperation
            );


            localStorage.setItem(
                "operationsFinance",
                JSON.stringify(
                    operations
                )
            );


            afficherOperations();


            formulaireFinance.reset();


            alert(
                "✅ Opération enregistrée."
            );

        }
    );

}


// ==========================================
// SUPPRIMER
// ==========================================

function supprimerOperation(index) {

    if (
        !confirm(
            "Voulez-vous supprimer cette opération ?"
        )
    ) {

        return;

    }


    operations.splice(
        index,
        1
    );


    localStorage.setItem(
        "operationsFinance",
        JSON.stringify(
            operations
        )
    );


    afficherOperations();

}


// ==========================================
// RECHERCHE
// ==========================================

if (rechercheFinance) {

    rechercheFinance.addEventListener(
        "input",
        function() {

            const texte =
                rechercheFinance.value
                    .toLowerCase()
                    .trim();


            const resultats =
                operations.filter(
                    function(operation) {

                        return (

                            String(
                                operation.date
                            )
                            .includes(texte)

                            ||

                            String(
                                operation.type
                            )
                            .toLowerCase()
                            .includes(texte)

                            ||

                            String(
                                operation.description
                            )
                            .toLowerCase()
                            .includes(texte)

                            ||

                            String(
                                operation.montant
                            )
                            .includes(texte)

                        );

                    }
                );


            afficherOperations(
                resultats
            );

        }
    );

}


// ==========================================
// DÉMARRAGE
// ==========================================

afficherOperations();

