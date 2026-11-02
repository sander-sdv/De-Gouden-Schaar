# De Gouden Schaar

Nieuwe website voor De Gouden Schaar, mercerie in Ledeberg sinds 1910.
Gebouwd met [Jekyll](https://jekyllrb.com/), zodat GitHub Pages de site zelf kan bouwen en publiceren.

## Inhoud aanpassen

Alle teksten staan in eenvoudige bestanden in de map `_data/`. Je hoeft geen HTML aan te raken:

| Bestand | Wat staat erin |
| --- | --- |
| `_data/winkel.yml` | Naam, titel, intro, mededeling bovenaan, adres, telefoon, e-mail, sociale media |
| `_data/aanbod.yml` | De productcategorieën (Ritsen, Garen, …) |
| `_data/diensten.yml` | De diensten (Inleggen, Ritsen insteken, …) |
| `_data/fotos.yml` | De foto's in de galerij |
| `_data/over.yml` | Het verhaal "Over ons" en de jaartallen |
| `_data/openingsuren.yml` | De openingsuren per dag (leeg = gesloten) |

Foto's staan in `assets/images/`. Deze structuur is bedoeld om later een Git-gebaseerd CMS (zoals Decap CMS) bovenop te zetten.

## Publiceren met GitHub Pages

1. Ga in GitHub naar **Settings → Pages**.
2. Kies bij **Source**: *Deploy from a branch*, branch `main`, map `/ (root)`.
3. Na een minuut staat de site op `https://<gebruiker>.github.io/<repo>/`.

De site staat nu op `https://sander-sdv.github.io/De-Gouden-Schaar/`. Daarom staat in `_config.yml` `baseurl: "/De-Gouden-Schaar"`.
Voor het eigen domein (www.degoudenschaar.info): voeg het domein toe onder **Settings → Pages → Custom domain**, pas de DNS bij de domeinregistrar aan, en zet dan in `_config.yml` `url` op `"https://www.degoudenschaar.info"` en `baseurl` op `""`.

## Lokaal bekijken

Een wijziging eerst op je eigen computer bekijken, vóór ze live gaat:

**Eenmalig installeren (Windows)**
1. Installeer Ruby via [RubyInstaller](https://rubyinstaller.org/downloads/) (kies "Ruby+Devkit", laatste versie). Laat aan het einde `ridk install` lopen en kies optie 3.
2. Open een nieuwe terminal in deze map en voer uit: `gem install bundler` en daarna `bundle install`.

**Elke keer**
1. Haal de branch van de wijziging op, bv. `git fetch` en `git checkout claude/project-thread-gn67dz`.
2. Start de site: `bundle exec jekyll serve --baseurl ""`
3. Open http://localhost:4000. Wijzig je iets, dan ververst de site vanzelf na opslaan.
