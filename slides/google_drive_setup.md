# Google Drive OAuth 2.0 Setup

De methode met het Service Account is afgeschaft omdat Google dit blokkeert voor standaard @gmail.com accounts (0 bytes opslaglimiet). We gebruiken nu **OAuth 2.0 User Authentication**. Hierdoor logt het script in via jouw browser en mag het veilig namens jóu bestanden wegschrijven, gewoon via je eigen Drive-opslag!

Volg deze stappen:

## Stap 1: Google Cloud Project & Google Drive API
1. Ga naar [Google Cloud Console](https://console.cloud.google.com/).
2. Selecteer je project (bijv. Fynoy Capital) of maak een nieuwe aan.
3. Ga in het menu naar **APIs & Services > Library**.
4. Zoek op **Google Drive API** en zorg dat deze ingeschakeld (Enabled) is.

## Stap 2: OAuth Consent Screen inrichten
1. Ga in het menu naar **APIs & Services > OAuth consent screen**.
2. Selecteer **External** en klik op **Create**.
3. Vul verplichte velden in:
   - **App name**: Fynoy Pitch Gen
   - **User support email**: (Kies de jouwe)
   - **Developer contact information**: (Kies de jouwe)
4. Klik *Save and Continue* bij de overige stappen.

## Stap 3: OAuth Client ID aanmaken
1. Ga naar **APIs & Services > Credentials**.
2. Klik op **+ CREATE CREDENTIALS** en selecteer **OAuth client ID**.
3. Kies **Desktop app**, geef het de naam `Fynoy Local Uploader`.
4. Download de JSON en hernoem naar `credentials.json`.
5. Zet dit bestand in de `slides/` map.

## Klaar!
De eerste keer dat je de service start opent een browser voor Google OAuth.
Na toestemming wordt `token.json` opgeslagen en loopt alles automatisch.
