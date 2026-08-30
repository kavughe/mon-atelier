
// ==========================================
// MON ATELIER - PROTECTION ET ROLES
// ==========================================

(function () {

    const connecte =
        sessionStorage.getItem("monAtelierConnecte");

    const role =
        sessionStorage.getItem("monAtelierRole");


    // ==========================================
    // PAS CONNECTE
    // ==========================================

    if (connecte !== "true") {

        window.location.replace("connexion.html");

        return;
    }


    // ==========================================
    // ROLE INVALIDE
    // ==========================================

    const rolesAutorises = [
        "admin",
        "reception",
        "consultation"
    ];


    if (!rolesAutorises.includes(role)) {

        sessionStorage.clear();

        window.location.replace("connexion.html");

        return;
    }


    // ==========================================
    // FONCTIONS DISPONIBLES
    // ==========================================

    window.monAtelierRole = role;


    window.estAdmin = function () {
        return role === "admin";
    };


    window.estReception = function () {
        return role === "reception";
    };


    window.estConsultation = function () {
        return role === "consultation";
    };


    window.peutModifier = function () {
        return (
            role === "admin" ||
            role === "reception"
        );
    };


    window.peutSupprimer = function () {
        return role === "admin";
    };

})();
