
// ==========================================
// MON ATELIER - GESTION DES CLIENTS
// Admin + Réception + Consultation
// ==========================================


// ==========================================
// RECUPERER LES CLIENTS
// ==========================================

function getClients() {

    try {

        return JSON.parse(
            localStorage.getItem("clients")
        ) || [];

    } catch (erreur) {

        console.error(
            "Erreur clients :",
            erreur
        );

        return [];
    }
}


// ==========================================
// SAUVEGARDER LES CLIENTS
// ==========================================

function sauvegarderClients(clients) {

    localStorage.setItem(
        "clients",
        JSON.stringify(clients)
    );
}


// ==========================================
// VERIFIER LE ROLE
// ==========================================

function obtenirRole() {

    return sessionStorage.getItem(
        "monAtelierRole"
    ) || "";
}


function peutModifierClient() {

    const role = obtenirRole();

    return (
        role === "admin" ||
        role === "reception"
    );
}


function peutSupprimerClient() {

    return obtenirRole() === "admin";
}


// ==========================================
// AFFICHER LE NOMBRE DE CLIENTS
// ==========================================

function afficherNombreClients() {

    const clients = getClients();

    const nombre =
        document.getElementById(
            "nombreClients"
        );

    const total =
        document.getElementById(
            "totalClients"
        );


    if (nombre) {
        nombre.textContent = clients.length;
    }


    if (total) {
        total.textContent = clients.length;
    }
}


// ==========================================
// AFFICHER LES CLIENTS
// ==========================================

function afficherClients(
    recherche = ""
) {

    const liste =
        document.getElementById(
            "listeClients"
        );


    if (!liste) {
        return;
    }


    const clients = getClients();


    const rechercheTexte =
        recherche
            .toLowerCase()
            .trim();


    const resultats =
        clients.filter(
            function(client) {

                if (!rechercheTexte) {
                    return true;
                }


                const texte =
                    (
                        client.nom || ""
                    ) +
                    " " +
                    (
                        client.telephone || ""
                    );


                return texte
                    .toLowerCase()
                    .includes(
                        rechercheTexte
                    );

            }
        );


    // Aucun résultat

    if (resultats.length === 0) {

        liste.innerHTML = `

            <div class="empty">

                <div class="empty-icon">
                    👥
                </div>

                <h3>
                    Aucun client
                </h3>

                <p>
                    Aucun client ne correspond
                    à votre recherche.
                </p>

            </div>

        `;

        afficherNombreClients();

        return;
    }


    liste.innerHTML = "";


    resultats
        .slice()
        .reverse()
        .forEach(
            function(client) {

                const element =
                    document.createElement(
                        "div"
                    );


                element.className =
                    "client-item";


                // ==================================
                // BOUTONS
                // ==================================

                let boutons = "";


                if (peutModifierClient()) {

                    boutons += `

                        <button
                            type="button"
                            class="btn-edit"
                            onclick="modifierClient('${client.id}')">

                            ✏️ Modifier

                        </button>

                    `;

                }


                if (peutSupprimerClient()) {

                    boutons += `

                        <button
                            type="button"
                            class="btn-delete"
                            onclick="supprimerClient('${client.id}')">

                            🗑️ Supprimer

                        </button>

                    `;

                }


                // ==================================
                // AFFICHAGE
                // ==================================

                element.innerHTML = `

                    <div class="client-info">

                        <div class="client-avatar">
                            👤
                        </div>


                        <div class="client-details">

                            <h3>
                                ${echapperHTML(
                                    client.nom ||
                                    "Client sans nom"
                                )}
                            </h3>


                            <p>
                                📞
                                ${echapperHTML(
                                    client.telephone ||
                                    "Téléphone non renseigné"
                                )}
                            </p>


                            <small>
                                ID :
                                ${echapperHTML(
                                    client.id || ""
                                )}
                            </small>

                        </div>

                    </div>


                    <div class="client-actions">

                        ${boutons}

                    </div>

                `;


                liste.appendChild(
                    element
                );

            }
        );


    afficherNombreClients();

}


