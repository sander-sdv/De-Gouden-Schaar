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

Wordt de site eerst op een `github.io`-adres met een repo-naam gepubliceerd, zet dan in `_config.yml` `baseurl` op `"/De-Gouden-Schaar"`.
Voor het eigen domein (www.degoudenschaar.info): voeg het domein toe onder **Settings → Pages → Custom domain** en pas de DNS bij de domeinregistrar aan.

## Lokaal bekijken

```bash
bundle install
bundle exec jekyll serve
```

Open daarna http://localhost:4000.
