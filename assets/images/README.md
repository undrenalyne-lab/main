# Images

Ce répertoire contient toutes les images utilisées sur le site web.

## Fichiers présents

### `logo.png`
- **Usage** : Logo de l'entreprise utilisé comme favicon sur toutes les pages et dans le header
- **Format** : PNG
- **Taille recommandée** : 64x64px minimum (carré)
- **Utilisé dans** : Toutes les pages HTML (favicon et header)

### `portrait.png`
- **Usage** : Image de profil affichée dans la section hero de la page d'accueil
- **Format** : PNG
- **Taille recommandée** : 400x400px minimum (carré)
- **Ratio** : 1:1 (carré)
- **Style** : Photo professionnelle style LinkedIn
- **Utilisé dans** : `index.html` (section hero)
- **Note** : Si l'image n'est pas trouvée, elle sera masquée automatiquement pour éviter les erreurs d'affichage. L'image est affichée dans un cercle avec relief (effet glass).


### `description.jpeg`
- **Usage** : Image de fond pour la section hero-bio
- **Format** : JPEG
- **Utilisé dans** : `index.html` (section `.hero-bio`)

### `conceptiongraph.png`
- **Usage** : Image de présentation pour le service de conception graphique
- **Format** : PNG
- **Utilisé dans** : `services/conception-visuels.html`

### `prestaai.jpeg`
- **Usage** : Image de présentation pour le service de conseils en IA
- **Format** : JPEG
- **Utilisé dans** : `services/conseils-ia.html`

### `videospresta.jpeg`
- **Usage** : Image de présentation pour le service d'édition de vidéos
- **Format** : JPEG
- **Utilisé dans** : `services/edition-videos.html`

## Image de fond

L'image de fond a été remplacée par un dégradé de couleurs. Le site utilise maintenant un dégradé CSS pour l'arrière-plan principal.

## Notes générales

- Toutes les images doivent être optimisées pour le web (compression appropriée)
- Les formats PNG sont recommandés pour les images avec transparence
- Les formats JPEG sont recommandés pour les photos et images complexes
- Si une image n'est pas trouvée, le site gère automatiquement l'erreur pour éviter les problèmes d'affichage