// ==========================================
// ECHAPPER HTML
// ==========================================

function echapperHTML(texte) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        String(texte);

    return div.innerHTML;
}


// ==========================================
// AJOUTER / MODIFIER CLIENT
// ==========================================

const formClient =
    document.getElementById(
        "formClient"
    );


if (formClient) {

    formClient.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            // ==================================
            // VERIFIER LES DROITS
            // ==================================

            if (!peutModifierClient()) {

                afficherMessageClient(
                    "❌ Vous n'avez pas l'autorisation de modifier les clients.",
                    "error"
                );

                return;
            }


            // ==================================
            // CHAMPS
            // ==================================

            const id =
                document.getElementById(
                    "clientId"
                ).value.trim();


            const nom =
                document.getElementById(
                    "nom"
                ).value.trim();


            const telephone =
                document.getElementById(
                    "telephone"
                ).value.trim();


            // ==================================
            // VERIFICATION
            // ==================================

            if (!nom) {

                afficherMessageClient(
                    "❌ Veuillez saisir le nom du client.",
                    "error"
                );

                return;
            }


            if (!telephone) {

                afficherMessageClient(
                    "❌ Veuillez saisir le numéro de téléphone.",
                    "error"
                );

                return;
            }


            let clients =
                getClients();


            // ==================================
            // MODIFICATION
            // ==================================

            if (id) {

                const index =
                    clients.findIndex(
                        function(client) {

                            return (
                                client.id === id
                            );

                        }
                    );


                if (index === -1) {

                    afficherMessageClient(
                        "❌ Client introuvable.",
                        "error"
                    );

                    return;
                }


                clients[index].nom =
                    nom;

                clients[index].telephone =
                    telephone;


                sauvegarderClients(
                    clients
                );


                afficherMessageClient(
                    "✅ Client modifié avec succès.",
                    "success"
                );

            }


            // ==================================
            // NOUVEAU CLIENT
            // ==================================

            else {

                const nouveauClient = {

                    id:
                        Date.now().toString(),

                    nom:
                        nom,

                    telephone:
                        telephone,

                    date:
                        new Date().toISOString()

                };


                clients.push(
                    nouveauClient
                );


                sauvegarderClients(
                    clients
                );


                afficherMessageClient(
                    "✅ Client ajouté avec succès.",
                    "success"
                );

            }


            // ==================================
            // RESET
            // ==================================

            formClient.reset();


            const clientId =
                document.getElementById(
                    "clientId"
                );


            if (clientId) {
                clientId.value = "";
            }


            const titre =
                document.getElementById(
                    "titreFormulaireClient"
                );


            if (titre) {

                titre.textContent =
                    "➕ Ajouter un client";

            }


            const bouton =
                document.getElementById(
                    "btnEnregistrerClient"
                );


            if (bouton) {

                bouton.textContent =
                    "💾 Enregistrer le client";

            }


            // ==================================
            // ACTUALISER
            // ==================================

            afficherClients();

            afficherNombreClients();


            // Actualiser également
            // la liste des clients utilisée
            // dans reparations.html

            if (
                typeof chargerClients ===
                "function"
            ) {

                chargerClients();

            }

        }
    );

}


// ==========================================
// MODIFIER CLIENT
// ==========================================

