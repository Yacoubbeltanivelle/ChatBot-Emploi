function afficherResultat() {
    const infoEntreprise = document.getElementById('infoEntreprise').value;
    const infoUtilisateur = document.getElementById('infoUtilisateur').value;
    const resultat = `Entreprise: ${infoEntreprise} | Utilisateur: ${infoUtilisateur}`;
    document.getElementById('resultat').innerText = resultat;
}