
// ==========================================
// MON ATELIER - RAPPORTS
// ==========================================


// ==========================================
// RECUPERER LES REPARATIONS
// ==========================================

function getReparationsRapport() {

    return JSON.parse(
        localStorage.getItem("reparations")
    ) || [];

}


// ==========================================
// RECUPERER LES DEPENSES
// ==========================================

function getDepensesRapport() {

    return JSON.parse(
        localStorage.getItem("depenses")
    ) || [];

}


// ==========================================
// FORMAT MONTANT
// ==========================================

function formatRapport(montant) {

    return (
        Number(montant) || 0
    ).toLocaleString("fr-FR") + " FC";

}


// ==========================================
// CALCULER RECETTES
// ==========================================

function calculerRecettes() {

    const reparations =
        getReparationsRapport();


    let total = 0;


    reparations.forEach(function(reparation) {

        total +=
            Number(reparation.paye) || 0;

    });


    return total;

}


// ==========================================
// CALCULER DEPENSES
// ==========================================

function calculerDepenses() {

    const depenses =
        getDepensesRapport();


    let total = 0;


    depenses.forEach(function(depense) {

        total +=
            Number(depense.montant) || 0;

    });


    return total;

}


// ==========================================
// AFFICHER LE BILAN GENERAL
// ==========================================

function afficherBilanGeneral() {

    const recettes =
        calculerRecettes();


    const depenses =
        calculerDepenses();


    const benefice =
        recettes - depenses;


    console.log(
        "Réparations :",
        getReparationsRapport()
    );


    console.log(
        "Recettes :",
        recettes
    );


    console.log(
        "Dépenses :",
        depenses
    );


    console.log(
        "Bénéfice :",
        benefice
    );


    // RECETTES

    const recetteElement =
        document.getElementById(
            "recetteGenerale"
        );


    if (recetteElement) {

        recetteElement.textContent =
            formatRapport(recettes);

    }


    // DEPENSES

    const depenseElement =
        document.getElementById(
            "depenseGenerale"
        );


    if (depenseElement) {

        depenseElement.textContent =
            formatRapport(depenses);

    }


    // BENEFICE

    const beneficeElement =
        document.getElementById(
            "beneficeGeneral"
        );


    if (beneficeElement) {

        beneficeElement.textContent =
            formatRapport(benefice);

    }

}


// ==========================================
// STATISTIQUES REPARATIONS
// ==========================================

function afficherStatistiquesRapport() {

    const reparations =
        getReparationsRapport();


    let terminees = 0;

    let enCours = 0;

    let nonPayees = 0;


    reparations.forEach(function(reparation) {

        const statut =
            String(
                reparation.statut || ""
            ).toLowerCase();


        // TERMINÉES

        if (

            statut.includes("termin")

            ||

            statut.includes("livr")

            ||

            statut.includes("fini")

        ) {

            terminees++;

        }


        // EN COURS

        else if (

            statut.includes("cours")

            ||

            statut.includes("attente")

            ||

            statut === ""

        ) {

            enCours++;

        }


        // NON PAYÉES

        const prix =
            Number(reparation.prix) || 0;


        const paye =
            Number(reparation.paye) || 0;


        if (prix > paye) {

            nonPayees++;

        }

    });


    // TOTAL REPARATIONS

    const total =
        document.getElementById(
            "totalReparations"
        );


    if (total) {

        total.textContent =
            reparations.length;

    }


    // TERMINEES

    const termineesElement =
        document.getElementById(
            "reparationsTerminees"
        );


    if (termineesElement) {

        termineesElement.textContent =
            terminees;

    }


    // EN COURS

    const coursElement =
        document.getElementById(
            "reparationsEnCours"
        );


    if (coursElement) {

        coursElement.textContent =
            enCours;

    }


    // NON PAYEES

    const nonPayeesElement =
        document.getElementById(
            "reparationsNonPayees"
        );


    if (nonPayeesElement) {

        nonPayeesElement.textContent =
            nonPayees;

    }

}


// ==========================================
// RAPPORT JOUR / SEMAINE / MOIS
// ==========================================

function memeJour(date1, date2) {

    return (

        date1.getDate() ===
        date2.getDate()

        &&

        date1.getMonth() ===
        date2.getMonth()

        &&

        date1.getFullYear() ===
        date2.getFullYear()

    );

}


function debutSemaine() {

    const date =
        new Date();


    const jour =
        date.getDay();


    const difference =
        jour === 0
            ? 6
            : jour - 1;


    date.setDate(
        date.getDate() - difference
    );


    date.setHours(
        0,
        0,
        0,
        0
    );


    return date;

}


// ==========================================
// RECETTES PAR PERIODE
// ==========================================

