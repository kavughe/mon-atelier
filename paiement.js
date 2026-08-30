
// ==========================================
// MON ATELIER - PAIEMENTS
// Paiement total ou par tranche
// ==========================================


// ==========================================
// RECUPERER LES REPARATIONS
// ==========================================

function obtenirReparationsPaiement() {

    try {

        return JSON.parse(
            localStorage.getItem("reparations")
        ) || [];

    } catch (erreur) {

        console.error(
            "Erreur lors de la lecture des réparations :",
            erreur
        );

        return [];
    }
}


// ==========================================
// SAUVEGARDER LES REPARATIONS
// ==========================================

function sauvegarderReparationsPaiement(reparations) {

    localStorage.setItem(
        "reparations",
        JSON.stringify(reparations)
    );
}


// ==========================================
// RECUPERER L'HISTORIQUE DES PAIEMENTS
// ==========================================

function obtenirPaiements() {

    try {

        return JSON.parse(
            localStorage.getItem("paiements")
        ) || [];

    } catch (erreur) {

        console.error(
            "Erreur lors de la lecture des paiements :",
            erreur
        );

        return [];
    }
}


// ==========================================
// SAUVEGARDER LES PAIEMENTS
// ==========================================

function sauvegarderPaiements(paiements) {

    localStorage.setItem(
        "paiements",
        JSON.stringify(paiements)
    );
}


// ==========================================
// FORMAT MONTANT
// ==========================================

function formatMontantPaiement(montant) {

    montant = Number(montant) || 0;

    return montant.toLocaleString("fr-FR") + " FC";
}


// ==========================================
// CHARGER LES REPARATIONS DANS LE SELECT
// ==========================================

function chargerReparationsPaiement(
    filtre = ""
) {

    const select =
        document.getElementById(
            "reparationPaiement"
        );

    if (!select) {
        return;
    }


    const reparations =
        obtenirReparationsPaiement();


    select.innerHTML = `
        <option value="">
            -- Sélectionner une réparation --
        </option>
    `;


    const recherche =
        filtre.toLowerCase().trim();


    reparations.forEach(
        function(reparation) {

            const prix =
                Number(reparation.prix) || 0;

            const paye =
                Number(reparation.paye) || 0;

            const reste =
                Math.max(
                    prix - paye,
                    0
                );


            // On affiche seulement les réparations
            // qui ont encore quelque chose à payer

            if (reste <= 0) {
                return;
            }


            const texte =
                (
                    (reparation.client || "Client") +
                    " — " +
                    (reparation.appareil || "Appareil") +
                    " — Reste : " +
                    formatMontantPaiement(reste)
                );


            if (
                recherche &&
                !texte
                    .toLowerCase()
                    .includes(recherche)
            ) {

                return;
            }


            const option =
                document.createElement("option");


            option.value =
                reparation.id;


            option.textContent =
                texte;


            select.appendChild(option);

        }
    );

}


// ==========================================
// AFFICHER LES INFORMATIONS
// ==========================================

function afficherInformationsPaiement() {

    const select =
        document.getElementById(
            "reparationPaiement"
        );


    if (!select) {
        return;
    }


    const id =
        select.value;


    const info =
        document.getElementById(
            "infoReparationPaiement"
        );


    const client =
        document.getElementById(
            "paiementClient"
        );


    const appareil =
        document.getElementById(
            "paiementAppareil"
        );


    const prixElement =
        document.getElementById(
            "paiementPrix"
        );


    const payeElement =
        document.getElementById(
            "paiementDejaPaye"
        );


    const resteElement =
        document.getElementById(
            "paiementReste"
        );


    const montantInput =
        document.getElementById(
            "montantPaiement"
        );


    if (!id) {

        if (info) {
            info.style.display = "none";
        }

        if (client) {
            client.textContent = "-";
        }

        if (appareil) {
            appareil.textContent = "-";
        }

        if (prixElement) {
            prixElement.textContent = "0 FC";
        }

        if (payeElement) {
            payeElement.textContent = "0 FC";
        }

        if (resteElement) {
            resteElement.textContent = "0 FC";
        }

        if (montantInput) {
            montantInput.value = "";
            montantInput.max = "";
        }

        return;
    }


    const reparations =
        obtenirReparationsPaiement();


    const reparation =
        reparations.find(
            function(item) {

                return item.id === id;

            }
        );


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


    if (info) {
        info.style.display = "grid";
    }


    if (client) {

        client.textContent =
            reparation.client ||
            "Client inconnu";

    }


    if (appareil) {

        appareil.textContent =
            reparation.appareil ||
            "Appareil";

    }


    if (prixElement) {

        prixElement.textContent =
            formatMontantPaiement(prix);

    }


    if (payeElement) {

        payeElement.textContent =
            formatMontantPaiement(paye);

    }


    if (resteElement) {

        resteElement.textContent =
            formatMontantPaiement(reste);

    }


    if (montantInput) {

        montantInput.max = reste;

        montantInput.placeholder =
            "Maximum : " +
            formatMontantPaiement(reste);

    }

}


