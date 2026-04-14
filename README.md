# Apoki - A Mobile Multiplayer Poker Game with Post-Game AI Analysis for Player Skill Improvement


> This project is an academic, non‑commercial undergraduate project. It is intended **solely for educational and entertainment purposes**, not for real‑money gambling or financial advice.

---

## 1. Overview

This repository contains a poker playing and coaching application with:

- A **Node.js server** (game logic, APIs, and data handling)
- A **Flutter mobile client** (Android app UI)

The app is designed to showcase poker playing between devices, and integrated hand history collection to generate beginner-friendly feedback based on play.

---

## 2. System Requirements

### Server

- **Node.js** (≥ v24.12.0)
- **npm** (installed with Node.js)
- Internet connection for installing dependencies

### Mobile Client

- **Flutter SDK** (recent stable release)
- **Android Studio** or **Visual Studio Code** (or another IDE with Flutter support)
- **Android SDK** and **Android emulator**
- A device or emulator that meets typical Flutter minimum requirements (Android 5.0+ / API 21+)

---

## 3. Installation

### 3.1. Clone the Repository

```bash
git clone https://github.com/michaelyianni/aipokerproject.git
cd aipokerproject
```

The repository is organised into two main components:

- `server/` – Node.js backend
- `client_app/` – Flutter frontend

---

### 3.2. Install Server Dependencies

From the project root:

```bash
cd server
npm install
```

This will install all dependencies listed in `server/package.json`.

Create a `.env` file in server-proj and insert your Groq API key:

```env
GROQ_API_KEY=...
```
You will not be able to generate feedback without doing this.

---

### 3.3. Install Mobile Client Dependencies

From the project root:

```bash
cd client_app   
flutter pub get
```

This will install all Flutter and Dart packages defined in `pubspec.yaml`.

---

## 4. Running the Application

### 4.1. Running the Server

From the `server` directory:

```bash
cd server
npm run start
```

- By default, the server will listen on a port `3000`.
- Ensure this port is **reachable from your emulator or device**.

---

### 4.2. Running the Mobile Client (Android)

#### 4.2.1. Start an Android Emulator

To showcase gameplay, you will need to run at least two Android emulators. You can start an emulator from **Android Studio**:

1. Open **Android Studio**.
2. Go to **Device Manager**.
3. Create or select an existing virtual device.
4. Click **Run** to start the emulator.

Or from the command line (if configured):

```bash
emulator -avd <YOUR_AVD_NAME>
```

Wait for the emulators to boot completely.

#### 4.2.2. Run the Flutter App

From the Flutter client directory:

```bash
cd client_app
flutter devices
```

Confirm that your emulators appear in the list.

Then, for each emulator run:

```bash
flutter run -d <DEVICE_ID>
```
Flutter will build and deploy the app to the specified emulator.

---

## 5. Basic Usage

> The exact screens and flows may differ slightly depending on the current implementation; adjust this section if your UI changes.

Typical flow:

1. **Launch the app** on your Android device/emulator.
2. **Enter a username** in the prompt.
2. **Join the lobby** - click the "Join Lobby" button in the menu on all emulators.
3. **Start the game** - click "Start Game" on the first emulator (host) to join the lobby.
4. **Play hands** - use the controls to make decisions such as fold / call / raise, sizing, etc.
5. **Receive feedback** - click the arrow to leave the game, and then click "AI Feedback" in the menu. The app will provide guidance evaluating your gameplay, and how to improve your decision-making using examples from the real in-game scenarios.

---

## 6. Licensing and Third‑Party Components

This project makes use of several third‑party frameworks, libraries, and assets. This repository is a student, non‑commercial project. All third‑party software remains under its original license; nothing in this repository should be interpreted as altering or weakening those licenses.

### 6.1. Major Frameworks and Runtimes

- **Flutter**  
  Flutter is used for the mobile client. Flutter and its core packages are distributed by Google under permissive open‑source licenses - **BSD 3-Clause "New" or "Revised" License**. The full license text and notices are provided as part of the Flutter SDK and its packages. Refer to Flutter’s official license information for full details.