function recettesPeriode(type) {

    const reparations =
        getReparationsRapport();


    const maintenant =
        new Date();


    const semaine =
        debutSemaine();


    let total = 0;


    reparations.forEach(function(reparation) {

        if (!reparation.date) {
            return;
        }


        const date =
            new Date(reparation.date);


        const montant =
            Number(
                reparation.paye
            ) || 0;


        if (type === "jour") {

            if (
                memeJour(
                    date,
                    maintenant
                )
            ) {

                total += montant;

            }

        }


        if (type === "semaine") {

            if (date >= semaine) {

                total += montant;

            }

        }


        if (type === "mois") {

            if (

                date.getMonth()
                ===
                maintenant.getMonth()

                &&

                date.getFullYear()
                ===
                maintenant.getFullYear()

            ) {

                total += montant;

            }

        }

    });


    return total;

}


// ==========================================
// DEPENSES PAR PERIODE
// ==========================================

function depensesPeriode(type) {

    const depenses =
        getDepensesRapport();


    const maintenant =
        new Date();


    const semaine =
        debutSemaine();


    let total = 0;


    depenses.forEach(function(depense) {

        if (!depense.date) {
            return;
        }


        const date =
            new Date(depense.date);


        const montant =
            Number(
                depense.montant
            ) || 0;


        if (type === "jour") {

            if (
                memeJour(
                    date,
                    maintenant
                )
            ) {

                total += montant;

            }

        }


        if (type === "semaine") {

            if (date >= semaine) {

                total += montant;

            }

        }


        if (type === "mois") {

            if (

                date.getMonth()
                ===
                maintenant.getMonth()

                &&

                date.getFullYear()
                ===
                maintenant.getFullYear()

            ) {

                total += montant;

            }

        }

    });


    return total;

}


// ==========================================
// AFFICHER JOUR / SEMAINE / MOIS
// ==========================================

function afficherPeriodes() {

    const recetteJour =
        recettesPeriode("jour");


    const recetteSemaine =
        recettesPeriode("semaine");


    const recetteMois =
        recettesPeriode("mois");


    const depenseJour =
        depensesPeriode("jour");


    const depenseSemaine =
        depensesPeriode("semaine");


    const depenseMois =
        depensesPeriode("mois");


    mettreValeur(
        "recetteJour",
        formatRapport(recetteJour)
    );


    mettreValeur(
        "recetteSemaine",
        formatRapport(recetteSemaine)
    );


    mettreValeur(
        "recetteMois",
        formatRapport(recetteMois)
    );


    mettreValeur(
        "depenseJour",
        formatRapport(depenseJour)
    );


    mettreValeur(
        "depenseSemaine",
        formatRapport(depenseSemaine)
    );


    mettreValeur(
        "depenseMois",
        formatRapport(depenseMois)
    );


    mettreValeur(
        "beneficeJour",
        formatRapport(
            recetteJour - depenseJour
        )
    );


    mettreValeur(
        "beneficeSemaine",
        formatRapport(
            recetteSemaine - depenseSemaine
        )
    );


    mettreValeur(
        "beneficeMois",
        formatRapport(
            recetteMois - depenseMois
        )
    );

}


// ==========================================
// METTRE UNE VALEUR
// ==========================================

function mettreValeur(id, valeur) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            valeur;

    }

}


// ==========================================
// GRAPHIQUE
// ==========================================

function afficherGraphique() {

    const canvas =
        document.getElementById(
            "graphiqueFinances"
        );


    if (!canvas) {

        console.log(
            "Graphique : canvas introuvable"
        );

        return;

    }


    if (
        typeof Chart ===
        "undefined"
    ) {

        console.log(
            "Chart.js non chargé"
        );

        return;

    }


    const recettes = [

        recettesPeriode("jour"),

        recettesPeriode("semaine"),

        recettesPeriode("mois")

    ];


    const depenses = [

        depensesPeriode("jour"),

        depensesPeriode("semaine"),

        depensesPeriode("mois")

    ];


    if (window.monGraphique) {

        window.monGraphique.destroy();

    }


    window.monGraphique =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels: [

                        "Aujourd'hui",

                        "Cette semaine",

                        "Ce mois"

                    ],

                    datasets: [

                        {

                            label:
                                "Recettes",

                            data:
                                recettes,

                            borderWidth: 1

                        },


                        {

                            label:
                                "Dépenses",

                            data:
                                depenses,

                            borderWidth: 1

                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,


                    scales: {

                        y: {

                            beginAtZero: true

                        }

                    }

                }

            }
        );

}


// ==========================================
// INITIALISATION
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        afficherBilanGeneral();

        afficherStatistiquesRapport();

        afficherPeriodes();

        afficherGraphique();

    }
);
