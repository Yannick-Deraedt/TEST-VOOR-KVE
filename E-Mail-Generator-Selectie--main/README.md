# Selectie generator KVE Drongen

## Hoe gebruik je dit?
- installeer een IDE voor webdevelopment (zoals [Webstorm](https://www.jetbrains.com/webstorm/download/?section=windows))
- Git clone of download dit project naar een map
- Open de map via de IDE
- Ga naar het bestand package.json en voer het dev script uit (groene driehoekje ernaast)
- Open de lokale website (localhost/...)

## Hoe voeg ik spelers toe?
- Pas het bestand public/squad_players.txt aan
- Per lijn zet je de volledige naam van een speler
- Keepers voeg je op dezelfde manier toe in het bestand public/keepers.txt
  - Keepers worden enkel getoond in de niet-selectie als ze een reden of opmerking hebben

## Hoe voeg ik extra redenen toe voor niet-selectie
- De lijst staat in het bestand src/App.tsx
- Je kan zelf elementen toevoegen/verwijderen/aanpassen

## Hoe deel ik dit op ProSoccerData?
- Vul alles in
- Druk op de kopieer-knop
- Plak het in een psd-mail
    - Je kan handmatig nog zaken aanpassen in psd
