# Étude contradictoire — Plan de rénovation et issues

> Posture : **avocat du diable**. Ce document ne défend pas le plan, il le challenge.
> Objectif : identifier biais, contradictions internes, risques sous-estimés, sur-ingénierie, oublis — avant d'engager l'effort.

Une recommandation n'est pas un ordre. Chaque point est suivi d'une **décision attendue** : accepter, rejeter, amender, reporter.

---

## 1. Contradictions internes

### 1.1 🔴 Modularisation + francisation dans le même commit

| Source | Affirmation |
|---|---|
| `CONVENTIONS.md §1.1` + issue #10 | « Ne pas franciser et refactorer dans la même PR. » |
| `PLAN.md` phase 4 + issue #5 | « La francisation des identifiants se fait dans la même PR que l'extraction du module. » |

Les deux règles sont **mutuellement exclusives** sur la phase 4. Si on respecte la convention, il faut faire 20 PRs (10 extractions × 2). Si on respecte le plan, on viole la convention.

**Décision attendue :**
- (a) Amender la convention : tolérer "extraction + francisation" comme un seul acte de refactor.
- (b) Amender le plan : doubler le nombre de PRs.
- (c) Recommandation : **(a)**, en ajoutant à la convention que les renommages d'identifiants sont assimilés à du refactor s'ils sont locaux au module extrait. Sinon la phase 4 devient ingérable.

### 1.2 🟠 Branche actuelle vs convention

