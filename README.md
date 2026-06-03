# FN Allégé

Outil de normalisation de fiches navette topologie Free / Orange.

## Fonctionnement

100% client-side — aucune donnée n'est envoyée sur un serveur.

1. Déposer un fichier `.xlsx` de topologie (format Free/Orange)
2. L'outil lit les onglets **Liaisons** et **Segments** (ignore Sous-segments, NRABTS, etc.)
3. Applique les mappings (Type liaison, Fournisseur, Type Ext)
4. Filtre les lignes `VENDU HORS CPM` avec ExtA = ExtB
5. Génère un fichier allégé avec mise en forme Excel (en-têtes bleu foncé, couleurs par périmètre)

## Développement local

```bash
npm install
npm run dev
```

## Déploiement Vercel

```bash
npm run build
# puis pousser sur GitHub et connecter le repo à Vercel
# Framework preset: Vite
# Build command: npm run build
# Output directory: dist
```
