
// ==========================================
// MON ATELIER - GESTION DES REPARATIONS
// Admin + Réception + Consultation
// ==========================================


// ==========================================
// DONNEES
// ==========================================

function getReparations() {

    try {

        return JSON.parse(
            localStorage.getItem("reparations")
        ) || [];

    } catch (erreur) {

        console.error(
            "Erreur réparations :",
            erreur
        );

        return [];
    }
}


function sauvegarderReparations(reparations) {

    localStorage.setItem(
        "reparations",
        JSON.stringify(reparations)
    );
}


function getClients() {

    try {

        return JSON.parse(
            localStorage.getItem("clients")
        ) || [];

    } catch (erreur) {

        return [];
    }
}


// ==========================================
// ROLE
// ==========================================

function obtenirRoleReparation() {

    return sessionStorage.getItem(
        "monAtelierRole"
    ) || "";
}


function peutModifierReparation() {

    const role =
        obtenirRoleReparation();

    return (
        role === "admin" ||
        role === "reception"
    );
}


function peutSupprimerReparation() {

    return (
        obtenirRoleReparation() === "admin"
    );
}


// ==========================================
// FORMAT MONTANT
// ==========================================

function formatMontant(montant) {

    montant =
        Number(montant) || 0;

    return montant.toLocaleString(
        "fr-FR"
    ) + " FC";
}


// ==========================================
// CHARGER LES CLIENTS
// ==========================================

function chargerClients() {

    const select =
        document.getElementById(
            "client"
        );


    if (!select) {
        return;
    }


    const clients =
        getClients();


    select.innerHTML = `
        <option value="">
            -- Sélectionner un client --
        </option>
    `;


    const message =
        document.getElementById(
            "aucunClient"
        );


    if (clients.length === 0) {

        if (message) {
            message.style.display = "block";
        }

        return;
    }


    if (message) {
        message.style.display = "none";
    }


    clients.forEach(
        function(client) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                client.id;


            option.textContent =
                client.nom +
                " — " +
                client.telephone;


            select.appendChild(
                option
            );

        }
    );

}


// ==========================================
// CALCULER LE RESTE
// ==========================================

function calculerReste() {

    const prixElement =
        document.getElementById(
            "prix"
        );


    const payeElement =
        document.getElementById(
            "paye"
        );


    const resteElement =
        document.getElementById(
            "reste"
        );


    if (
        !prixElement ||
        !payeElement ||
        !resteElement
    ) {

        return;
    }


    const prix =
        Number(
            prixElement.value
        ) || 0;


    const paye =
        Number(
            payeElement.value
        ) || 0;


    const reste =
        Math.max(
            prix - paye,
            0
        );


    resteElement.textContent =
        formatMontant(
            reste
        );

}


// ==========================================
// CHARGER UNE REPARATION A MODIFIER
// ==========================================