La convention impose `feature/<slug>`, `refactor/<slug>`, etc. Le chantier est actuellement sur `claude/dreamy-ptolemy-WUdfC` (généré par l'outil). Aucune PR n'est encore créée, mais l'incohérence sera flagrante au premier merge.

**Décision attendue :** créer des branches conformes au moment d'ouvrir chaque PR (squash + rebase sur `refactor/restructurer-dossiers`, etc.). Documenter dans `CONTRIBUTING.md`.

### 1.3 🟡 « JAMAIS de `--no-verify` » vs hook pre-commit qui peut bloquer

Le plan installe un hook pre-commit (`simple-git-hooks`). La convention interdit `--no-verify`. Si le hook plante (erreur ESLint sur un fichier hors scope, lockfile manquant), le contributeur n'a aucune issue propre. **Aucun protocole d'escalade n'est défini.**

**Décision attendue :** documenter une procédure « hook cassé » dans `CONTRIBUTING.md` (corriger le hook avant tout, OU PR exceptionnelle pour le désactiver temporairement avec validation).

---

## 2. Risques sous-estimés

### 2.1 🔴 Aucun filet de régression avant la phase 4

Le plan déclare répétitivement « no functional change » pendant les refactors phases 3 et 4. Mais les tests automatisés n'arrivent qu'en phase 5. **On refactor ~4 000 lignes de code métier sans aucun garde-fou automatique.**

Risque : régression silencieuse sur la validation NATINF ou la séquence d'étapes, détectée seulement en production par un opérateur DFAED.

**Recommandation :** déplacer **un minimum** de tests (golden path E2E + 2-3 unitaires sur NATINF) en **phase 2.5**, avant la modularisation. Renommer en « Phase 2bis — filet de sécurité ».

### 2.2 🔴 `git filter-repo` : blast radius non chiffré

L'issue #1 propose une réécriture d'historique. Conséquences non documentées :
- Toutes les PR ouvertes deviennent obsolètes.
- Tous les clones locaux des collaborateurs doivent être re-clonés.
- Les liens GitHub vers commits anciens (issues, mentions) deviennent morts.
- Si l'extension est déjà publiée sur AMO, **les hash de signature ne changent pas** mais les sources distribuées le seront — pas d'impact utilisateur final.
- Si la clé fuitée a déjà été utilisée par un tiers malveillant pour signer une version vérolée, **filter-repo ne résout rien** — il faut auditer AMO.

**Recommandation :** ajouter à l'issue #1 :
- Audit AMO préalable : « la clé a-t-elle servi à uploader des versions inconnues ? »
- Communication aux collaborateurs avant l'opération.
- Backup complet du `.git` avant `filter-repo`.
- Une `revoir-publications.md` sur AMO listant les versions signées légitimes.

### 2.3 🟠 Migration de l'état `storage.local`

Renommer `popupLoopStateActive` → `boucleActive` (phase 4.a) **casse l'état persisté chez les utilisateurs existants**. Au prochain lancement, l'extension lira `undefined` au lieu de la valeur stockée. Comportement : potentiellement bloquant si l'état est utilisé pour reprendre une séquence.

**Recommandation :** soit (a) écrire une fonction de migration `migrerEtatPopupV2()` exécutée au démarrage du background, soit (b) accepter la perte d'état et documenter dans le `CHANGELOG`. Choisir explicitement.

### 2.4 🟠 Workflow CI cassé silencieusement

`release-extension.yml` n'est pas inspecté en détail dans l'audit. Il référence probablement des chemins racine (`background/`, `popup/`...). La phase 3 le casse sans test (les workflows ne tournent que sur certains événements).

**Recommandation :** la phase 3 doit inclure **un déclenchement manuel du workflow** (workflow_dispatch ou tag de test) avant merge.

### 2.5 🟡 `host_permissions` minimum pour la phase de test

Pour tester en E2E avec un fixture HTML local, il faut soit ajouter `<all_urls>` (mauvais), soit servir le fixture depuis un domaine FAED simulé. Playwright + extension MV3 + injection content_script restreint = **piège technique non documenté**.

**Recommandation :** prévoir un spike technique de 2h sur Playwright avant de planifier l'issue #9.

---

## 3. Sur-ingénierie suspectée (KISS challenge)

### 3.1 🟠 esbuild pour le content script

L'ADR `0004-esbuild-pour-content.md` propose esbuild « parce que MV3 ne supporte pas les modules ES dans les content scripts ». Vrai. Mais alternatives **plus simples** :

| Option | Complexité | Inconvénient |
|---|---|---|
| esbuild bundler | +1 dep, +1 build, +1 mode debug | Sourcemaps à gérer |
| Concat shell (`cat` ordonné) | 0 dep | Pas de tree-shaking, ordre manuel |
| IIFE séparés + script tags multiples | 0 dep | Impossible en content_script MV3 — manifest n'autorise qu'1 array, mais on peut lister N fichiers |
| Tout garder en un fichier mais découpé par sections commentées | 0 dep | Pas vraiment du module |

Le manifest **autorise plusieurs fichiers** en `content_scripts.js`. Pas besoin de bundler : on peut lister 10 fichiers dans l'ordre. Le code partage déjà le scope global de l'IIFE actuel.

**Recommandation :** rejeter esbuild en première intention. Essayer la concat-by-manifest. Réintroduire esbuild seulement si tree-shaking ou TypeScript devient nécessaire.

### 3.2 🟠 Lazy-load de l'arcade

L'arcade pèse ~80 ko JS minifiable. La popup est lente surtout à l'ouverture, mais ces 80 ko sont chargés une fois par session navigateur (cache HTTP local). Le gain réel est probablement **< 30 ms perçus**.

Le coût de la complexité (import dynamique, gestion de la CSS dynamique, fallback si import échoue) est non trivial.

**Recommandation :** isoler dans `popup/arcade/` (faire l'issue #7) mais **ne pas lazy-loader** dans un premier temps. Mesurer le boot time. Si > 200ms, alors lazy-load. KISS.

### 3.3 🟡 Release-please / changesets

Pour un projet à 1 mainteneur, ~1 release / mois, **un `CHANGELOG.md` manuel suffit**. Release-please impose un format de commit strict (déjà la convention mais en français — release-please n'aime pas trop), un workflow de release PR, etc.

**Recommandation :** garder le CHANGELOG manuel. Réévaluer si l'équipe passe à 3+ contributeurs.

### 3.4 🟡 Couverture de 70%

Chiffre sorti du chapeau. La logique pure (NATINF, parsing) doit viser **~100%** car triviale à tester. L'UI/DOM doit viser **0%** automatisé (impossible sans Playwright lourd, déjà couvert par E2E).

**Recommandation :** remplacer « 70% global » par « 100% sur `validations/` et `dom/parsing.js` ». Plus simple, plus honnête.

### 3.5 🟡 Fragmentation popup

`popup-consolidated.js` (1 114 l) → 6 fichiers = ~185 l / fichier. Certains modules envisagés (`icone.js`, `notifications.js`) feront probablement < 50 lignes. Trop atomique = friction de navigation.

**Recommandation :** viser **4 fichiers** au lieu de 6 :
- `index.js` (bootstrap)
- `etat-et-messagerie.js` (couplés en pratique)
- `notifications.js` (utilitaire isolable)
- `fenetre-detachee.js` (préoccupation transverse)

Et garder `icone.js` fusionné dans `index.js` si < 30 lignes.

---

## 4. Manques

### 4.1 🔴 Pas de stratégie de rollback

Aucune phase ne dit « si X casse, on revert vers le commit Y ». Tout ce qui est destructif (filter-repo, restructuration, modularisation) devrait avoir un point de rollback documenté.

**Recommandation :** ajouter à chaque phase un encart « rollback » avec le SHA cible ou la procédure.

### 4.2 🟠 i18n promise non planifiée

`CONVENTIONS.md §1.4` mentionne `_locales/fr/messages.json` « à terme ». Le plan ne le mentionne nulle part. Soit on l'ajoute (issue dédiée en phase 6), soit on retire la mention de la convention.

**Recommandation :** ajouter une issue #11 « préparer i18n » en phase 6, ou retirer la promesse.

### 4.3 🟠 Statut de l'easter-egg arcade

L'arcade est traitée comme acquise. **Une option non envisagée : la supprimer.** Pour une extension Gendarmerie en environnement professionnel, 4 jeux relèvent du gag personnel du développeur. Maintenance gratuite, surface d'attaque (input/keyboard handling), poids — pour zéro valeur métier.

**Recommandation :** ajouter cette question dans une issue de décision (« conserver, isoler, ou supprimer l'arcade ? »). Trancher avant l'issue #7.

### 4.4 🟡 Icônes red/green : usage réel non vérifié

L'audit constate 3 variantes de `icon-48*` (différentes). Le plan ne dit pas si elles sont toutes utilisées ni où. Si l'une est morte, on la supprime ; si elles sont utilisées dynamiquement, le code de bascule doit être identifié.

**Recommandation :** ajouter à l'issue #2 : « identifier l'usage de chaque variante d'icône, supprimer les inutilisées. »

### 4.5 🟡 NATINF chargé via background

Le content script demande le JSON NATINF au background, qui le charge par `fetch(getURL)`. Détour inutile : le content peut faire `fetch(browser.runtime.getURL("data/natinf-survey.json"))` directement (avec permission `web_accessible_resources` si nécessaire en MV3).

**Recommandation :** ADR ou note explicative dans l'issue #5 — soit on conserve (raison historique à documenter), soit on simplifie.

### 4.6 🟡 `controleDeLaFiche.html` fantôme

Le `README.md` mentionne un fichier qui n'existe plus. L'audit le note. Aucune issue ne le corrige explicitement avant la phase 3. Risque : oubli.

**Recommandation :** ajouter une case à cocher dans l'issue #1.

### 4.7 🟡 Aucun ADR pour MV3 ou détachement

L'ADR `0001-manifest-v3.md` est listé mais MV3 est aujourd'hui le seul choix possible. ADR sans intérêt rétrospectif. À l'inverse, le choix de la **fenêtre popup détachée** (background ouvre une `windows.create` au lieu du popup standard) est un choix d'UX **non trivial** et mérite un vrai ADR.

**Recommandation :** garder `0002-fenetre-popup-detachee.md`. Supprimer `0001-manifest-v3.md`.

---

## 5. Dépendances incorrectement modélisées

### 5.1 🟠 Issue #10 (conventions) → phase 2

Issue #10 prévoit la « francisation module par module » qui dépend des issues #5 et #6. Or #10 est listée en phase 2. Le sous-tâche « francisation » est en réalité **phase 4**, le reste de #10 est **phase 2**. L'issue mélange deux temporalités.

**Recommandation :** scinder #10 en :
- #10a — outillage convention (gabarits PR/issues, hooks, labels) — phase 2
- #10b — francisation module par module — concomitante de #5/#6 — phase 4

### 5.2 🟡 Issue #3 (outillage) → vraiment indépendante ?

`package.json` peut se créer dès maintenant. Mais `eslint` configuré sur la structure actuelle va remonter des centaines d'erreurs (variables `i` redéfinies, etc.) qui seront résolues par la modularisation. Demander 0 erreur ESLint en phase 2 = soit forcer des fixes massifs hors scope, soit accepter beaucoup d'`/* eslint-disable */`.

**Recommandation :** appliquer ESLint **après** la restructuration (phase 3), avec une première passe « `eslint --fix` » dans la même PR que phase 3. La phase 2 installe les outils mais ne les rend pas bloquants.

---

## 6. Estimation : 3 jours-homme — réaliste ?

Pour **3 jours en solo, sans review externe**, l'estimation est crédible. Avec revues, débats, allers-retours :

| Phase | Estimation plan | Estimation réaliste |
|---|---|---|
| 0 — Sécurité | 1h | 1h + coordination 2h |
| 1 — Hygiène | 1h | 2h |
| 2 — Outillage | 2h | 3h |
| 3 — Restructuration | 2h | 4h (CI + tests manuels FAED) |
| 4 — Modularisation | 1-2j | **3-4j** (10 modules × ~2h chacun) |
| 5 — Qualité | 3-4h | 1j (Playwright + extension = pénible) |
| 6 — Docs | 2h | 3h |

**Total réaliste : ~6 jours-homme**, soit 2x l'estimation. À assumer ou à descoper.

---

## 7. Décisions ouvertes à trancher

Avant de démarrer l'exécution, il faut **explicitement** trancher :

| # | Question | Recommandation |
|---|---|---|
| D1 | Modularisation + francisation dans le même commit ? | ✅ Oui (amender convention) |
| D2 | esbuild ou multi-fichiers natifs MV3 ? | ✅ Multi-fichiers d'abord |
| D3 | Lazy-load arcade dès phase 4.c ? | ❌ Reporter, mesurer d'abord |
| D4 | Garder ou supprimer l'arcade ? | ⚠️ Décision utilisateur |
| D5 | Migration de `storage.local` ou perte assumée ? | ⚠️ Décision utilisateur |
| D6 | CHANGELOG manuel ou automatisé ? | ✅ Manuel |
| D7 | Tests : 70% ou 100% sur logique pure ? | ✅ 100% pure / 0% UI |
| D8 | Filet de régression avant phase 4 (phase 2bis) ? | ✅ Oui, obligatoire |
| D9 | i18n : issue dédiée ou retirer la promesse ? | ⚠️ Décision utilisateur |
| D10 | Supprimer ADR `0001-manifest-v3.md` ? | ✅ Oui |

---

## 8. Synthèse — santé du chantier

| Axe | Note /5 | Commentaire |
|---|:---:|---|
| Cohérence interne | 3 | Une contradiction nette plan/convention (D1) |
| Identification des risques | 2 | Aucune stratégie de rollback ni de filet de régression précoce |
| Adéquation KISS | 3 | esbuild et release-please douteux, lazy-load arcade prématuré |
| Complétude | 3 | Arcade, i18n, migration storage, CI : zones grises |
| Réalisme du planning | 2 | Estimation x2 nécessaire |
| Cohérence convention | 4 | Bonne après l'alignement du PLAN |

**Verdict :** le plan est **directionnellement juste** mais **opérationnellement fragile**. À ne pas exécuter tel quel. Trancher les 10 décisions ouvertes, ajouter une phase 2bis (filet de sécurité), assouplir D1, et le chantier devient solide.

---

## Annexe — issues : revue rapide

### Issue #1 — Sécurité
- ➕ Bonne séparation révocation / purge / `.gitignore`.
- ➖ Manque : audit AMO préalable, backup `.git`, communication équipe.
- ➖ Manque : suppression du `controleDeLaFiche.html` fantôme du README.

### Issue #2 — Code mort
- ➕ Liste exhaustive et juste.
- ➖ Manque : identification des icônes mortes.
- ➖ Le sort de `debug.html` / `diagnostic.html` est ambigu (« si utilisés en dev → tools/ »). Trancher.

### Issue #3 — Outillage
- ➕ Stack standard, défendable.
- ➖ Le critère « ESLint retourne 0 » est irréaliste sur la structure actuelle. Cf. §5.2.
- ➖ Pas de `commitlint` mentionné ici (renvoyé à #10) — risque d'oubli.

### Issue #4 — Restructuration
- ➕ Séparation `src/` / `tools/` / `docs/` saine.
- ➖ Aucune mention des renommages de fichiers (`pack-extension.js` → `empaqueter-extension.js`) alors que le PLAN les liste. Désynchro.
- ➖ Procédure de test manuel non précisée (« tester sur FAED » = lequel ? pré-prod ? prod ? compte de test ?).

### Issue #5 — Modulariser content
- ➕ Découpage logique pertinent.
- ➖ Choix esbuild prématuré (cf. §3.1).
- ➖ Liste de renommages d'identifiants à valider avec un connaisseur du métier (certains termes anglais peuvent être préférés des opérateurs : `fingerprint` est-il un terme FAED ?).

### Issue #6 — Modulariser popup
- ➕ Découpage clair.
- ➖ Fragmentation potentiellement excessive (cf. §3.5).
- ➖ Risque storage.local non mentionné (cf. §2.3).

### Issue #7 — Arcade
- ➕ Plan d'isolation propre.
- ➖ Lazy-load à reporter (cf. §3.2).
- ➖ Décision « garder vs supprimer » non posée (cf. §4.3).

### Issue #8 — CSS
- ➕ Diagnostic juste.
- ➖ Le découpage cible (10 fichiers CSS) n'est pas plus simple que les 5 actuels. Justifier ou simplifier.

### Issue #9 — Tests & CI
- ➕ Stack moderne (Vitest, Playwright).
- ➖ Playwright + extension MV3 = piège (cf. §2.5). Prévoir spike.
- ➖ « 70% » non justifié (cf. §3.4).

### Issue #10 — Conventions
- ➕ Bonne checklist d'outillage.
- ➖ Mélange phase 2 (outils) et phase 4 (francisation). Scinder (cf. §5.1).
