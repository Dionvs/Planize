# Poproute 57

Een gedeelde schoonmaak- en takenapp voor een gezin. De website wordt gehost via GitHub Pages. Firebase Firestore blijft de centrale database voor realtime synchronisatie tussen alle apparaten.

De app gebruikt:

- HTML, CSS en JavaScript
- Firebase Web SDK via CDN-imports
- Firebase Firestore voor gedeelde taken en ruimtes
- GitHub Pages voor hosting
- `localStorage` alleen voor lokale voorkeuren

Er is geen Firebase Hosting, Firebase CLI, gebruikerslogin, Google OAuth of Google Calendar API nodig.

## 1. Firebase-project maken

1. Ga naar de [Firebase Console](https://console.firebase.google.com/).
2. Klik op `Een project maken`.
3. Geef het project een naam.
4. Rond de projectinstellingen af.

## 2. Firestore Database aanmaken

1. Open het Firebase-project.
2. Ga naar `Firestore Database`.
3. Klik op `Database maken`.
4. Kies een geschikte locatie.
5. Start eventueel in testmodus.

De eenvoudige tussenversie gebruikt de collection `tasks` voor:

- huishoudelijke taken met een `familyId`;
- gezinsgegevens met `documentType: "family-settings"`;
- gedeelde ruimtes met `documentType: "room-settings"`.

Bestaande taken zonder `familyId` worden automatisch gezien als taken van `Poproute 57`.

## 3. Web App registreren

1. Open in Firebase `Projectinstellingen` via het tandwiel.
2. Ga naar `Je apps`.
3. Klik op het webicoon `</>`.
4. Geef de webapp een naam.
5. Firebase Hosting hoeft niet aangezet te worden.
6. Klik op `App registreren`.

## 4. Firebase-config invullen

Firebase toont een configuratieblok. Kopieer de waarden naar `firebase-config.js`.

Het bestand moet deze vorm houden:

```js
export const firebaseConfig = {
  apiKey: "jouw-api-key",
  authDomain: "jouw-project.firebaseapp.com",
  projectId: "jouw-project-id",
  storageBucket: "jouw-project.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  measurementId: "G-ABCDEFGHIJ"
};
```

De Firebase webconfig is geen geheim wachtwoord. De Firestore security rules bepalen wie gegevens kan lezen en wijzigen.

## 5. Firestore security rules instellen

Open `Firestore Database` en daarna het tabblad `Rules`. Gebruik voor deze privéversie:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      allow read, write: if true;
    }
  }
}
```

Klik daarna op `Publish`.

Waarschuwing: iedereen die de link en Firebase-projectgegevens heeft, kan technisch gezien alle gezinsdocumenten lezen of aanpassen. De gezinscode wordt gehasht opgeslagen, maar is zonder Firebase Authentication nog steeds geen echte databasebeveiliging. Deze tussenversie is alleen geschikt voor testen en kleinschalig privégebruik.

## 6. GitHub-repository maken

1. Ga naar [GitHub](https://github.com/).
2. Log in of maak een account.
3. Klik op `New repository`.
4. Geef de repository bijvoorbeeld de naam `poproute-57`.
5. Kies `Public` als je GitHub Pages gratis vanuit deze repository wilt gebruiken.
6. Klik op `Create repository`.

Let op: een publieke repository maakt de broncode en Firebase webconfig zichtbaar. De open Firestore rules hierboven zijn daarom alleen geschikt voor deze eenvoudige privéopzet.

## 7. Projectbestanden uploaden naar GitHub

Upload minimaal deze bestanden naar de hoofdmap van de repository:

- `index.html`
- `style.css`
- `script.js`
- `firebase-config.js`
- `manifest.json`
- `service-worker.js`
- `README.md`

Via de GitHub-website:

1. Open de repository.
2. Kies `Add file` en daarna `Upload files`.
3. Sleep de projectbestanden naar het uploadvak.
4. Voeg een korte omschrijving toe.
5. Klik op `Commit changes`.

## 8. GitHub Pages aanzetten

1. Open de repository op GitHub.
2. Ga naar `Settings`.
3. Kies links `Pages`.
4. Kies bij `Build and deployment` de optie `Deploy from a branch`.

## 9. Branch main kiezen

Kies bij `Branch`:

```txt
main
```

## 10. Folder /root kiezen

Kies naast de branch:

```txt
/(root)
```

Klik daarna op `Save`. GitHub bouwt de website. Dit kan enkele minuten duren.

## 11. GitHub Pages-link openen

De link heeft meestal deze vorm:

```txt
https://jouw-gebruikersnaam.github.io/poproute-57/
```

Open deze link op meerdere telefoons, tablets of computers. Alle apparaten gebruiken dezelfde Firestore-database en zien wijzigingen realtime.

## Lokaal testen

Gebruik een lokale webserver omdat de app JavaScript modules en een service worker gebruikt.

```bash
python -m http.server 5000
```

Open daarna:

```txt
http://localhost:5000
```

## Gezinnen en codes

Op het openingsscherm kan iemand:

- een bestaand gezin openen met gezinsnaam en code;
- een nieuw gezin aanmaken met een eigen naam en code.

De code wordt als SHA-256-hash opgeslagen. `Poproute 57` blijft voor bestaande data beschikbaar met de oude code `1234`. De gekozen gezinssessie wordt lokaal onthouden totdat op `Uit` wordt geklikt.

Voor een publieke uitgave moet dit later worden vervangen door Firebase Authentication, echte gebruikersaccounts, gezinslidmaatschappen en strengere Firestore-rules.

## Agenda en meldingen

De agenda-export gebruikt alleen Google Calendar-links en `.ics`-bestanden. Er is geen Google Calendar API of OAuth. Browsermeldingen verschijnen alleen wanneer de app geopend is; dit zijn geen echte pushmeldingen.

## PWA-iconen

Het manifest verwijst naar:

- `icons/icon-192.png`
- `icons/icon-512.png`

Voeg deze PNG-bestanden later toe voor een volledig afgewerkt appicoon. De website blijft zonder iconen bruikbaar.