function chargerReparationAModifier() {

    const id =
        localStorage.getItem(
            "reparationAModifier"
        );


    if (!id) {
        return;
    }


    if (!peutModifierReparation()) {

        localStorage.removeItem(
            "reparationAModifier"
        );

        return;
    }


    const reparations =
        getReparations();


    const reparation =
        reparations.find(
            function(item) {

                return item.id === id;

            }
        );


    if (!reparation) {

        localStorage.removeItem(
            "reparationAModifier"
        );

        return;
    }


    const client =
        document.getElementById(
            "client"
        );


    const appareil =
        document.getElementById(
            "appareil"
        );


    const panne =
        document.getElementById(
            "panne"
        );


    const prix =
        document.getElementById(
            "prix"
        );


    const paye =
        document.getElementById(
            "paye"
        );


    const statut =
        document.getElementById(
            "statut"
        );


    if (client) {

        client.value =
            reparation.clientId || "";

    }


    if (appareil) {

        appareil.value =
            reparation.appareil || "";

    }


    if (panne) {

        panne.value =
            reparation.panne || "";

    }


    if (prix) {

        prix.value =
            reparation.prix || 0;

    }


    if (paye) {

        paye.value =
            reparation.paye || 0;

    }


    if (statut) {

        statut.value =
            reparation.statut ||
            "En attente";

    }


    calculerReste();


    const titre =
        document.getElementById(
            "titreFormulaireReparation"
        );


    if (titre) {

        titre.textContent =
            "✏️ Modifier la réparation";

    }


    const bouton =
        document.querySelector(
            "#formReparation button[type='submit']"
        );


    if (bouton) {

        bouton.textContent =
            "💾 Enregistrer les modifications";

    }


    const zone =
        document.getElementById(
            "zoneFormulaireReparation"
        );


    if (zone) {

        zone.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

}


// ==========================================
// FORMULAIRE
// ==========================================

const formReparation =
    document.getElementById(
        "formReparation"
    );


if (formReparation) {

    formReparation.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            // ==================================
            // DROITS
            // ==================================

            if (!peutModifierReparation()) {

                alert(
                    "❌ Vous n'avez pas l'autorisation d'enregistrer une réparation."
                );

                return;
            }


            // ==================================
            // CHAMPS
            // ==================================

            const clientId =
                document.getElementById(
                    "client"
                ).value;


            const appareil =
                document.getElementById(
                    "appareil"
                ).value.trim();


            const panne =
                document.getElementById(
                    "panne"
                ).value.trim();


            const prix =
                Number(
                    document.getElementById(
                        "prix"
                    ).value
                ) || 0;


            const paye =
                Number(
                    document.getElementById(
                        "paye"
                    ).value
                ) || 0;


            const statut =
                document.getElementById(
                    "statut"
                ).value;


            // ==================================
            // VERIFICATIONS
            // ==================================

            if (!clientId) {

                alert(
                    "❌ Veuillez sélectionner un client."
                );

                return;
            }


            if (!appareil) {

                alert(
                    "❌ Veuillez saisir l'appareil."
                );

                return;
            }


            if (!panne) {

                alert(
                    "❌ Veuillez décrire la panne."
                );

                return;
            }


            if (prix <= 0) {

                alert(
                    "❌ Le prix doit être supérieur à 0."
                );

                return;
            }


            if (paye < 0) {

                alert(
                    "❌ Le montant payé est invalide."
                );

                return;
            }


            if (paye > prix) {

                alert(
                    "❌ Le montant payé ne peut pas dépasser le prix."
                );

                return;
            }


            // ==================================
            // CLIENT
            // ==================================

            const clients =
                getClients();


            const client =
                clients.find(
                    function(item) {

                        return (
                            item.id ===
                            clientId
                        );

                    }
                );


            if (!client) {

                alert(
                    "❌ Client introuvable."
                );

                return;
            }


            // ==================================
            // REPARATIONS
            // ==================================

            let reparations =
                getReparations();


            const idModification =
                localStorage.getItem(
                    "reparationAModifier"
                );


            // ==================================
            // MODIFICATION
            // ==================================

            if (idModification) {

                const index =
                    reparations.findIndex(
                        function(item) {

                            return (
                                item.id ===
                                idModification
                            );

                        }
                    );


                if (index === -1) {

                    alert(
                        "❌ Réparation introuvable."
                    );

                    localStorage.removeItem(
                        "reparationAModifier"
                    );

                    return;
                }


                const ancienne =
                    reparations[index];


                /*
                 * IMPORTANT :
                 * On ne modifie pas le montant payé
                 * ici si des paiements par tranche
                 * ont déjà été enregistrés.
                 *
                 * Le paiement doit passer par paiement.html.
                 */

                const ancienPaye =
                    Number(
                        ancienne.paye
                    ) || 0;


                if (paye < ancienPaye) {

                    alert(
                        "❌ Le montant payé ne peut pas être diminué ici.\n\n" +
                        "Utilisez la page Paiements pour gérer les paiements."
                    );

                    return;
                }


                reparations[index].clientId =
                    client.id;


                reparations[index].client =
                    client.nom;


                reparations[index].telephone =
                    client.telephone;


                reparations[index].appareil =
                    appareil;


                reparations[index].panne =
                    panne;


                reparations[index].prix =
                    prix;


                reparations[index].paye =
                    paye;


                reparations[index].reste =
                    Math.max(
                        prix - paye,
                        0
                    );


                reparations[index].statut =
                    statut;


                // Conserver la date originale


                sauvegarderReparations(
                    reparations
                );


                localStorage.removeItem(
                    "reparationAModifier"
                );


                alert(
                    "✅ Réparation modifiée avec succès."
                );

            }


            // ==================================
            // NOUVELLE REPARATION
            // ==================================

            else {

                const nouvelleReparation = {

                    id:
                        Date.now().toString(),

                    clientId:
                        client.id,

                    client:
                        client.nom,

                    telephone:
                        client.telephone,

                    appareil:
                        appareil,

                    panne:
                        panne,

                    prix:
                        prix,

                    paye:
                        paye,

                    reste:
                        Math.max(
                            prix - paye,
                            0
                        ),

                    statut:
                        statut,

                    statutPaiement:
                        paye === prix
                            ? "Payée"
                            : paye > 0
                                ? "Partiellement payée"
                                : "Non payée",

                    date:
                        new Date().toISOString()

                };


                reparations.push(
                    nouvelleReparation
                );


                sauvegarderReparations(
                    reparations
                );


                // ==================================
                // CREER LE PREMIER PAIEMENT
                // ==================================

                if (paye > 0) {

                    const paiements =
                        JSON.parse(
                            localStorage.getItem(
                                "paiements"
                            )
                        ) || [];


                    paiements.push({

                        id:
                            Date.now().toString() +
                            "-initial",

                        reparationId:
                            nouvelleReparation.id,

                        clientId:
                            client.id,

                        client:
                            client.nom,

                        telephone:
                            client.telephone,

                        appareil:
                            appareil,

                        montant:
                            paye,

                        type:
                            "Paiement initial",

                        note:
                            "Paiement lors de l'enregistrement de la réparation.",

                        date:
                            new Date().toISOString(),

                        utilisateur:
                            sessionStorage.getItem(
                                "monAtelierUtilisateur"
                            ) || "admin",

                        role:
                            obtenirRoleReparation()

                    });


                    localStorage.setItem(
                        "paiements",
                        JSON.stringify(
                            paiements
                        )
                    );

                }


                alert(
                    "✅ Réparation enregistrée avec succès."
                );

            }


            // ==================================
            // RESET
            // ==================================

            formReparation.reset();


            const payeElement =
                document.getElementById(
                    "paye"
                );


            if (payeElement) {

                payeElement.value =
                    0;

            }


            calculerReste();


            // ==================================
            // TITRE
            // ==================================

            const titre =
                document.getElementById(
                    "titreFormulaireReparation"
                );


            if (titre) {

                titre.textContent =
                    "➕ Nouvelle réparation";

            }


            // ==================================
            // BOUTON
            // ==================================

            const bouton =
                document.querySelector(
                    "#formReparation button[type='submit']"
                );


            if (bouton) {

                bouton.textContent =
                    "💾 Enregistrer la réparation";

            }


            // ==================================
            // ACTUALISER
            // ==================================

            afficherReparations();


            if (
                typeof afficherStatistiques ===
                "function"
            ) {

                afficherStatistiques();

            }

        }
    );

}