// ==========================================
// ENREGISTRER UN PAIEMENT
// ==========================================

const formPaiement =
    document.getElementById(
        "formPaiement"
    );


if (formPaiement) {

    formPaiement.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            // ==================================
            // VERIFIER LE ROLE
            // ==================================

            const role =
                sessionStorage.getItem(
                    "monAtelierRole"
                );


            if (
                role !== "admin" &&
                role !== "reception"
            ) {

                afficherMessagePaiement(
                    "❌ Vous n'avez pas l'autorisation d'enregistrer un paiement.",
                    "error"
                );

                return;
            }


            // ==================================
            // RECUPERER LES CHAMPS
            // ==================================

            const idReparation =
                document.getElementById(
                    "reparationPaiement"
                ).value;


            const montant =
                Number(
                    document.getElementById(
                        "montantPaiement"
                    ).value
                ) || 0;


            const type =
                document.getElementById(
                    "typePaiement"
                ).value;


            const note =
                document.getElementById(
                    "notePaiement"
                ).value.trim();


            // ==================================
            // VERIFICATION
            // ==================================

            if (!idReparation) {

                afficherMessagePaiement(
                    "❌ Veuillez sélectionner une réparation.",
                    "error"
                );

                return;
            }


            if (montant <= 0) {

                afficherMessagePaiement(
                    "❌ Le montant doit être supérieur à 0.",
                    "error"
                );

                return;
            }


            const reparations =
                obtenirReparationsPaiement();


            const index =
                reparations.findIndex(
                    function(item) {

                        return (
                            item.id ===
                            idReparation
                        );

                    }
                );


            if (index === -1) {

                afficherMessagePaiement(
                    "❌ Réparation introuvable.",
                    "error"
                );

                return;
            }


            const reparation =
                reparations[index];


            const prix =
                Number(reparation.prix) || 0;

            const ancienPaye =
                Number(reparation.paye) || 0;

            const reste =
                Math.max(
                    prix - ancienPaye,
                    0
                );


            // ==================================
            // VERIFIER LE MONTANT
            // ==================================

            if (reste <= 0) {

                afficherMessagePaiement(
                    "✅ Cette réparation est déjà entièrement payée.",
                    "error"
                );

                return;
            }


            if (montant > reste) {

                afficherMessagePaiement(
                    "❌ Le paiement ne peut pas dépasser le reste de " +
                    formatMontantPaiement(reste) +
                    ".",
                    "error"
                );

                return;
            }


            // ==================================
            // NOUVEAU MONTANT PAYE
            // ==================================

            const nouveauPaye =
                ancienPaye + montant;


            const nouveauReste =
                Math.max(
                    prix - nouveauPaye,
                    0
                );


            reparation.paye =
                nouveauPaye;


            reparation.reste =
                nouveauReste;


            // ==================================
            // STATUT DE PAIEMENT
            // ==================================

            if (nouveauReste === 0) {

                reparation.statutPaiement =
                    "Payée";

            } else {

                reparation.statutPaiement =
                    "Partiellement payée";

            }


            // ==================================
            // ENREGISTRER LE PAIEMENT
            // ==================================

            const paiements =
                obtenirPaiements();


            const nouveauPaiement = {

                id:
                    Date.now().toString(),

                reparationId:
                    reparation.id,

                clientId:
                    reparation.clientId || "",

                client:
                    reparation.client || "Client",

                telephone:
                    reparation.telephone || "",

                appareil:
                    reparation.appareil || "Appareil",

                montant:
                    montant,

                type:
                    type,

                note:
                    note,

                date:
                    new Date().toISOString(),

                utilisateur:
                    sessionStorage.getItem(
                        "monAtelierUtilisateur"
                    ) || "admin",

                role:
                    role

            };


            paiements.push(
                nouveauPaiement
            );


            // ==================================
            // SAUVEGARDER
            // ==================================

            sauvegarderReparationsPaiement(
                reparations
            );


            sauvegarderPaiements(
                paiements
            );


            // ==================================
            // MESSAGE
            // ==================================

            afficherMessagePaiement(
                "✅ Paiement de " +
                formatMontantPaiement(montant) +
                " enregistré avec succès.",
                "success"
            );


            // ==================================
            // REINITIALISER
            // ==================================

            formPaiement.reset();


            const info =
                document.getElementById(
                    "infoReparationPaiement"
                );


            if (info) {
                info.style.display = "none";
            }


            // Actualiser

            chargerReparationsPaiement();

            afficherListePaiements();

            afficherNombrePaiements();

        }
    );

}


