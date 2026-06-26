
# Cahier des charges – iPhone Diagnostic

## Objectif

Développer une application web permettant de tester rapidement le maximum de composants d'un iPhone avant un achat d'occasion.

L'application doit :

- fonctionner directement dans Safari (sans installation)
- être optimisée mobile
- guider l'utilisateur étape par étape
- lancer automatiquement tous les tests possibles via les Web APIs
- assister les tests qui nécessitent une validation humaine
- générer un rapport final consultable et partageable

Le temps moyen d'un diagnostic complet doit être inférieur à **3 minutes**.

---

# UX

L'utilisateur ne doit jamais avoir à chercher quoi faire.

Chaque écran contient :

- le nom du test

- une explication très courte

- un indicateur de progression

- une animation

- un gros bouton


Exemple :

```
Test 4 / 18

Microphone

Appuyez sur "Enregistrer"
puis dites quelques mots.

[ Commencer ]
```

---

# Flow

Accueil

↓

Présentation

↓

Diagnostic automatique

↓

Tests guidés

↓

Checklist manuelle

↓

Rapport final

---

# Tests

## 1. Informations appareil

Automatique

Afficher :

- User Agent

- Plateforme

- Langue

- Version iOS (si détectable)

- Résolution

- DPR

- Taille écran

- Orientation


Résultat :

PASS

---

## 2. Permissions

Tester :

- caméra

- micro

- localisation

- capteurs


Afficher :

Accordé

Refusé

Indisponible

---

## 3. Écran

### Blanc

### Noir

### Rouge

### Vert

### Bleu

### Gris

À chaque écran :

"Voyez-vous un défaut ?"

Oui

Non

---

## 4. Tactile

L'écran devient une grille.

Toutes les cases doivent être coloriées lorsqu'elles sont touchées.

Tester :

- bords

- coins

- multitouch


Détecter automatiquement :

- zones mortes


---

## 5. Rotation

Demander :

Tournez le téléphone.

Détecter :

Portrait

Paysage

Gyroscope

---

## 6. Accéléromètre

Afficher en temps réel :

X

Y

Z

Animation 3D du téléphone.

---

## 7. Gyroscope

Même principe.

---

## 8. Boussole

Afficher :

Orientation

Nord

---

## 9. GPS

Afficher :

- position

- précision

- altitude

- vitesse (si disponible)


Temps d'acquisition.

---

## 10. Caméra arrière

Demander l'autorisation.

Afficher le flux vidéo.

Prendre une photo.

Changer d'objectif si disponible.

---

## 11. Caméra avant

Même principe.

---

## 12. Autofocus

Afficher une cible.

Demander :

Approchez votre main.

Puis éloignez-la.

Validation utilisateur.

---

## 13. Microphone

Enregistrer.

Afficher :

forme d'onde

niveau sonore

Lecture immédiate.

Question :

Entendez-vous correctement votre voix ?

---

## 14. Haut-parleurs

Lire :

100 Hz

500 Hz

1 kHz

Sweep

Validation utilisateur.

---

## 15. Performances

Mini benchmark JS.

Mesurer :

FPS

Temps moyen

Jank

Durée

Afficher un score.

---

## 16. Connectivité

Afficher :

connexion

wifi

online/offline

latence

---

## 17. Stockage

Afficher :

quota

utilisé

disponible

(si disponible)

---

## 18. Résumé automatique

Tous les tests.

Chaque ligne :

PASS

WARNING

FAILED

NOT TESTED

---

# Checklist manuelle

Séparer complètement du diagnostic.

## Identification

☐ IMEI vérifié

☐ Numéro de série vérifié

☐ Capacité conforme

☐ Modèle conforme

---

## iCloud

☐ Aucun verrouillage

☐ Localiser désactivé

☐ Réinitialisation possible

---

## Batterie

☐ Santé batterie

☐ Nombre de cycles

☐ Aucune alerte

☐ Pas de gonflement

☐ Pas de chauffe

---

## Châssis

☐ Vitre avant

☐ Vitre arrière

☐ Caméras

☐ Châssis

☐ Connecteur

☐ Oxydation

---

## Boutons

☐ Power

☐ Volume +

☐ Volume -

☐ Bouton Action

☐ Switch silencieux

---

## Biométrie

☐ Face ID

ou

☐ Touch ID

---

## Charge

☐ Charge filaire

☐ MagSafe

---

## Réseau

☐ Appel

☐ SMS

☐ Données mobiles

---

# Rapport final

Afficher :

```
✔ Écran

✔ Micro

✔ Caméra

✔ GPS

✔ Haut-parleurs

⚠ Face ID
(non testé)

✔ Batterie
(validée manuellement)

✖ Caméra avant
(floue)

Score global

92 %
```

---

Possibilité :

Exporter :

- PDF

- JSON

---

# Architecture logicielle

Chaque test est un module indépendant.

Exemple :

```
interface DiagnosticTest {

id: string

name: string

description: string

icon: string

automatic: boolean

run(): Promise<TestResult>

}
```

Chaque test retourne :

```
PASS

WARNING

FAILED

SKIPPED

NOT_SUPPORTED
```

---

# APIs Web à utiliser

- Permissions API

- MediaDevices API

- Geolocation API

- DeviceMotionEvent

- DeviceOrientationEvent

- Screen Orientation API

- Storage API

- Performance API

- Web Audio API

- Fullscreen API

- Pointer Events

- Vibration API (Android uniquement)


---
## Bonnes pratiques de développement

- Chaque test doit être encapsulé dans un composable (`useCameraTest`, `useMicrophoneTest`, etc.).

- Les composants d'interface doivent rester découplés de la logique métier.

- Les tests doivent être exécutables individuellement ou dans une séquence complète.

- La progression doit être persistée en local pour reprendre un diagnostic interrompu.

- Tous les résultats doivent être typés avec TypeScript et facilement exportables.


L'objectif est d'obtenir une base de code modulaire afin de pouvoir ajouter de nouveaux tests ou supporter d'autres appareils (Android, iPad, etc.) sans refonte de l'architecture.