function modifierClient(id) {

    // Vérification réelle du rôle

    if (!peutModifierClient()) {

        alert(
            "❌ Vous n'avez pas l'autorisation de modifier ce client."
        );

        return;
    }


    const clients =
        getClients();


    const client =
        clients.find(
            function(item) {

                return item.id === id;

            }
        );


    if (!client) {

        alert(
            "❌ Client introuvable."
        );

        return;
    }


    const clientId =
        document.getElementById(
            "clientId"
        );


    const nom =
        document.getElementById(
            "nom"
        );


    const telephone =
        document.getElementById(
            "telephone"
        );


    if (clientId) {
        clientId.value =
            client.id;
    }


    if (nom) {
        nom.value =
            client.nom || "";
    }


    if (telephone) {
        telephone.value =
            client.telephone || "";
    }


    const titre =
        document.getElementById(
            "titreFormulaireClient"
        );


    if (titre) {

        titre.textContent =
            "✏️ Modifier le client";

    }


    const bouton =
        document.getElementById(
            "btnEnregistrerClient"
        );


    if (bouton) {

        bouton.textContent =
            "💾 Enregistrer les modifications";

    }


    // Faire défiler vers le formulaire

    const zone =
        document.getElementById(
            "zoneFormulaireClient"
        );


    if (zone) {

        zone.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

}


// ==========================================
// ANNULER MODIFICATION
// ==========================================

function annulerModificationClient() {

    const form =
        document.getElementById(
            "formClient"
        );


    if (form) {
        form.reset();
    }


    const clientId =
        document.getElementById(
            "clientId"
        );


    if (clientId) {
        clientId.value = "";
    }


    const titre =
        document.getElementById(
            "titreFormulaireClient"
        );


    if (titre) {

        titre.textContent =
            "➕ Ajouter un client";

    }


    const bouton =
        document.getElementById(
            "btnEnregistrerClient"
        );


    if (bouton) {

        bouton.textContent =
            "💾 Enregistrer le client";

    }


    afficherMessageClient(
        "",
        ""
    );

}


// ==========================================
// SUPPRIMER CLIENT
// ==========================================

function supprimerClient(id) {

    // ==================================
    // ADMIN UNIQUEMENT
    // ==================================

    if (!peutSupprimerClient()) {

        alert(
            "❌ Seul l'Administrateur peut supprimer un client."
        );

        return;
    }


    const clients =
        getClients();


    const client =
        clients.find(
            function(item) {

                return item.id === id;

            }
        );


    if (!client) {

        alert(
            "❌ Client introuvable."
        );

        return;
    }


    // ==================================
    // VERIFIER LES REPARATIONS
    // ==================================

    let reparations = [];


    try {

        reparations =
            JSON.parse(
                localStorage.getItem(
                    "reparations"
                )
            ) || [];

    } catch (erreur) {

        reparations = [];

    }


    const aDesReparations =
        reparations.some(
            function(reparation) {

                return (
                    reparation.clientId ===
                    id
                );

            }
        );


    if (aDesReparations) {

        const continuer =
            confirm(
                "⚠️ Ce client possède des réparations enregistrées.\n\n" +
                "Voulez-vous vraiment supprimer le client ?\n\n" +
                "Les réparations existantes seront conservées."
            );


        if (!continuer) {
            return;
        }

    } else {

        const confirmer =
            confirm(
                "Voulez-vous vraiment supprimer le client « " +
                client.nom +
                " » ?"
            );


        if (!confirmer) {
            return;
        }

    }


    // ==================================
    // SUPPRESSION
    // ==================================

    const nouveauxClients =
        clients.filter(
            function(item) {

                return item.id !== id;

            }
        );


    sauvegarderClients(
        nouveauxClients
    );


    // ==================================
    // ACTUALISER
    // ==================================

    afficherClients();

    afficherNombreClients();


    // Actualiser la liste client
    // de la page réparation

    if (
        typeof chargerClients ===
        "function"
    ) {

        chargerClients();

    }


    alert(
        "✅ Client supprimé avec succès."
    );

}


// ==========================================
// RECHERCHE
// ==========================================

function rechercherClient() {

    const input =
        document.getElementById(
            "rechercheClient"
        );


    if (!input) {
        return;
    }


    afficherClients(
        input.value
    );

}


// ==========================================
// MESSAGE
// ==========================================

function afficherMessageClient(
    texte,
    type
) {

    const message =
        document.getElementById(
            "messageClient"
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
// INITIALISATION
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        afficherClients();

        afficherNombreClients();


        // Recherche instantanée

        const recherche =
            document.getElementById(
                "rechercheClient"
            );


        if (recherche) {

            recherche.addEventListener(
                "input",
                function() {

                    afficherClients(
                        recherche.value
                    );

                }
            );

        }

    }
);