// ==========================================
// MODIFIER REPARATION
// ==========================================

function modifierReparation(id) {

    if (!peutModifierReparation()) {

        alert(
            "❌ Vous n'avez pas l'autorisation de modifier cette réparation."
        );

        return;
    }


    const reparations =
        getReparations();


    const reparation =
        reparations.find(
            function(item) {

                return item.id === id;

            }
        );


    if (!reparation) {

        alert(
            "❌ Réparation introuvable."
        );

        return;
    }


    localStorage.setItem(
        "reparationAModifier",
        id
    );


    chargerReparationAModifier();

}


// ==========================================
// ANNULER MODIFICATION
// ==========================================

function annulerModificationReparation() {

    localStorage.removeItem(
        "reparationAModifier"
    );


    const form =
        document.getElementById(
            "formReparation"
        );


    if (form) {
        form.reset();
    }


    const paye =
        document.getElementById(
            "paye"
        );


    if (paye) {
        paye.value = 0;
    }


    calculerReste();


    const titre =
        document.getElementById(
            "titreFormulaireReparation"
        );


    if (titre) {

        titre.textContent =
            "➕ Nouvelle réparation";

    }


    const bouton =
        document.querySelector(
            "#formReparation button[type='submit']"
        );


    if (bouton) {

        bouton.textContent =
            "💾 Enregistrer la réparation";

    }

}


