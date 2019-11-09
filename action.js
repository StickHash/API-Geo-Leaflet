//Ces variables permettent de centrer la map au milieu de la France
let latCentre = 45.786833;
let lonCentre = 3.110069;
let zoomCentre = 5;
let myMap = null;

//Initialisation de la map
function initMap(lat,lon,zoom) 
{
	myMap = L.map('mapid').setView([lat, lon], zoom);    
    L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', 
	{                   
		attribution: 'données © <a href="//osm.org/copyright">OpenStreetMap</a>/ODbL - rendu <a href="//openstreetmap.fr">OSM France</a>',
        minZoom: 1,
        maxZoom: 20
    }).addTo(myMap);            
			
}

//en JQuery le $(function(){}) correspond au document.ready du JS
$(function () {
    initMap(latCentre,lonCentre,zoomCentre); //On initialise la carte
    
	let selection = L.layerGroup(); //Ceci est un groupe de marker, il servira à afficher les markers sur la carte
    
	$("#choice").hide(); //De base on cache la liste de déroulante de choix de ville, qui est pour l'instant vide
    
	//Au click sur le bouton de recherche on déclenche la requete ajax vers l'API geo.gouv qui va nous permettre 
	//de récupérer la liste des communes dont le nom se rapproche de celui inscrit dans le champ de recherche
	$("#searching").click(function () {
		$("#info").empty();
        let city = $("#city").val();
        let request = `https://geo.api.gouv.fr/communes?nom=${city}`;
        $.ajax({
            url: request,
            method: "GET"
        }).done(function (cities) {
			//On vérifie que la reponse n'est pas vide
			if(cities != 0){
				$("#city").empty();
				$("#select-choice").empty();
				$("#select-choice").append(`<option value="">Choix</option>`);
				cities.forEach((city) => {
					$("#select-choice").append(`<option value="${city.code}">${city.nom}(${city.codeDepartement})</option>`);
				});
				$("#choice").show(); //La liste déroulante de choix s'affiche avec les noms des différentes communes trouvées par l'API
				$("#city").val('');
			}
			//Sinon on affiche un message invitant l'utilisateur à réitérer son choix
			else{
				$("#info").append(`<h2>Nous n'avons pas trouvé cette commune. Essayez autre chose.</h2>`);
			}
		//Si la requete n'aboutie pas, on utilise la div 'info' pour signaler le probleme
        }).fail(function() {
			$("#info").append(`<h2>Une erreur s'est produite veuillez recommencer ou entrez une autre recherche</h2>`);
		});
    });
	
	//Dès que l'on sélectionne une commune dans la liste de choix, on déclenche un requete ajax vers l'API adresse.gouv.
	//Ici on cherche à récupérer les coordonnees geographique de la ville choisie pour ajouter un marker à notre carte, 
	//ainsi que diverses info sur la ville en question que l'on viendra afficher lors du clique sur ce dernier.
    $("#select-choice").change(function () {
        let code = $("#select-choice").val();
        let city = $( "#select-choice option:selected" ).text();
        let request = `https://api-adresse.data.gouv.fr/search/?q=${city}&citycode=${code}`;
        $.ajax({
            url: request,
            method: "GET"
        }).done(function (data) {
            $("#choice").hide(); //On recache la liste de choix
			//Traitement du fichier Json pour récupérer les infos
            const info = data.features[0];
            let lat = info.geometry.coordinates[1];
            let lon = info.geometry.coordinates[0];
            let zoom = 9;
            let region = info.properties.context.split(",");
            let population = info.properties.population;
			//On créer le marker avec ses coordonnees
            marker = L.marker([lat, lon]);
			//On vide le groupe de markers
            selection.clearLayers();
			//Et on ajoute celui fraichement créé dans la le groupe
            marker.addTo(selection)
			//On ajoute egalement des fonctions a ce marker, un popup qui s'ouvre au click et qui affiche un lien vers une recherche google avec le nom de la commune
                .bindPopup(`<a target="_blank" rel="noopener noreferrer" href=https://www.google.fr/search?q=${city} >Info sur la commune</a>`)
			//La div 'info' se remplie avec les infos receuillies sur la commune à l'ouverture du popup	
                .on('popupopen', function () {
                    $("#info").append(`
                    <h4>Région: ${region[2]}</h4>
                    <h5>Département: ${region[1]}(${region[0]})</h5>
                    <h6>Nombre d'habitants: ${population}</h6>
                    `);
                 })
			//La div 'info' est vidée si l'on ferme le popup
                 .on('popupclose', function () {
                    $("#info").empty();
                 });
			//Le groupe de markers est ajoute à la map
            selection.addTo(myMap);
			//On effectue un zoom vers la position du marker
            myMap.flyTo([lat, lon], zoom);
        });
    });
});