- **Node.js**  
  Node.js is used for the server and is distributed under the **MIT license**. The full license text and notices are provided as part of the Node.js distribution. Refer to the official Node.js distribution for complete and current license information.

### 6.2. NPM Packages (Server)

The server depends on various Node.js packages listed in:

- `server/package.json`

These packages are installed via **npm**, and each package includes its own license information in its published distribution (for example, in a `LICENSE` file or on its npm page). This project does **not** attempt to re‑license or modify those packages.

### 6.3. Flutter/Dart Packages (Client)

The client depends on Flutter and Dart packages listed in:

- `client_app/pubspec.yaml` (or equivalent)

These packages are installed via **Flutter/pub.dev**, and each package includes its own license information in its published distribution. This project does **not** attempt to re‑license or modify those packages.

---

## 7. Asset Usage and Attribution

The project uses several graphical and font assets from third‑party providers. Their original authors and license terms are provided below.

### 7.1. Card Images

- Source: `https://neonorbis.itch.io/playing-cards`  
- License note from the author: **“These cards are also free to use in Commercial Game/Applications.”**  

### 7.2. Chip Stack Icon

- Source: Flaticon  
- Attributed as:  
  `Token icons created by Sudowoodo - Flaticon`  
- Original URL:  
  `<a href="https://www.flaticon.com/free-icons/token" title="token icons">Token icons created by Sudowoodo - Flaticon</a>`

### 7.3. User Icon

- Source: Flaticon  
- Attributed as:  
  `User icons created by Freepik - Flaticon`  
- Original URL:  
  `<a href="https://www.flaticon.com/free-icons/user" title="user icons">User icons created by Freepik - Flaticon</a>`

### 7.4. Chip Icons

- Source: Icons8  
- License statement:  
  “You can copy, use and distribute this icon, even for commercial purposes, all without asking permission provided you link to icons8.com website from any page you use this icon.”
- https://icons8.com

### 7.5. Dropline Font

- The **Dropline** font is used in the project.
- License: **“Free for Personal Use.”**  
- This project is a **non‑commercial academic project**, so its use here falls under personal/non‑commercial use.
- If the project were to ever be used commercially, a paid license for Dropline would be required.

---

## 8. Disclaimers and Responsible Use

This application involves poker and gambling‑related concepts. It is critical to use it responsibly and understand its limitations.

### 8.1. Age and Access Warnings

- This app is **not intended for children or younger users**.
- Poker and gambling themes may be inappropriate for minors.
- If you share or deploy this project, you should:
  - Restrict access to users who are of legal age in their jurisdiction.
  - Clearly indicate that the content involves gambling‑related concepts.

### 8.2. No Real‑Money Gambling

- The application is designed for **casual play and learning**, not real‑money gambling.
- There is **no facility for depositing, withdrawing, or wagering real currency**.

### 8.3. No Financial or Gambling Advice

- Any feedback, suggestions, or evaluations of poker decisions provided by the app are **for educational and entertainment purposes only**.
- **No guarantee** is made that:
  - The feedback is correct,
  - The advice is complete, or
  - The strategies are profitable or appropriate for any real‑world situation.
- The app should **not** be treated as:
  - Investment advice,
  - Professional gambling advice, or
  - A recommendation to gamble.

Users are solely responsible for their own decisions, particularly in any real‑money context outside this application.

### 8.4. Risk of Normalising Gambling

- Introducing poker and gambling concepts to beginners can **normalise** gambling behaviour.
- This project aims to emphasise **skill development, decision‑making, and risk awareness**, not to promote gambling.
- Users and educators should:
  - Highlight the **risks of gambling**, including potential for addiction and financial loss.
  - Encourage play in **low‑stakes or purely play‑money / simulated environments**.
  - Emphasise that **responsible gambling** (if undertaken at all) requires strict limits and self‑control.

---