// ==========================================
// SUPPRIMER REPARATION
// ==========================================

function supprimerReparation(id) {

    if (!peutSupprimerReparation()) {

        alert(
            "❌ Seul l'Administrateur peut supprimer une réparation."
        );

        return;
    }


    const reparations =
        getReparations();


    const reparation =
        reparations.find(
            function(item) {

                return item.id === id;

            }
        );


    if (!reparation) {

        alert(
            "❌ Réparation introuvable."
        );

        return;
    }


    const confirmer =
        confirm(
            "⚠️ Voulez-vous vraiment supprimer cette réparation ?\n\n" +
            "Client : " +
            (reparation.client || "Inconnu") +
            "\n" +
            "Appareil : " +
            (reparation.appareil || "Appareil")
        );


    if (!confirmer) {
        return;
    }


    const nouvellesReparations =
        reparations.filter(
            function(item) {

                return item.id !== id;

            }
        );


    sauvegarderReparations(
        nouvellesReparations
    );


    // ==================================
    // SUPPRIMER AUSSI LES PAIEMENTS
    // ==================================

    try {

        const paiements =
            JSON.parse(
                localStorage.getItem(
                    "paiements"
                )
            ) || [];


        const nouveauxPaiements =
            paiements.filter(
                function(paiement) {

                    return (
                        paiement.reparationId !==
                        id
                    );

                }
            );


        localStorage.setItem(
            "paiements",
            JSON.stringify(
                nouveauxPaiements
            )
        );

    } catch (erreur) {

        console.error(
            "Erreur suppression paiements :",
            erreur
        );

    }


    afficherReparations();


    if (
        typeof afficherStatistiques ===
        "function"
    ) {

        afficherStatistiques();

    }


    alert(
        "✅ Réparation supprimée."
    );

}


// ==========================================
// RECHERCHE
// ==========================================

function rechercherReparation() {

    const input =
        document.getElementById(
            "rechercheReparation"
        );


    if (!input) {
        return;
    }


    afficherReparations(
        input.value
    );

}


// ==========================================
// AFFICHER LES REPARATIONS
// ==========================================

