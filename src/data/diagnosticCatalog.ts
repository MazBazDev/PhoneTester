import type { DiagnosticSection } from '../domain/diagnostic'

export const diagnosticCatalog: DiagnosticSection[] = [
  {
    id: 'identity',
    title: 'Identification',
    description: 'Verifier le modele, la capacite et les references visibles.',
    checks: [
      {
        id: 'serial-match',
        label: 'Le modele annonce correspond aux reglages du telephone',
        helper: 'Comparer les informations systeme et l’annonce.'
      },
      {
        id: 'icloud-lock',
        label: 'Aucun verrouillage proprietaire bloque le demarrage',
        helper: 'Verifier l’absence de verrou compte ou reinitialisation.'
      }
    ]
  },
  {
    id: 'physical',
    title: 'Etat physique',
    description: 'Faire un controle visuel du chassis et des boutons.',
    checks: [
      {
        id: 'frame-condition',
        label: 'Le chassis ne presente pas de deformation notable',
        helper: 'Inspecter les coins, les vis et la coque.'
      },
      {
        id: 'buttons-click',
        label: 'Les boutons principaux repondent correctement',
        helper: 'Tester volume, verrouillage et mute si disponible.'
      }
    ]
  },
  {
    id: 'display',
    title: 'Ecran et tactile',
    description: 'Valider l’affichage, la luminosite et le tactile.',
    checks: [
      {
        id: 'brightness',
        label: 'La luminosite monte sans scintillement',
        helper: 'Monter la luminosite au maximum sur fond clair.'
      },
      {
        id: 'touch-grid',
        label: 'Le tactile repond sur toute la surface',
        helper: 'Faire glisser une icone ou tracer sur tout l’ecran.'
      }
    ]
  },
  {
    id: 'media',
    title: 'Audio et camera',
    description: 'Tester le haut-parleur, le micro et les capteurs photo.',
    checks: [
      {
        id: 'speaker',
        label: 'Le haut-parleur principal est clair',
        helper: 'Lire une video ou une sonnerie forte.'
      },
      {
        id: 'camera-switch',
        label: 'Les cameras avant et arriere fonctionnent',
        helper: 'Basculer entre les objectifs et verifier la mise au point.'
      }
    ]
  },
  {
    id: 'connectivity',
    title: 'Connectivite',
    description: 'Confirmer la charge et les radios principales.',
    checks: [
      {
        id: 'charging',
        label: 'Le telephone charge des la connexion du cable',
        helper: 'Tester avec un chargeur connu comme fonctionnel.'
      },
      {
        id: 'wifi-bluetooth',
        label: 'Le Wi-Fi et le Bluetooth s’activent normalement',
        helper: 'Activer les deux radios depuis les reglages rapides.'
      }
    ]
  }
]