// ==========================================
// RECHERCHE
// ==========================================

function rechercherPaiement() {

    const input =
        document.getElementById(
            "recherchePaiement"
        );


    if (!input) {
        return;
    }


    chargerReparationsPaiement(
        input.value
    );

}


// ==========================================
// AFFICHER LES PAIEMENTS
// ==========================================

function afficherListePaiements(
    recherche = ""
) {

    const liste =
        document.getElementById(
            "listePaiements"
        );


    if (!liste) {
        return;
    }


    const paiements =
        obtenirPaiements();


    const texteRecherche =
        recherche
            .toLowerCase()
            .trim();


    const resultats =
        paiements
            .slice()
            .reverse()
            .filter(
                function(paiement) {

                    if (!texteRecherche) {
                        return true;
                    }


                    const texte =
                        (
                            paiement.client +
                            " " +
                            paiement.telephone +
                            " " +
                            paiement.appareil +
                            " " +
                            paiement.type
                        )
                        .toLowerCase();


                    return texte.includes(
                        texteRecherche
                    );

                }
            );


    if (resultats.length === 0) {

        liste.innerHTML = `
            <div class="empty">

                <div class="empty-icon">
                    💵
                </div>

                <h3>
                    Aucun paiement
                </h3>

                <p>
                    Aucun paiement enregistré.
                </p>

            </div>
        `;

        return;
    }


    liste.innerHTML = "";


    resultats.forEach(
        function(paiement) {

            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "paiement-item";


            const date =
                paiement.date
                    ? new Date(
                        paiement.date
                    ).toLocaleString(
                        "fr-FR"
                    )
                    : "";


            element.innerHTML = `

                <div class="paiement-item-header">

                    <h3>
                        💵
                        ${formatMontantPaiement(
                            paiement.montant
                        )}
                    </h3>

                    <span>
                        ${paiement.type || "Autre"}
                    </span>

                </div>


                <p>
                    👤
                    <strong>Client :</strong>
                    ${paiement.client || "Inconnu"}
                </p>


                <p>
                    📞
                    <strong>Téléphone :</strong>
                    ${paiement.telephone || "Non renseigné"}
                </p>


                <p>
                    📱
                    <strong>Appareil :</strong>
                    ${paiement.appareil || "Appareil"}
                </p>


                <p>
                    📅
                    <strong>Date :</strong>
                    ${date}
                </p>


                ${
                    paiement.note
                    ? `
                    <p>
                        📝
                        <strong>Note :</strong>
                        ${paiement.note}
                    </p>
                    `
                    : ""
                }


                <small>
                    👤 Enregistré par :
                    ${paiement.utilisateur || "admin"}
                </small>

            `;


            liste.appendChild(
                element
            );

        }
    );

}


// ==========================================
// NOMBRE DE PAIEMENTS
// ==========================================

function afficherNombrePaiements() {

    const element =
        document.getElementById(
            "nombrePaiements"
        );


    if (!element) {
        return;
    }


    const paiements =
        obtenirPaiements();


    element.textContent =
        paiements.length;

}


// ==========================================
// MESSAGE
// ==========================================

function afficherMessagePaiement(
    texte,
    type
) {

    const message =
        document.getElementById(
            "messagePaiement"
        );


    if (!message) {
        return;
    }


    message.textContent =
        texte;


    message.className =
        "form-message " +
        type;

}


// ==========================================
// SELECTION REPARATION
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const select =
            document.getElementById(
                "reparationPaiement"
            );


        const recherche =
            document.getElementById(
                "recherchePaiement"
            );


        if (select) {

            select.addEventListener(
                "change",
                function() {

                    afficherInformationsPaiement();

                }
            );

        }


        if (recherche) {

            recherche.addEventListener(
                "input",
                function() {

                    rechercherPaiement();

                    afficherListePaiements(
                        recherche.value
                    );

                }
            );

        }


        chargerReparationsPaiement();

        afficherInformationsPaiement();

        afficherListePaiements();

        afficherNombrePaiements();

    }
);