function afficherReparations(
    recherche = ""
) {

    const liste =
        document.getElementById(
            "listeReparations"
        );


    if (!liste) {
        return;
    }


    const reparations =
        getReparations();


    const texteRecherche =
        recherche
            .toLowerCase()
            .trim();


    const resultats =
        reparations.filter(
            function(reparation) {

                if (!texteRecherche) {
                    return true;
                }


                const texte =
                    (
                        reparation.client ||
                        ""
                    ) +
                    " " +
                    (
                        reparation.telephone ||
                        ""
                    ) +
                    " " +
                    (
                        reparation.appareil ||
                        ""
                    ) +
                    " " +
                    (
                        reparation.panne ||
                        ""
                    );


                return texte
                    .toLowerCase()
                    .includes(
                        texteRecherche
                    );

            }
        );


    if (resultats.length === 0) {

        liste.innerHTML = `

            <div class="empty">

                <div class="empty-icon">
                    🔧
                </div>

                <h3>
                    Aucune réparation
                </h3>

                <p>
                    Aucune réparation ne correspond
                    à votre recherche.
                </p>

            </div>

        `;

        return;
    }


    liste.innerHTML = "";


    resultats
        .slice()
        .reverse()
        .forEach(
            function(reparation) {

                const prix =
                    Number(
                        reparation.prix
                    ) || 0;


                const paye =
                    Number(
                        reparation.paye
                    ) || 0;


                const reste =
                    Math.max(
                        prix - paye,
                        0
                    );


                const element =
                    document.createElement(
                        "div"
                    );


                element.className =
                    "reparation-item";


                // ==================================
                // ACTIONS
                // ==================================

                let actions = "";


                if (
                    peutModifierReparation()
                ) {

                    actions += `

                        <button
                            type="button"
                            class="btn-edit"
                            onclick="modifierReparation('${reparation.id}')">

                            ✏️ Modifier

                        </button>

                    `;


                    if (reste > 0) {

                        actions += `

                            <button
                                type="button"
                                class="btn-primary"
                                onclick="ouvrirPaiement('${reparation.id}')">

                                💵 Payer le reste

                            </button>

                        `;

                    }

                }


                if (
                    peutSupprimerReparation()
                ) {

                    actions += `

                        <button
                            type="button"
                            class="btn-delete"
                            onclick="supprimerReparation('${reparation.id}')">

                            🗑️ Supprimer

                        </button>

                    `;

                }


                // ==================================
                // STATUT PAIEMENT
                // ==================================

                let statutPaiement =
                    "Non payée";


                if (reste === 0) {

                    statutPaiement =
                        "Payée";

                } else if (paye > 0) {

                    statutPaiement =
                        "Partiellement payée";

                }


                // ==================================
                // AFFICHAGE
                // ==================================

                element.innerHTML = `

                    <div class="reparation-header">

                        <h3>
                            🔧
                            ${echapperHTMLReparation(
                                reparation.appareil ||
                                "Appareil"
                            )}
                        </h3>

                        <span class="statut">
                            ${echapperHTMLReparation(
                                reparation.statut ||
                                "En attente"
                            )}
                        </span>

                    </div>


                    <p>
                        👤
                        <strong>Client :</strong>
                        ${echapperHTMLReparation(
                            reparation.client ||
                            "Inconnu"
                        )}
                    </p>


                    <p>
                        📞
                        <strong>Téléphone :</strong>
                        ${echapperHTMLReparation(
                            reparation.telephone ||
                            "Non renseigné"
                        )}
                    </p>


                    <p>
                        🔍
                        <strong>Panne :</strong>
                        ${echapperHTMLReparation(
                            reparation.panne ||
                            "Non renseignée"
                        )}
                    </p>


                    <div class="montants-reparation">

                        <div>
                            <span>
                                Prix
                            </span>

                            <strong>
                                ${formatMontant(prix)}
                            </strong>
                        </div>


                        <div>
                            <span>
                                Payé
                            </span>

                            <strong>
                                ${formatMontant(paye)}
                            </strong>
                        </div>


                        <div>
                            <span>
                                Reste
                            </span>

                            <strong>
                                ${formatMontant(reste)}
                            </strong>
                        </div>

                    </div>


                    <p>
                        💳
                        <strong>Paiement :</strong>
                        ${statutPaiement}
                    </p>


                    ${
                        reparation.date
                        ? `
                            <small>
                                📅
                                ${new Date(
                                    reparation.date
                                ).toLocaleString(
                                    "fr-FR"
                                )}
                            </small>
                        `
                        : ""
                    }


                    <div class="reparation-actions">

                        ${actions}

                    </div>

                `;


                liste.appendChild(
                    element
                );

            }
        );

}


// ==========================================
// OUVRIR PAIEMENT
// ==========================================

function ouvrirPaiement(id) {

    if (!peutModifierReparation()) {

        alert(
            "❌ Vous n'avez pas l'autorisation d'enregistrer un paiement."
        );

        return;
    }


    window.location.href =
        "paiement.html?reparation=" +
        encodeURIComponent(id);

}


// ==========================================
// ECHAPPER HTML
// ==========================================

function echapperHTMLReparation(
    texte
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(texte);


    return div.innerHTML;

}


// ==========================================
// INITIALISATION
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        chargerClients();

        calculerReste();

        afficherReparations();

        chargerReparationAModifier();


        const prix =
            document.getElementById(
                "prix"
            );


        const paye =
            document.getElementById(
                "paye"
            );


        const recherche =
            document.getElementById(
                "rechercheReparation"
            );


        if (prix) {

            prix.addEventListener(
                "input",
                calculerReste
            );

        }


        if (paye) {

            paye.addEventListener(
                "input",
                calculerReste
            );

        }


        if (recherche) {

            recherche.addEventListener(
                "input",
                function() {

                    afficherReparations(
                        recherche.value
                    );

                }
            );

        }

    }
);
