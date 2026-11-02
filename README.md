# De Gouden Schaar

Nieuwe website voor De Gouden Schaar, mercerie in Ledeberg sinds 1910.
Gebouwd met [Jekyll](https://jekyllrb.com/), zodat GitHub Pages de site zelf kan bouwen en publiceren.

## Website bewerken (voor de winkel)

Open **https://sander-sdv.github.io/De-Gouden-Schaar/bewerken/** (zet er een bladwijzer van).

1. Klik op een tekst en typ. Klik op een foto om ze te vervangen.
2. Met **×** verwijder je een categorie, foto, dienst of jaartal; met **+ Nieuwe … toevoegen** voeg je er een toe.
3. Openingsuren: klik op de uren. Maak het vakje leeg voor een gesloten dag.
4. De mededeling bovenaan zet je aan of uit met het vinkje onderaan.
5. Klik **Publiceren**. Na 1 à 2 minuten staat alles op de website.

De eerste keer vraagt de pagina een **sleutel**. Die maak je één keer per toestel aan:
[github.com → Settings → Developer settings → Fine-grained tokens → Generate new token](https://github.com/settings/personal-access-tokens/new).
Kies *Only select repositories* → deze repository, en bij *Permissions → Contents* → *Read and write*.
De sleutel blijft alleen in de browser van dat toestel bewaard, nooit in deze repository. Via **⋯ → Afmelden** wis je hem weer.

Hoe het werkt: de bewerkpagina (`bewerken.html`, code in `assets/cms/`) is dezelfde pagina als de homepagina met een editor erbij.
Bij Publiceren past ze de bestanden in `_data/` aan (commentaar blijft staan), laadt nieuwe foto's verkleind op in `assets/images/`
en maakt daar één commit van op `main`. In welke repository en branch dat gebeurt, staat onder `cms:` in `_config.yml`.

## Inhoud aanpassen in de bestanden

Alle teksten staan in eenvoudige bestanden in de map `_data/`. Je hoeft geen HTML aan te raken:

| Bestand | Wat staat erin |
| --- | --- |
| `_data/winkel.yml` | Naam, titel, intro, mededeling bovenaan, adres, telefoon, e-mail, sociale media |
| `_data/aanbod.yml` | De productcategorieën (Ritsen, Garen, …) |
| `_data/diensten.yml` | De diensten (Inleggen, Ritsen insteken, …) |
| `_data/fotos.yml` | De foto's in de galerij |
| `_data/over.yml` | Het verhaal "Over ons" en de jaartallen |
| `_data/openingsuren.yml` | De openingsuren per dag (leeg = gesloten) |

Foto's staan in `assets/images/`.

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
4. De bewerkmodus probeer je op http://localhost:4000/bewerken/. Let op: **Publiceren** schrijft ook daar echt naar GitHub (`main`). Haal de wijziging daarna lokaal op met `git pull`.
