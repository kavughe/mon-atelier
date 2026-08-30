// ==========================================
// MON ATELIER - DEPENSES
// ==========================================


// ==========================================
// RECUPERER LES DEPENSES
// ==========================================

function getDepenses() {

    return JSON.parse(
        localStorage.getItem("depenses")
    ) || [];

}


// ==========================================
// SAUVEGARDER LES DEPENSES
// ==========================================

function sauvegarderDepenses(depenses) {

    localStorage.setItem(
        "depenses",
        JSON.stringify(depenses)
    );

}


// ==========================================
// FORMAT DATE
// ==========================================

function formaterDateDepense(date) {

    if (!date) {
        return "Date inconnue";
    }

    const d = new Date(date + "T00:00:00");

    if (isNaN(d.getTime())) {
        return "Date inconnue";
    }

    return d.toLocaleDateString("fr-FR");

}


// ==========================================
// AUJOURD'HUI
// ==========================================

function depenseEstAujourdHui(date) {

    const maintenant = new Date();

    const d =
        new Date(date + "T00:00:00");


    return (
        d.getDate() === maintenant.getDate() &&
        d.getMonth() === maintenant.getMonth() &&
        d.getFullYear() === maintenant.getFullYear()
    );

}


// ==========================================
// DEBUT DE LA SEMAINE
// ==========================================

function debutSemaineDepense() {

    const maintenant = new Date();

    const jour =
        maintenant.getDay();


    const difference =
        jour === 0 ? 6 : jour - 1;


    const debut =
        new Date(maintenant);


    debut.setDate(
        maintenant.getDate() - difference
    );


    debut.setHours(0, 0, 0, 0);


    return debut;

}


// ==========================================
// CETTE SEMAINE
// ==========================================

function depenseEstCetteSemaine(date) {

    const d =
        new Date(date + "T00:00:00");


    const debut =
        debutSemaineDepense();


    const maintenant =
        new Date();


    return (
        d >= debut &&
        d <= maintenant
    );

}


// ==========================================
// CE MOIS
// ==========================================

function depenseEstCeMois(date) {

    const maintenant =
        new Date();


    const d =
        new Date(date + "T00:00:00");


    return (
        d.getMonth() === maintenant.getMonth() &&
        d.getFullYear() === maintenant.getFullYear()
    );

}


// ==========================================
// CALCUL DES DEPENSES
// ==========================================

function calculerDepenses() {

    const depenses =
        getDepenses();


    let jour = 0;

    let semaine = 0;

    let mois = 0;

    let total = 0;


    depenses.forEach(function(depense) {

        const montant =
            Number(depense.montant) || 0;


        total += montant;


        if (
            depenseEstAujourdHui(
                depense.date
            )
        ) {

            jour += montant;

        }


        if (
            depenseEstCetteSemaine(
                depense.date
            )
        ) {

            semaine += montant;

        }


        if (
            depenseEstCeMois(
                depense.date
            )
        ) {

            mois += montant;

        }

    });


    document.getElementById(
        "depensesJour"
    ).textContent =
        formatMontant(jour);


    document.getElementById(
        "depensesSemaine"
    ).textContent =
        formatMontant(semaine);


    document.getElementById(
        "depensesMois"
    ).textContent =
        formatMontant(mois);


    document.getElementById(
        "depensesTotales"
    ).textContent =
        formatMontant(total);

}


// ==========================================
// AFFICHER LES DEPENSES
// ==========================================

function afficherDepenses() {

    const liste =
        document.getElementById(
            "listeDepenses"
        );


    if (!liste) {
        return;
    }


    const depenses =
        getDepenses();


    if (depenses.length === 0) {

        liste.innerHTML = `
            <p class="empty">
                Aucune dépense enregistrée.
            </p>
        `;

        return;
    }


    liste.innerHTML = "";


    depenses
        .slice()
        .reverse()
        .forEach(function(depense) {

            const element =
                document.createElement("div");


            element.className =
                "historique-item";


            const montant =
                Number(depense.montant) || 0;


            element.innerHTML = `

                <div class="historique-header">

                    <div>

                        <h3>
                            💸
                            ${depense.description}
                        </h3>

                        <p class="date">

                            📅
                            ${formaterDateDepense(
                                depense.date
                            )}

                        </p>

                    </div>


                    <span class="statut">

                        ${depense.categorie}

                    </span>

                </div>


                <div class="historique-details">

                    <p>

                        💰
                        <strong>Montant :</strong>

                        ${formatMontant(montant)}

                    </p>

                    <p>

                        📂
                        <strong>Catégorie :</strong>

                        ${depense.categorie}

                    </p>

                </div>


                <div class="historique-actions">

                    <button
                        class="btn-primary"
                        onclick="modifierDepense('${depense.id}')">

                        ✏️ Modifier

                    </button>


                    <button
                        class="btn-danger"
                        onclick="supprimerDepense('${depense.id}')">

                        🗑️ Supprimer

                    </button>

                </div>

            `;


            liste.appendChild(element);

        });

}


// ==========================================
// ENREGISTRER UNE DEPENSE
// ==========================================

const formDepense =
    document.getElementById(
        "formDepense"
    );


if (formDepense) {

    formDepense.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const description =
                document.getElementById(
                    "description"
                ).value.trim();


            const categorie =
                document.getElementById(
                    "categorie"
                ).value;


            const montant =
                Number(
                    document.getElementById(
                        "montantDepense"
                    ).value
                ) || 0;


            const date =
                document.getElementById(
                    "dateDepense"
                ).value;


            if (montant <= 0) {

                alert(
                    "Le montant doit être supérieur à 0."
                );

                return;
            }


            let depenses =
                getDepenses();


            const id =
                document.getElementById(
                    "depenseId"
                ).value;


            // MODIFICATION
            if (id) {

                const index =
                    depenses.findIndex(
                        function(depense) {

                            return depense.id === id;

                        }
                    );


                if (index !== -1) {

                    depenses[index].description =
                        description;

                    depenses[index].categorie =
                        categorie;

                    depenses[index].montant =
                        montant;

                    depenses[index].date =
                        date;

                }


                alert(
                    "Dépense modifiée avec succès."
                );

            }


            // NOUVELLE DEPENSE
            else {

                const nouvelleDepense = {

                    id:
                        Date.now().toString(),

                    description:
                        description,

                    categorie:
                        categorie,

                    montant:
                        montant,

                    date:
                        date

                };


                depenses.push(
                    nouvelleDepense
                );


                alert(
                    "Dépense enregistrée avec succès."
                );

            }


            sauvegarderDepenses(
                depenses
            );


            formDepense.reset();


            document.getElementById(
                "depenseId"
            ).value = "";


            document.getElementById(
                "titreDepense"
            ).textContent =
                "➕ Nouvelle dépense";


            document.getElementById(
                "btnDepense"
            ).textContent =
                "💾 Enregistrer la dépense";


            document.getElementById(
                "btnAnnulerDepense"
            ).style.display =
                "none";


            afficherDepenses();

            calculerDepenses();

        }
    );

}


// ==========================================
// MODIFIER
// ==========================================

function modifierDepense(id) {

    const depenses =
        getDepenses();


    const depense =
        depenses.find(
            function(item) {

                return item.id === id;

            }
        );


    if (!depense) {

        alert(
            "Dépense introuvable."
        );

        return;
    }


    document.getElementById(
        "depenseId"
    ).value =
        depense.id;


    document.getElementById(
        "description"
    ).value =
        depense.description;


    document.getElementById(
        "categorie"
    ).value =
        depense.categorie;


    document.getElementById(
        "montantDepense"
    ).value =
        depense.montant;


    document.getElementById(
        "dateDepense"
    ).value =
        depense.date;


    document.getElementById(
        "titreDepense"
    ).textContent =
        "✏️ Modifier la dépense";


    document.getElementById(
        "btnDepense"
    ).textContent =
        "💾 Enregistrer les modifications";


    document.getElementById(
        "btnAnnulerDepense"
    ).style.display =
        "inline-block";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ==========================================
// ANNULER MODIFICATION
// ==========================================

function annulerModificationDepense() {

    document.getElementById(
        "formDepense"
    ).reset();


    document.getElementById(
        "depenseId"
    ).value = "";


    document.getElementById(
        "titreDepense"
    ).textContent =
        "➕ Nouvelle dépense";


    document.getElementById(
        "btnDepense"
    ).textContent =
        "💾 Enregistrer la dépense";


    document.getElementById(
        "btnAnnulerDepense"
    ).style.display =
        "none";

}


// ==========================================
// SUPPRIMER
// ==========================================

function supprimerDepense(id) {

    const confirmation =
        confirm(
            "Voulez-vous vraiment supprimer cette dépense ?"
        );


    if (!confirmation) {
        return;
    }


    let depenses =
        getDepenses();


    depenses =
        depenses.filter(
            function(depense) {

                return depense.id !== id;

            }
        );


    sauvegarderDepenses(
        depenses
    );


    afficherDepenses();

    calculerDepenses();


    alert(
        "Dépense supprimée avec succès."
    );

}


// ==========================================
// INITIALISATION
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        // Date d'aujourd'hui
        const dateInput =
            document.getElementById(
                "dateDepense"
            );


        if (dateInput) {

            const aujourdHui =
                new Date();


            const annee =
                aujourdHui.getFullYear();


            const mois =
                String(
                    aujourdHui.getMonth() + 1
                ).padStart(2, "0");


            const jour =
                String(
                    aujourdHui.getDate()
                ).padStart(2, "0");


            dateInput.value =
                `${annee}-${mois}-${jour}`;

        }


        afficherDepenses();

        calculerDepenses();

    }
);