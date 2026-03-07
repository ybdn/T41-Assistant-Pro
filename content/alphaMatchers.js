// Encapsulation du script dans un IIFE pour isoler les variables
(function () {
  // Variables globales encapsulées
  let isActive = false;
  let alphaStepIndex = 0; // Renommé pour éviter le conflit
  let domFormat = null; // Variable pour stocker le format DOM détecté
  let currentStepIndex = 0; // Pour suivre l'état des étapes d'automatisation
  let sequenceStartTime = null; // Pour mesurer le temps total d'exécution
  const MIN_SEQUENCE_DURATION = 4000; // Durée minimale en millisecondes
  let loopProcessingActive = false; // NOUVELLE VARIABLE POUR LE MODE BOUCLE
  let progressUpdateTimer = null; // Timer pour les mises à jour de progression
  let retryCountEcranAccueil = 0; // Compteur de tentatives pour l'écran d'accueil
  const MAX_RETRY_ATTEMPTS = 3; // Nombre maximum de tentatives
  const NATINF_JSON_PATH = "data/natinf-survey.json";
  const NATINF_CODE_REGEX = /^\s*([A-Z0-9]{1,6})\s*(?:-|$)/i;
  const NATINF_COMMENT_SELECTOR =
    "textarea#formValidationCorrection\\:commentairesEtapes";
  let natinfSensitiveSet = null;
  let natinfSensitiveSetPromise = null;
  let natinfSensitiveVersion = null;

  // Fonction pour vérifier si nous sommes sur la bonne page "CONTROLE DE LA FICHE"
  function isControleDeFichePage() {
    const titreElements = document.querySelectorAll("div.zoneTitre");
    for (let i = 0; i < titreElements.length; i++) {
      // Attention aux espaces multiples ou en fin de chaîne dans le textContent
      if (
        titreElements[i].textContent.trim().toUpperCase() ===
        "CONTROLE DE LA FICHE"
      ) {
        return true;
      }
    }
    return false;
  }

  // Fonction pour vérifier si nous sommes sur la page "ECRAN D'ACCUEIL"
  function isEcranAccueilPage() {
    const titreElements = document.querySelectorAll("div.zoneTitre");
    for (let i = 0; i < titreElements.length; i++) {
      // Attention aux espaces multiples ou en fin de chaîne dans le textContent
      if (
        titreElements[i].textContent.trim().toUpperCase() ===
        "ECRAN D'ACCUEIL"
      ) {
        return true;
      }
    }
    return false;
  }

  // Fonction pour valider l'onglet Empreintes (doigts)
  function validateFingerprintsTab() {
    logInfo("🔍 Vérification de la présence d'images dans l'onglet Empreintes (doigts)");

    const errors = [];

    // Liste des doigts à vérifier (déroulés)
    const fingerLabels = ['PD', 'ID', 'MD', 'AD', 'OD', 'PG', 'IG', 'MG', 'AG', 'OG'];

    // Liste des simultanés à vérifier
    const simultaneLabels = ['SMG', 'SPG', 'SPD', 'SMD'];

    // Récupérer toutes les cellules contenant des labels
    const allCells = document.querySelectorAll(
      'table[id*="formValidationCorrection:tabViewValidationFiche"] td.ui-panelgrid-cell'
    );

    // Objet pour stocker l'état de chaque doigt et simultané
    const fingerStates = {};
    const simultaneStates = {};

    // Parcourir toutes les cellules pour identifier les doigts et simultanés
    allCells.forEach((cell) => {
      const label = cell.querySelector('label.ui-outputlabel[style*="font-size: 20px"]');
      if (!label) return;

      const labelText = label.textContent.trim();

      // Chercher l'input de taille 2 qui contient "P" ou "N/A" (à droite du label)
      const inputs = cell.querySelectorAll('input[type="text"][readonly][size="2"]');

      // L'input qui nous intéresse est celui avec style contenant "float:right" ou "float: right"
      let statusInput = null;
      inputs.forEach((input) => {
        const style = input.getAttribute('style') || '';
        if (style.includes('float:right') || style.includes('float: right')) {
          statusInput = input;
        }
      });

      if (statusInput) {
        const value = statusInput.value?.trim();

        // Si c'est un doigt déroulé
        if (fingerLabels.includes(labelText)) {
          fingerStates[labelText] = value === 'P';
          logInfo(`Doigt ${labelText}: ${value === 'P' ? 'Présent' : 'Absent'}`);
        }

        // Si c'est un simultané
        if (simultaneLabels.includes(labelText)) {
          simultaneStates[labelText] = value === 'P';
          logInfo(`Simultané ${labelText}: ${value === 'P' ? 'Présent' : 'Absent'}`);
        }
      }
    });

    // 1. Vérifier la présence d'au moins deux doigts déroulés avec value="P"
    const presentFingers = fingerLabels.filter(label => fingerStates[label] === true);
    const fingersCount = presentFingers.length;

    logInfo(`Nombre de doigts déroulés avec 'P' détectés: ${fingersCount}`, presentFingers);

    if (fingersCount < 2) {
      logInfo(`❌ Validation échouée : Au moins 2 doigts requis (${fingersCount} détecté(s))`);
      errors.push("Erreur RDK détectée. Reprise par opérateur obligatoire.");
    }

    // 2. Vérifier la présence d'au moins un simultané (SMG ou SMD) avec value="P"
    const smgPresent = simultaneStates['SMG'] === true;
    const smdPresent = simultaneStates['SMD'] === true;

    logInfo(`Simultanés détectés - SMG: ${smgPresent}, SMD: ${smdPresent}`);

    if (!smgPresent && !smdPresent) {
      logInfo("❌ Validation échouée : Au moins un simultané (SMG ou SMD) requis");
      errors.push("Erreur RDK détectée. Reprise par opérateur obligatoire.");
    }

    // 3. Vérifier que si PD ou PG est présent en déroulé, il doit être présent en simultané
    const pdPresent = fingerStates['PD'] === true;
    const pgPresent = fingerStates['PG'] === true;
    const spdPresent = simultaneStates['SPD'] === true;
    const spgPresent = simultaneStates['SPG'] === true;

    logInfo(`Pouces détectés - PD: ${pdPresent}, PG: ${pgPresent}, SPD: ${spdPresent}, SPG: ${spgPresent}`);

    if (pdPresent && !spdPresent) {
      logInfo("❌ Validation échouée : Pouce droit (PD) présent en déroulé mais absent en simultané (SPD)");
      errors.push("Erreur RDK détectée. Reprise par opérateur obligatoire.");
    }

    if (pgPresent && !spgPresent) {
      logInfo("❌ Validation échouée : Pouce gauche (PG) présent en déroulé mais absent en simultané (SPG)");
      errors.push("Erreur RDK détectée. Reprise par opérateur obligatoire.");
    }

    // Si des erreurs sont détectées, les renvoyer
    if (errors.length > 0) {
      logInfo("❌ Erreurs de validation détectées dans l'onglet Empreintes (doigts)");
      // Utiliser un Set pour dédupliquer les messages identiques
      const uniqueErrors = [...new Set(errors)];
      throw new Error(uniqueErrors.join("\n"));
    }

    logInfo("✅ Validation de l'onglet Empreintes (doigts) réussie");
  }

  // Définition des étapes de l'automatisation (intégrées depuis contentScript.js)
  const steps = [
    {
      name: "Cocher 'Non' dans la page alpha numérique", // Nom de l'étape mis à jour
      actions: [
        {
          description: "Cocher 'Non'",
          selector:
            "label[for='formValidationCorrection:decisionValidationAlphaPortraits:1']",
          action: (element) => element.click(),
        },
        // L'action pour l'onglet Portraits a été supprimée
      ],
    },
    {
      name: "Cliquer sur l'onglet Empreintes (doigts)",
      selector:
        "a[href='#formValidationCorrection:tabViewValidationFiche:tab2']",
      action: (element) => element.click(),
    },
    {
      name: "Validation de l'onglet Empreintes (doigts)",
      selector: "table[id*='formValidationCorrection:tabViewValidationFiche']",
      action: (element) => {
        // Valider l'onglet Empreintes (doigts)
        // Si une erreur est détectée, une exception sera levée et capturée par runAutomatedSteps()
        validateFingerprintsTab();
      },
    },
    {
      name: "Cliquer sur l'onglet Empreintes (paumes)",
      selector:
        "a[href='#formValidationCorrection:tabViewValidationFiche:tab3']",
      action: (element) => element.click(),
    },
    {
      name: "Cocher 'Non' dans la page paume et cliquer sur 'Terminer'",
      actions: [
        {
          description: "Cocher 'Non' dans la page paume",
          selector:
            "label[for='formValidationCorrection:decisionsErreursEmpreintes:1']",
          action: (element) => element.click(),
        },
        {
          description: "Cliquer sur 'Terminer'",
          selector: "#formValidationCorrection\\:terminerControleBoutton",
          action: (element) => element.click(),
        },
      ],
    },
    {
      name: "Cliquer sur 'OK et suivant' ou 'OK'",
      selector:
        "#formValidationCorrection\\:okSuivantValidationFicheSignalisation",
      fallbackSelector:
        "#formValidationCorrection\\:terminerValidationFicheSignalisation",
      action: (element, fallbackElement) => {
        if (
          element &&
          !element.disabled &&
          element.getAttribute("aria-disabled") !== "true"
        ) {
          element.click();
        } else if (fallbackElement) {
          fallbackElement.click();
        }
      },
    },
  ];

  // Définition des étapes pour l'écran d'accueil
  const stepsEcranAccueil = [
    {
      name: "Cliquer sur Traitement personnes",
      selector: "a[href='#tabs:tab0']",
      action: (element) => element.click(),
    },
    {
      name: "Cliquer sur l'onglet Station alpha",
      selector: "a[href='#tabs:tabsP:tabP2']",
      action: (element) => element.click(),
    },
    {
      name: "Cliquer sur 'Effacer tout' (si nécessaire)",
      selector: "#tabs\\:tabsP\\:FormulaireFiltreStationAlphaPersonneP\\:effacerToutPersonneP",
      action: (element) => {
        // Vérifier si l'initiateur est vide et si Contrôle est déjà sélectionné
        const initiateurInput = document.querySelector("#tabs\\:tabsP\\:FormulaireFiltreStationAlphaPersonneP\\:initiateurPersonneP");
        const etapeLabel = document.querySelector("label#tabs\\:tabsP\\:FormulaireFiltreStationAlphaPersonneP\\:etapeTraitementPersonneP_label");

        const initiateurIsEmpty = !initiateurInput || !initiateurInput.value || initiateurInput.value.trim() === "";
        const controleIsSelected = etapeLabel && etapeLabel.textContent.trim() === "Contrôle";

        if (!(initiateurIsEmpty && controleIsSelected)) {
          element.click();
        }
      },
    },
    {
      name: "Vider le champ initiateur (si nécessaire)",
      selector: "#tabs\\:tabsP\\:FormulaireFiltreStationAlphaPersonneP\\:initiateurPersonneP",
      action: (element) => {
        // Vérifier si le champ est vide avant de le vider
        if (element.value && element.value.trim() !== "") {
          element.value = "";
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
      },
    },
    {
      name: "Sélectionner Controle (si nécessaire)",
      selector: "label#tabs\\:tabsP\\:FormulaireFiltreStationAlphaPersonneP\\:etapeTraitementPersonneP_label",
      action: (element) => {
        // Vérifier si "Contrôle" est déjà sélectionné
        if (element.textContent.trim() !== "Contrôle") {
          // Trouver le select sous-jacent
          const selectElement = document.querySelector("select#tabs\\:tabsP\\:FormulaireFiltreStationAlphaPersonneP\\:etapeTraitementPersonneP_input");

          if (selectElement) {
            // Définir la valeur sur VALIDATION_FICHE (qui correspond à "Contrôle")
            selectElement.value = "VALIDATION_FICHE";

            // Déclencher l'événement change pour activer le comportement PrimeFaces
            const changeEvent = new Event('change', { bubbles: true });
            selectElement.dispatchEvent(changeEvent);

            logInfo("✅ Filtre 'Contrôle' sélectionné");
          } else {
            logInfo("❌ Menu déroulant du filtre d'étape non trouvé");
          }
        }
      },
    },
    {
      name: "Cliquer sur Rafraîchir",
      selector: "#tabs\\:tabsP\\:FormulaireFiltreStationAlphaPersonneP\\:raffraichirPersonneP",
      action: (element) => element.click(),
    },
    {
      name: "Vérifier la disponibilité des fiches",
      selector: "body", // Sélecteur générique car on vérifie plusieurs éléments
      action: (element) => {
        // Attendre un peu pour que le DOM soit stabilisé après le clic sur Rafraîchir
        setTimeout(async () => {
          // Vérifier si la liste est vide
          const emptyListElement = document.querySelector("tr.ui-datatable-empty-message td");
          const isListEmpty = emptyListElement && emptyListElement.textContent.includes("Liste vide");

          // Vérifier si des dossiers sont occupés
          const errorMessageElement = document.querySelector("#tabs\\:tabsP\\:FormulaireFiltreStationAlphaPersonneP\\:messageErreurPersonneP");
          const hasBusyFiles = errorMessageElement && errorMessageElement.textContent.includes("Dossier(s) occupé(s)");

          if (isListEmpty || hasBusyFiles) {
            const reason = isListEmpty ? "Liste vide" : "Dossier(s) occupé(s)";
            retryCountEcranAccueil++;

            if (retryCountEcranAccueil < MAX_RETRY_ATTEMPTS) {
              await new Promise(resolve => setTimeout(resolve, 3000));

              // Re-cliquer sur Rafraîchir
              const refreshButton = document.querySelector("#tabs\\:tabsP\\:FormulaireFiltreStationAlphaPersonneP\\:raffraichirPersonneP");
              if (refreshButton) {
                refreshButton.click();

                // Attendre le chargement après le clic
                await waitForLoadingToComplete();
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Revenir à cette étape de vérification
                currentStepIndex = 6; // Étape de vérification (index ajusté après ajout de "Traitement personnes")
                runEcranAccueilSteps();
              }
            } else {
              logInfo(`❌ ${reason} après ${MAX_RETRY_ATTEMPTS} tentatives`);
              loopProcessingActive = false;
              await browser.storage.local.set({ loopProcessingActive: false });
              browser.runtime.sendMessage({
                command: "loopProcessingStopped",
                reason: "max_retry_attempts_reached",
                details: `${reason} après ${MAX_RETRY_ATTEMPTS} tentatives`,
              }).catch((e) => console.warn("Erreur envoi message loopProcessingStopped:", e));
            }
          } else {
            retryCountEcranAccueil = 0; // Réinitialiser le compteur en cas de succès
          }
        }, 1500); // Délai pour laisser le DOM se stabiliser
      },
    },
    {
      name: "Sélectionner toutes les fiches",
      selector: "th#tabs\\:tabsP\\:ListeDossiersP\\:listeDossiersPersonnesP\\:j_idt409 .ui-chkbox-box",
      fallbackSelector: ".ui-chkbox-all .ui-chkbox-box",
      action: (element, fallbackElement) => {
        if (element) {
          element.click();
        } else if (fallbackElement) {
          fallbackElement.click();
        }
      },
    },
    {
      name: "Traiter la sélection",
      selector: "#tabs\\:tabsP\\:ListeDossiersP\\:ListeDossiersPersonnesTraiterSelection",
      action: (element) => element.click(),
    },
  ];

  let currentProcessOutcome = null;

  async function incrementStat(statName) {
    try {
      const data = await browser.storage.local.get("t41_stats");
      const stats = data.t41_stats || { validated: 0, correction: 0, rejected: 0, fingerErrors: 0, total: 0 };
      if (stats[statName] !== undefined) {
          stats[statName]++;
          if (statName === 'validated' || statName === 'correction' || statName === 'rejected') {
              stats.total++;
          }
          await browser.storage.local.set({ t41_stats: stats });
      }
    } catch (e) {
      logInfo("Erreur mise à jour stat: " + e);
    }
  }

  document.addEventListener("click", (event) => {
    const target = event.target.closest("button, a, input[type='button'], input[type='submit']");
    if (target) {
      const text = (target.textContent || target.value || target.title || "").toLowerCase();
      if (text.includes("rejeter") || (target.id && target.id.toLowerCase().includes("rejet"))) {
        incrementStat("rejected");
      }
    }
  });

  // Fonction pour journaliser les informations avec un format cohérent
  function logInfo(message, data = null) {
    const timestamp = new Date().toISOString().substr(11, 8);
    const prefix = loopProcessingActive ? "[LOOP] " : "";
    if (data) {
      console.log(`[${timestamp}] ${prefix}${message}`, data);
    } else {
      console.log(`[${timestamp}] ${prefix}${message}`);
    }
  }

  // Fonction pour vérifier la présence de l'indicateur de chargement
  function isLoadingIndicatorPresent() {
    const loadingIndicator = document.querySelector(
      ".blockUI.blockMsg.blockElement.pe-blockui"
    );
    return !!loadingIndicator;
  }

  // Fonction pour attendre que l'indicateur de chargement disparaisse
  function waitForLoadingToComplete(timeout = 30000) {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const interval = setInterval(() => {
        if (!isLoadingIndicatorPresent()) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() - startTime > timeout) {
          clearInterval(interval);
          logInfo("⚠️ Timeout chargement");
          resolve();
        }
      }, 200); // Vérifier toutes les 200ms
    });
  }

  // Fonction pour détecter le format DOM de la page actuelle
  function detectDOMFormat() {
    // Vérifier d'abord si les éléments incluent tabViewValidationFiche
    const withTabView = document.querySelector(
      "#formValidationCorrection\\:tabViewValidationFiche\\:nom"
    );
    const withoutTabView = document.querySelector(
      "#formValidationCorrection\\:nom"
    );

    if (withTabView) {
      return "tabView";
    } else if (withoutTabView) {
      return "direct";
    } else {
      // Essayer d'autres sélecteurs pour détecter le format
      const anyForm = document.querySelector("#formValidationCorrection");
      if (anyForm) {
        return "unknown";
      } else {
        return "notFound";
      }
    }
  }

  async function loadNatinfSensitiveSet() {
    if (natinfSensitiveSet) {
      return natinfSensitiveSet;
    }

    if (!natinfSensitiveSetPromise) {
      natinfSensitiveSetPromise = (async () => {
        let payload = null;

        try {
          const response = await browser.runtime.sendMessage({
            command: "getNatinfSurvey",
          });
          if (
            response &&
            response.success &&
            response.data
          ) {
            payload =
              typeof response.data === "string"
                ? JSON.parse(response.data)
                : response.data;
          } else {
            throw new Error(
              response?.error ||
                "Reponse getNatinfSurvey invalide depuis le background."
            );
          }
        } catch (error) {
          logInfo(`❌ Échec chargement NATINF: ${error.message}`);
          throw error;
        }

        const natinfEntries = Array.isArray(payload?.natinfCodes)
          ? payload.natinfCodes
          : [];
        const normalizedCodes = new Set();

        natinfEntries.forEach((entry) => {
          if (entry === null || entry === undefined) {
            return;
          }

          let rawCode = "";
          if (typeof entry === "string" || typeof entry === "number") {
            rawCode = String(entry);
          } else if (entry && typeof entry.code !== "undefined") {
            rawCode = String(entry.code);
          }

          const normalized = rawCode.trim().toUpperCase();
          if (normalized) {
            normalizedCodes.add(normalized);
          }
        });

        natinfSensitiveSet = normalizedCodes;
        natinfSensitiveVersion = payload?.version || null;
        return natinfSensitiveSet;
      })().catch((error) => {
        natinfSensitiveSetPromise = null;
        throw error;
      });
    }

    return natinfSensitiveSetPromise;
  }

  function getNatinfSelectors() {
    const suffixes = [
      "CodeNATINF1ListeComplete_input",
      "CodeNATINF2ListeComplete_input",
      "CodeNATINF3ListeComplete_input",
    ];
    const selectors = new Set();
    const directPrefix = "#formValidationCorrection\\:";
    const tabPrefix = "#formValidationCorrection\\:tabViewValidationFiche\\:";

    if (domFormat === "tabView") {
      suffixes.forEach((suffix) => selectors.add(`${tabPrefix}${suffix}`));
    } else if (domFormat === "direct") {
      suffixes.forEach((suffix) => selectors.add(`${directPrefix}${suffix}`));
    } else {
      suffixes.forEach((suffix) => {
        selectors.add(`${tabPrefix}${suffix}`);
        selectors.add(`${directPrefix}${suffix}`);
      });
    }

    return Array.from(selectors);
  }

  function extractNatinfFieldValues() {
    const selectors = getNatinfSelectors();
    const seenElements = new Set();
    const results = [];

    selectors.forEach((selector) => {
      const element = document.querySelector(selector);
      if (element && !seenElements.has(element)) {
        seenElements.add(element);
        const value = element.value || "";
        results.push({ selector, value });
      }
    });

    return results;
  }

  function buildNatinfCommentMessage(codes) {
    const baseMessage =
      "NATINF supposant une enquete administrative, veuillez contacter l'unite pour s'assurer que la signalisation est relative a une procedure judiciaire.";
    if (!codes || codes.length === 0) {
      return baseMessage;
    }
    return `${baseMessage} Code(s) detecte(s) : ${codes.join(", ")}`;
  }

  function ensureAdministrativeComment(message, { append = false } = {}) {
    if (!message) {
      return false;
    }

    const textarea = document.querySelector(NATINF_COMMENT_SELECTOR);
    if (!textarea) {
      return false;
    }

    const trimmedMessage = message.trim();
    const currentValue = textarea.value || "";
    let updatedValue = currentValue;

    if (append) {
      if (currentValue.includes(trimmedMessage)) {
        return false;
      }
      const separator = currentValue.trim().length > 0 ? "\n\n" : "";
      updatedValue = `${currentValue}${separator}${trimmedMessage}`;
    } else {
      if (currentValue.trim() === trimmedMessage) {
        return false;
      }
      updatedValue = trimmedMessage;
    }

    textarea.value = updatedValue;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
    textarea.dispatchEvent(new Event("blur", { bubbles: true }));
    return true;
  }

  async function evaluateSensitiveNatinfComment() {
    try {
      const sensitiveSet = await loadNatinfSensitiveSet();
      if (!sensitiveSet || sensitiveSet.size === 0) {
        return { shouldWrite: false, detectedCodes: [], message: "" };
      }

      const fieldValues = extractNatinfFieldValues();
      if (fieldValues.length === 0) {
        return { shouldWrite: false, detectedCodes: [], message: "" };
      }

      const extractedCodes = [];
      let hasNonSensitiveCode = false;
      fieldValues.forEach(({ selector, value }) => {
        if (!value) {
          return;
        }
        const trimmedValue = value.trim();
        if (!trimmedValue) {
          return;
        }
        const match = NATINF_CODE_REGEX.exec(value);
        if (match) {
          const normalized = match[1].toUpperCase();
          extractedCodes.push(normalized);
          if (!sensitiveSet.has(normalized)) {
            hasNonSensitiveCode = true;
          }
        } else {
          hasNonSensitiveCode = true;
        }
      });

      if (extractedCodes.length === 0) {
        return { shouldWrite: false, detectedCodes: [], message: "" };
      }

      const uniqueCodes = Array.from(new Set(extractedCodes));
      const sensitiveMatches = uniqueCodes.filter((code) =>
        sensitiveSet.has(code)
      );

      if (hasNonSensitiveCode) {
        return { shouldWrite: false, detectedCodes: [], message: "" };
      }

      if (sensitiveMatches.length === 0) {
        return { shouldWrite: false, detectedCodes: [], message: "" };
      }

      const message = buildNatinfCommentMessage(sensitiveMatches);
      return { shouldWrite: true, detectedCodes: sensitiveMatches, message };
    } catch (error) {
      logInfo(`❌ Erreur évaluation NATINF: ${error.message}`);
      return { shouldWrite: false, detectedCodes: [], message: "" };
    }
  }

  // Fonction pour diagnostiquer le problème de détection des champs
  function diagnoseDOMIssues() {
    // Fonction de diagnostic simplifiée - logs retirés pour réduire la verbosité
    // Le diagnostic peut être activé manuellement en ajoutant des console.log si nécessaire
  }

  // Fonction pour obtenir le sélecteur approprié en fonction du format DOM
  function getSelector(baseSelector, field) {
    if (domFormat === "tabView") {
      // Cas spéciaux pour certains champs
      if (field === "serviceInitiateur" || field === "serviceSignalisation") {
        return "#formValidationCorrection\\:tabViewValidationFiche\\:ServiceSignalisationListeActive_input";
      } else if (field === "una" || field === "numeroProcedure") {
        return "#formValidationCorrection\\:tabViewValidationFiche\\:NumeroProcedure";
      } else if (field === "serviceRattachement") {
        return "#formValidationCorrection\\:tabViewValidationFiche\\:ServiceRattachement";
      } else if (field === "ficheEtabliePar") {
        return "#formValidationCorrection\\:tabViewValidationFiche\\:ficheEtabliePar";
      } else if (field === "nom") {
        return "#formValidationCorrection\\:tabViewValidationFiche\\:nom";
      } else if (field === "prenom") {
        return "#formValidationCorrection\\:tabViewValidationFiche\\:prenom";
      } else if (field === "identifiantGaspard" || field === "idpp") {
        return "#formValidationCorrection\\:tabViewValidationFiche\\:identifiantGaspard";
      } else if (field === "typeSaisie" || field === "typeDeSignalisation") {
        // Pour le type de saisie, on essaie d'abord le format tabView mais on a aussi un fallback
        return "#formValidationCorrection\\:tabViewValidationFiche\\:typeDeSignalisationValue";
      }
      // Format avec tabViewValidationFiche
      return "#formValidationCorrection\\:tabViewValidationFiche\\:" + field;
    } else {
      // Format direct
      if (field === "serviceInitiateur" || field === "serviceSignalisation") {
        return "#formValidationCorrection\\:ServiceSignalisationListeActive_input";
      } else if (field === "una" || field === "numeroProcedure") {
        return "#formValidationCorrection\\:NumeroProcedure";
      } else if (field === "identifiantGaspard" || field === "idpp") {
        return "#formValidationCorrection\\:identifiantGaspard";
      } else if (field === "typeSaisie" || field === "typeDeSignalisation") {
        return "#formValidationCorrection\\:typeDeSignalisationValue";
      }
      return baseSelector;
    }
  }

  // Fonction pour afficher une fenêtre d'erreur avec les erreurs détectées
  function showErrorWindow(errors) {
    // Supprimer toute fenêtre d'erreur existante
    const existingErrorWindow = document.getElementById("t41-error-window");
    if (existingErrorWindow) {
      existingErrorWindow.remove();
    }

    // Créer la fenêtre d'erreur
    const errorWindow = document.createElement("div");
    errorWindow.id = "t41-error-window";
    errorWindow.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 600px;
            max-height: 80vh;
            background-color: white;
            border: 2px solid #FF4136;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            padding: 20px;
            overflow-y: auto;
        `;

    // Créer l'en-tête
    const header = document.createElement("div");
    header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        `;

    const title = document.createElement("h2");
    title.textContent = "Erreurs détectées dans la fiche";
    title.style.cssText = `
            margin: 0;
            color: #FF4136;
            font-size: 18px;
        `;

    const closeButton = document.createElement("button");
    closeButton.textContent = "✕";
    closeButton.style.cssText = `
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #555;
        `;
    closeButton.onclick = () => errorWindow.remove();

    header.appendChild(title);
    header.appendChild(closeButton);
    errorWindow.appendChild(header);

    // Ajouter la liste des erreurs
    const errorList = document.createElement("ul");
    errorList.style.cssText = `
            list-style-type: none;
            padding: 0;
            margin: 0;
        `;

    errors.forEach((error) => {
      const errorItem = document.createElement("li");
      errorItem.style.cssText = `
                padding: 10px;
                margin-bottom: 8px;
                background-color: #FFF5F5;
                border-left: 4px solid #FF4136;
                font-size: 14px;
            `;
      errorItem.textContent = error;
      errorList.appendChild(errorItem);
    });

    errorWindow.appendChild(errorList);

    // Ajouter des boutons d'action
    const actionButtons = document.createElement("div");
    actionButtons.style.cssText = `
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
            gap: 10px;
        `;

    const continueButton = document.createElement("button");
    continueButton.textContent = "Ignorer et continuer";
    continueButton.style.cssText = `
            padding: 8px 16px;
            background-color: #DDDDDD;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
    continueButton.onclick = () => {
      errorWindow.remove();
      // Continuer le processus si l'utilisateur choisit d'ignorer
      logInfo("L'utilisateur a choisi d'ignorer les erreurs et de continuer");
      // Déclencher automatiquement les étapes suivantes
      executeNextStep((response) => {
        logInfo(
          "Continuation automatique après ignorer les erreurs:",
          response
        );
      });
    };

    const fixButton = document.createElement("button");
    fixButton.textContent = "Corriger les erreurs";
    fixButton.style.cssText = `
            padding: 8px 16px;
            background-color: #FF4136;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
    fixButton.onclick = () => {
      logInfo(
        "L'utilisateur a choisi de corriger les erreurs : Application des corrections automatiques."
      );

      // 1. Cliquer sur le bouton radio "Oui" pour Alphas/Portraits
      const radioOuiAlphaPortraits = document.querySelector(
        "input#formValidationCorrection\\:decisionValidationAlphaPortraits\\:0"
      );
      if (radioOuiAlphaPortraits) {
        if (!radioOuiAlphaPortraits.checked) {
          radioOuiAlphaPortraits.click();
          logInfo("Bouton radio 'Oui' (Alphas/Portraits) cliqué.");
        } else {
          logInfo("Bouton radio 'Oui' (Alphas/Portraits) était déjà coché.");
        }
      } else {
        logInfo(
          "ERREUR : Bouton radio 'Oui' (Alphas/Portraits) non trouvé.",
          "input#formValidationCorrection\\:decisionValidationAlphaPortraits\\:0"
        );
      }

      // Attendre 1 seconde avant de continuer
      setTimeout(() => {
        logInfo("Délai de 1s écoulé, inscription des commentaires...");

        // 2. Inscrire les messages d'erreurs dans la fenêtre de commentaire
        const commentairesTextarea = document.querySelector(
          "textarea[id='formValidationCorrection:commentairesEtapes']"
        );
        if (commentairesTextarea) {
          const errorMessages = errors
            .map((error, index) => `${index + 1}. ${error}`)
            .join("\n"); // Numéroter et concaténer
          commentairesTextarea.value = errorMessages;
          logInfo(
            "Messages d'erreur numérotés inscrits dans la zone de commentaires."
          );

          // Déclencher l'événement blur pour que PrimeFaces prenne en compte la modification
          const event = new Event("blur", { bubbles: true });
          commentairesTextarea.dispatchEvent(event);
          logInfo("Événement 'blur' déclenché sur la zone de commentaires.");
        } else {
          logInfo(
            "ERREUR : Zone de commentaires non trouvée.",
            "textarea#formValidationCorrection\\:commentairesEtapes"
          );
        }

        // Fermer la fenêtre d'erreur après le délai et les actions
        errorWindow.remove();
        logInfo("Fenêtre d'erreur fermée après délai et corrections.");
      }, 500); // Délai de 500 ms (0.5 seconde)
    };

    actionButtons.appendChild(continueButton);
    actionButtons.appendChild(fixButton);
    errorWindow.appendChild(actionButtons);

    // Ajouter la fenêtre au document
    document.body.appendChild(errorWindow);

    // Retourner la fenêtre pour permettre des manipulations supplémentaires
    return errorWindow;
  }

  // Fonction principale pour vérifier les données alphanumériques
  async function verifyAlphaNumericData() {
    logInfo("⭐ DÉBUT DE LA VÉRIFICATION DES DONNÉES ALPHANUMÉRIQUES ⭐");
    if (!isControleDeFichePage()) {
      logInfo(
        "Vérification alphanumérique annulée: pas sur la page 'CONTROLE DE LA FICHE'."
      );
      if (loopProcessingActive) {
        // Si le traitement était actif et qu'on n'est plus sur la page de contrôle,
        // cela signifie probablement que le traitement s'est terminé avec succès
        logInfo("Traitement terminé avec succès, retour à l'écran d'accueil.");
        loopProcessingActive = false;
        await browser.storage.local.set({ loopProcessingActive: false });
        browser.runtime
          .sendMessage({
            command: "loopProcessingStopped",
            reason: "processing_completed",
          })
          .catch((e) =>
            console.warn("Erreur envoi message loopProcessingStopped:", e)
          );
      }
      return false;
    }

    // Vérification de l'indicateur de chargement avant de commencer
    if (isLoadingIndicatorPresent()) {
      logInfo(
        "🔄 Indicateur de chargement détecté, mise en attente de la vérification"
      );
      await waitForLoadingToComplete(); // Appel corrigé
      return await performVerification(); // Appel corrigé
    } else {
      return await performVerification();
    }
  }

  // Nouvelle fonction pour appliquer les corrections automatiques
  async function applyAutomaticCorrections(errors) {
    logInfo("⚙️ Application des corrections automatiques...");

    try {
      // 1. Cliquer sur le bouton radio "Oui" pour Alphas/Portraits
      const radioOuiAlphaPortraits = document.querySelector(
        "input[id='formValidationCorrection:decisionValidationAlphaPortraits:0']"
      );
      if (radioOuiAlphaPortraits) {
        if (!radioOuiAlphaPortraits.checked) {
          radioOuiAlphaPortraits.click();
          logInfo(
            "Bouton radio 'Oui' (Alphas/Portraits) cliqué automatiquement."
          );
        } else {
          logInfo("Bouton radio 'Oui' (Alphas/Portraits) était déjà coché.");
        }
      } else {
        logInfo(
          "AVERTISSEMENT lors de la correction auto: Bouton radio 'Oui' (Alphas/Portraits) non trouvé.",
          "input[id='formValidationCorrection:decisionValidationAlphaPortraits:0']"
        );
      }
    } catch (e) {
      logInfo("ERREUR TECHNIQUE lors du clic sur radio 'Oui': " + e.message, e);
    }

    // Délai pour permettre à la page de réagir (surtout avec PrimeFaces)
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      // 2. Inscrire les messages d'erreurs dans la fenêtre de commentaire
      const commentairesTextarea = document.querySelector(
        "textarea[id='formValidationCorrection:commentairesEtapes']"
      );
      if (commentairesTextarea) {
        const errorMessages = errors
          .map((error, index) => `${index + 1}. ${error}`)
          .join("\\n");
        commentairesTextarea.value = errorMessages;
        logInfo(
          "Messages d'erreur numérotés inscrits automatiquement dans la zone de commentaires."
        );

        const event = new Event("blur", { bubbles: true });
        commentairesTextarea.dispatchEvent(event);
        logInfo(
          "Événement 'blur' déclenché automatiquement sur la zone de commentaires."
        );
      } else {
        logInfo(
          "AVERTISSEMENT lors de la correction auto: Zone de commentaires non trouvée.",
          "textarea#formValidationCorrection\\\\:commentairesEtapes"
        );
      }
    } catch (e) {
      logInfo(
        "ERREUR TECHNIQUE lors de l'écriture dans commentaires: " + e.message,
        e
      );
    }

    logInfo("🛠️ Tentative de corrections automatiques terminée.");
  }

  // Centraliser la logique d'arrêt de la boucle en cas d'erreur de validation
  async function handleValidationError(errors) {
    logInfo(
      `⚙️ Application des corrections automatiques pour ${errors.length} erreur(s) détectée(s)...`,
      errors
    );

    // Toujours appliquer les corrections automatiques
    await applyAutomaticCorrections(errors);

    logInfo(
      "Corrections automatiques appliquées. Le traitement va continuer avec les étapes suivantes."
    );
    // Note: showErrorWindow n'est plus appelée d'ici.
    // loopProcessingActive n'est plus géré d'ici.
    // Cette fonction ne contrôle plus le flux, elle applique seulement les corrections.
  }

  // Fonction interne qui effectue la vérification des données
  async function performVerification() {
    try {
      // Détection du format DOM si pas encore fait
      if (!domFormat) {
        domFormat = detectDOMFormat();
      }

      // Si le format DOM est inconnu, lancer le diagnostic
      if (domFormat === "unknown" || domFormat === "notFound") {
        diagnoseDOMIssues();
      }

      // Fonction pour obtenir la valeur d'un élément avec un sélecteur principal et une alternative
      const getValue = (baseSelector, field) => {
        const selector = getSelector(baseSelector, field);
        const element = document.querySelector(selector);

        if (element) {
          return element.value?.trim() || "";
        }

        // Si le champ est le type de saisie, essayer une recherche directe
        if (field === "typeSaisie" || field === "typeDeSignalisation") {
          const directSelector =
            "#formValidationCorrection\\:typeDeSignalisationValue";
          const directElement = document.querySelector(directSelector);

          if (directElement) {
            return directElement.value?.trim() || "";
          }
        }

        // Si le format n'est pas trouvé, essayer les deux formats
        if (domFormat === "unknown" || domFormat === "notFound") {
          const altSelector =
            field === "serviceInitiateur" || field === "serviceSignalisation"
              ? "#formValidationCorrection\\:tabViewValidationFiche\\:ServiceSignalisationListeActive_input"
              : "#formValidationCorrection\\:" + field;

          const altElement = document.querySelector(altSelector);
          if (altElement) {
            return altElement.value?.trim() || "";
          }
        }

        // Dernière tentative: chercher par texte de label pour le type de saisie
        if (field === "typeSaisie" || field === "typeDeSignalisation") {
          const labels = document.querySelectorAll("label");
          for (const label of labels) {
            if (label.textContent.includes("Type")) {
              const nextElement = label.nextElementSibling;
              if (nextElement && nextElement.tagName === "INPUT") {
                return nextElement.value?.trim() || "";
              }
            }
          }
        }

        return "";
      };

      // Extraction des valeurs en utilisant la fonction robuste
      const idppGaspardValue = getValue(
        "#formValidationCorrection\\:identifiantGaspard",
        "identifiantGaspard"
      );
      const typeSaisieValue = getValue(
        "#formValidationCorrection:typeDeSignalisationValue",
        "typeDeSignalisation"
      );
      const nomValue = getValue("#formValidationCorrection\\:nom", "nom");
      const prenomValue = getValue(
        "#formValidationCorrection\\:prenom",
        "prenom"
      );
      const serviceInitiateurValue = getValue(
        "#formValidationCorrection\\:serviceInitiateur",
        "serviceSignalisation"
      );
      const unaValue = getValue(
        "#formValidationCorrection\\:una",
        "numeroProcedure"
      );
      const ficheEtablieParValue = getValue(
        "#formValidationCorrection\\:ficheEtabliePar",
        "ficheEtabliePar"
      );
      const serviceRattachementValue = getValue(
        "#formValidationCorrection\\:serviceRattachement",
        "serviceRattachement"
      );

      const natinfCommentInfo = await evaluateSensitiveNatinfComment();

      const validationResults = {
        identifiantGaspard: true,
        typeSaisie: true,
        nom: true,
        prenom: true,
        serviceInitiateur: true,
        una: true,
        ficheEtabliePar: true,
        serviceRattachement: true,
      };
      const errors = [];

      // Règle Critique 1: Détection de "NEO-TEST" / "NEOTEST"
      const neoTestPattern = /NEO-?TEST/i;
      let neoTestFoundIn = null;

      // if (neoTestPattern.test(idppGaspardValue))
      //   neoTestFoundIn = "IDPP/GASPARD";
      // else if (neoTestPattern.test(typeSaisieValue))
      if (neoTestPattern.test(typeSaisieValue))
        neoTestFoundIn = "Type de saisie";
      else if (neoTestPattern.test(nomValue)) neoTestFoundIn = "Nom";
      else if (neoTestPattern.test(prenomValue)) neoTestFoundIn = "Prénom(s)";
      else if (neoTestPattern.test(serviceInitiateurValue))
        neoTestFoundIn = "Service initiateur";
      else if (neoTestPattern.test(unaValue)) neoTestFoundIn = "Proc/UNA";
      else if (neoTestPattern.test(ficheEtablieParValue))
        neoTestFoundIn = "Fiche établie par";
      else if (neoTestPattern.test(serviceRattachementValue))
        neoTestFoundIn = "Service de rattachement";

      if (neoTestFoundIn) {
        const errorMessage = `Détection de 'NEO-TEST' dans le champ '${neoTestFoundIn}'. (Correction automatique appliquée)`;
        logInfo(errorMessage);
        errors.push(errorMessage);
        validationResults[
          neoTestFoundIn.toLowerCase().replace(/[^a-z0-9]/gi, "")
        ] = false;
        // Ne plus retourner ou appeler handleValidationError ici directement pour arrêter.
      }

      // Règle Critique 2: Détection de "FRANCK DESMIS"
      if (ficheEtablieParValue && /FRANCK DESMIS/i.test(ficheEtablieParValue)) {
        const errorMessage =
          "La 'Fiche établie par' contient 'FRANCK DESMIS'. (Correction automatique appliquée)";
        logInfo(errorMessage);
        errors.push(errorMessage);
        validationResults.ficheEtabliePar = false;
        // Ne plus retourner ou appeler handleValidationError ici directement pour arrêter.
      }

      // Nouvelle logique consolidée pour la validation du Service de Rattachement / Terminal de saisie
      if (typeSaisieValue.toUpperCase() === "SM") {
        // Si Type de saisie est SM
        if (
          serviceRattachementValue === "" ||
          serviceRattachementValue.toUpperCase() === "NEODK"
        ) {
          // Valide: vide ou NEODK
          logInfo(
            "Service de rattachement valide (Type Saisie SM, valeur vide ou NEODK)."
          );
          // validationResults.serviceRattachement reste true par défaut
        } else {
          // Invalide pour SM
          errors.push(
            "Lorsque le Type de saisie est 'SM', le champ 'Service de rattachement/Terminal de saisie' doit être vide ou égal à 'NEODK'."
          );
          validationResults.serviceRattachement = false;
          logInfo(
            "Erreur: Service de rattachement invalide (Type Saisie SM, valeur '" +
              serviceRattachementValue +
              "' ni vide ni NEODK)."
          );
          // La vérification finale de errors.length > 0 gérera l'arrêt de la boucle
        }
      } else {
        // Si Type de saisie N'EST PAS SM
        if (
          !serviceRattachementValue ||
          !/^\d{5}$/.test(serviceRattachementValue)
        ) {
          errors.push(
            "Terminal de saisie = code unité à cinq chiffres (de l'unité dotée du matériel)"
          );
          validationResults.serviceRattachement = false;
          logInfo(
            "Erreur: Service de rattachement invalide (Type Saisie != SM, valeur '" +
              serviceRattachementValue +
              "' pas un nombre à 5 chiffres ou vide)."
          );
          // La vérification finale de errors.length > 0 gérera l'arrêt de la boucle
        } else {
          // Valide pour non-SM (5 chiffres)
          logInfo(
            "Service de rattachement valide (Type Saisie != SM, 5 chiffres)."
          );
          // validationResults.serviceRattachement reste true par défaut
        }
      }

      // Règle spécifique : Si terminal 11707 avec IDPP renseigné
      if (serviceRattachementValue === "11707") {
        logInfo(
          "Terminal de saisie est 11707, vérification de la présence d'un IDPP."
        );
        if (idppGaspardValue && idppGaspardValue.trim() !== "") {
          errors.push("Signalisation multiple : retirer l'IDPP");
          validationResults.identifiantGaspard = false;
          logInfo(
            "Erreur: IDPP renseigné alors que le terminal de saisie est 11707. IDPP: " +
              idppGaspardValue
          );
        } else {
          logInfo("Pas d'IDPP renseigné, validation OK pour terminal 11707.");
        }
      }

      // Règle 4 (partie Service Initiateur): Validations conditionnées par la présence de l'IDPP et le Type de Saisie
      if (typeSaisieValue.toUpperCase() !== "SM" && typeSaisieValue.toUpperCase() !== "SN") {
        logInfo(
          "Type de saisie n'est ni SM ni SN, poursuite de la vérification du Service Initiateur."
        );
        // --- Si IDPP/GASPARD EST renseigné ---
        // if (idppGaspardValue) {
        //   logInfo(
        //     "IDPP/GASPARD renseigné, vérification spécifique du Service Initiateur (car Type Saisie != SM)"
        //   );
        //   const forbiddenKeywords = [
        //     "CELLULE",
        //     "DEPARTEMENTALE",
        //     "DÉPARTEMENTALE",
        //   ];
        //   if (
        //     serviceInitiateurValue && // On ne vérifie que si le champ est renseigné
        //     forbiddenKeywords.some((keyword) =>
        //       serviceInitiateurValue.toUpperCase().includes(keyword)
        //     )
        //   ) {
        //     errors.push(
        //       "Avec un IDPP/GASPARD renseigné, le 'Service initiateur' ne doit pas contenir 'CELLULE', 'DEPARTEMENTALE' ou 'DÉPARTEMENTALE'."
        //     );
        //     validationResults.serviceInitiateur = false;
        //     logInfo(
        //       "Erreur: Service initiateur contient un mot clé interdit (IDPP présent, Type Saisie != SM)."
        //     );
        //   }
        // }
        // --- Si IDPP/GASPARD n'est PAS renseigné ---
        // else {
        // Règle : Si IDPP/GASPARD n'est pas renseigné (ce qui est toujours le cas maintenant), le service initiateur devient obligatoire et doit respecter certains formats.
        // Comme idppGaspardValue est maintenant toujours considéré comme non renseigné, cette logique s'appliquera toujours si Type Saisie != "SM".
        logInfo(
          "IDPP/GASPARD non renseigné (ou ignoré), vérification du Service Initiateur (car Type Saisie != SM)"
        );
        if (!serviceInitiateurValue) {
          errors.push(
            "Sans IDPP/GASPARD (ou si ignoré), le 'Service initiateur' est obligatoire (quand Type Saisie != SM)."
          );
          validationResults.serviceInitiateur = false;
          logInfo(
            "Erreur: Service initiateur non renseigné (IDPP absent/ignoré, Type Saisie != SM)."
          );
          // La vérification finale de errors.length > 0 gérera l'arrêt de la boucle
        } else {
          const hasLetters = /[a-zA-Z]/.test(serviceInitiateurValue);
          const hasNumbers = /[0-9]/.test(serviceInitiateurValue);
          if (!hasLetters || !hasNumbers) {
            errors.push(
              "Sans IDPP/GASPARD (ou si ignoré), le 'Service initiateur' doit contenir des lettres et des chiffres (quand Type Saisie != SM)."
            );
            validationResults.serviceInitiateur = false;
            logInfo(
              "Erreur: Service initiateur ne contient pas lettres ET chiffres (IDPP absent/ignoré, Type Saisie != SM)."
            );
            // La vérification finale de errors.length > 0 gérera l'arrêt de la boucle
          }
          // Optionnel: ajouter une regex plus spécifique si nécessaire, par exemple:
          // if (!/^[A-Z0-9\s\W\-]+$/i.test(serviceInitiateurValue)) {
          //     errors.push("Format invalide pour 'Service initiateur' (si IDPP absent et Type Saisie != SM).");
          //     validationResults.serviceInitiateur = false;
          // }
        }
        // }

        // NOUVELLE RÈGLE : Vérification spécifique pour SERVICE DE SIGNALISATION si type de saisie n'est ni SM ni SN
        const typeSaisieUpperForNewRule = typeSaisieValue.toUpperCase();
        if (
          typeSaisieUpperForNewRule !== "SM" &&
          typeSaisieUpperForNewRule !== "SN"
        ) {
          logInfo(
            "Nouvelle règle: Type de saisie (" +
              typeSaisieUpperForNewRule +
              ") n'est ni SM ni SN. Vérification de Service de Signalisation pour CELLULE/DEPARTEMENT."
          );
          if (serviceInitiateurValue) {
            // serviceInitiateurValue correspond au champ "Service de signalisation"
            const serviceSignalisationUpper =
              serviceInitiateurValue.toUpperCase();
            // Utilisation de DEPARTEMENT au lieu de DÉPARTEMENTALE pour correspondre à la demande
            if (
              serviceSignalisationUpper.includes("CELLULE") ||
              serviceSignalisationUpper.includes("DEPARTEMENT")
            ) {
              const errorMessage =
                "Service de signalisation = unité qui a réalisé le RDK.";
              errors.push(errorMessage);
              // Marquer le champ d'une manière qui n'écrase pas une erreur existante plus grave
              if (validationResults.serviceInitiateur !== false) {
                validationResults.serviceInitiateur = "warning_rdk"; //  Permet un traitement spécifique si besoin
              }
              logInfo(
                "Erreur (Nouvelle règle): " +
                  errorMessage +
                  " (Service de signalisation: " +
                  serviceInitiateurValue +
                  ")"
              );
            }
          }
        }
        // Fin NOUVELLE RÈGLE
      } else {
        // Si Type de saisie EST SM ou SN
        logInfo(
          "Type de saisie est SM ou SN, la vérification du Service Initiateur est ignorée."
        );
        // validationResults.serviceInitiateur reste true par défaut, ce qui est correct.
      }

      // Règle 4 (parties UNA et Service Rattachement si IDPP absent):
      // Ces vérifications se font si IDPP est absent, indépendamment de la règle SM pour le Service Initiateur.
      // if (!idppGaspardValue) {
      // Puisque idppGaspardValue est commenté, cette condition sera toujours vraie (comme si IDPP était absent).
      // Donc, les vérifications pour UNA et Service de Rattachement s'appliqueront comme si IDPP était toujours absent.
      // IMPORTANT: Validation UNA uniquement si Type n'est ni "SM" ni "SN"
      if (typeSaisieValue.toUpperCase() !== "SM" && typeSaisieValue.toUpperCase() !== "SN") {
        logInfo(
          "IDPP/GASPARD non renseigné (ou ignoré), vérification des champs UNA et Service de Rattachement."
        );
        // Validation de Proc/UNA (si IDPP absent)
        if (!unaValue) {
          errors.push("L'UNA doit être au format 5/5/4");
          validationResults.una = false;
          logInfo("Erreur: UNA non renseigné (IDPP absent).");
          // La vérification finale de errors.length > 0 gérera l'arrêt de la boucle
        } else if (!/^\d{1,5}\/\d{1,5}\/\d{4}$/.test(unaValue)) {
          errors.push("L'UNA doit être au format 5/5/4");
          validationResults.una = false;
          logInfo("Erreur: Format UNA invalide (IDPP absent).");
          // La vérification finale de errors.length > 0 gérera l'arrêt de la boucle
        }
      } else {
        logInfo(
          "Type de saisie est SM ou SN, la vérification UNA est ignorée."
        );
      }

      // Validation du Service de Rattachement (si IDPP absent ET Type Saisie == SM, car la vérif Type != SM est déjà faite plus haut)
      // La règle 3 a déjà couvert le cas où Type != SM.
      // Ici, on s'assure qu'il est valide si Type == SM (auquel cas la règle 3 n'a pas levé d'erreur pour ce champ)
      // OU si Type != SM mais qu'il a passé la règle 3 (ne devrait pas arriver si la logique est correcte).
      // Plus simplement : si IDPP est absent :
      //    - ET Type != SM : Déjà couvert par Règle 3.
      //    - ET Type == SM : ServiceRattachement est-il requis (5 chiffres) ?
      // La logique dans alphasMatchLogic.md (si IDPP absent -> ServiceRattachement obligatoire) semble primer.
      // Le code actuel avant modif appliquait cette logique (vérif si IDPP absent).
      // Je maintiens donc la vérification du service de rattachement ici si IDPP est absent,
      // car c'était la logique existante et elle semble correspondre à une exigence distincte.
      // if (
      //   !serviceRattachementValue ||
      //   !/^\d{5}$/.test(serviceRattachementValue)
      // ) {
      //   // On ne PUSH l'erreur QUE si elle n'a pas déjà été poussée par la Règle 3
      //   // pour éviter les doublons de messages d'erreur pour le même champ.
      //   const serviceRattachementErrorExists = errors.some((err) =>
      //     err.includes("Service de rattachement")
      //   );
      //   if (!serviceRattachementErrorExists) {
      //     errors.push(
      //       "Sans IDPP/GASPARD, le champ 'Service de rattachement et d'investigation/Terminal de saisie' est obligatoire et doit être un nombre à 5 chiffres."
      //     );
      //     logInfo(
      //       "Erreur: Service de rattachement invalide (IDPP absent, et non déjà signalé par Règle 3)."
      //     );
      //   }
      //   // Dans tous les cas, si le champ n'est pas valide ici (IDPP absent), on marque validationResults comme false.
      //   validationResults.serviceRattachement = false;
      // }

      // La validation du Service de Rattachement est maintenant gérée intégralement par la logique consolidée plus haut (ancienne Règle 3).
      // Il n'est plus nécessaire de la vérifier ici.

      // Mise en évidence des champs avec erreurs
      if (errors.length > 0) {
        logInfo(
          "Mise en évidence des champs avec erreurs (avant correction auto)..."
        );
        highlightErrorFields(validationResults, errors);
      }

      // Traitement des erreurs (correction auto)
      let correctionsApplied = false; // Drapeau pour savoir si des corrections ont été faites
      if (errors.length > 0) {
        logInfo(
          `Validation a trouvé ${errors.length} erreur(s). Application des corrections automatiques.`
        );
        await handleValidationError(errors); // Applique les corrections (cocher oui, coller erreurs)
        correctionsApplied = true; // Marquer que les corrections ont été faites
        currentProcessOutcome = "correction";
        logInfo(
          "Corrections automatiques appliquées. Poursuite du traitement."
        );
      } else {
        currentProcessOutcome = "validated";
        logInfo(
          "✅ VALIDATION RÉUSSIE: Toutes les données sont conformes. Poursuite du traitement."
        );
      }

      if (natinfCommentInfo.shouldWrite) {
        const commentApplied = ensureAdministrativeComment(
          natinfCommentInfo.message,
          { append: correctionsApplied }
        );
        if (!commentApplied) {
          logInfo(
            "Insertion du message NATINF non necessaire ou impossible (deja present ou zone indisponible)."
          );
        }
      }

      // Toujours lancer les étapes automatiques après la phase de validation/correction.
      logInfo("🚀 Lancement des étapes automatiques pour la fiche actuelle...");

      // currentStepIndex = 0; // Ancienne initialisation unique
      alphaStepIndex = 0; // Si utilisé pour les étapes alpha, réinitialiser
      sequenceStartTime = Date.now();

      if (correctionsApplied) {
        logInfo(
          "Des corrections automatiques ayant été appliquées (Oui coché), les étapes commenceront à l'index 1 (sautant 'Cocher Non')."
        );
        currentStepIndex = 1; // Sauter l'étape 0 "Cocher Non"
      } else {
        currentStepIndex = 0; // Commencer normalement à l'étape 0
      }

      logInfo(
        `Début de la séquence d'actions automatiques à ${new Date(
          sequenceStartTime
        ).toISOString()}. Mode boucle: ${loopProcessingActive}. Index de départ des étapes: ${currentStepIndex}`
      );

      await runAutomatedSteps(); // Exécute les étapes définies dans la constante \`steps\`

      return true; // Indique que la phase de vérification/correction est terminée et que les actions ont été lancées.
    } catch (error) {
      logInfo(`🔴 ERREUR TECHNIQUE: ${error.message}`, error);
      showErrorWindow([
        "Erreur technique lors de la vérification: " + error.message,
      ]);
      return false;
    }
  }

  // Fonction pour mettre en évidence les champs avec erreurs
  function highlightErrorFields(validationResults, errors) {
    try {
      // Réinitialiser les styles précédents
      const allFields = [
        "identifiantGaspard",
        "typeDeSignalisationValue",
        "serviceInitiateur",
        "una",
        "ficheEtabliePar",
        "serviceRattachement",
        "nom",
        "prenom",
      ];

      allFields.forEach((field) => {
        const selector = getSelector(
          `#formValidationCorrection\\:${field}`,
          field
        );
        const element = document.querySelector(selector);

        if (element) {
          element.style.border = "";
          element.style.backgroundColor = "";

          // Supprimer l'indicateur d'erreur existant s'il y en a un
          const errorIndicator = document.querySelector(
            `${selector.replace(/[\\:]/g, "")}-error-indicator`
          );
          if (errorIndicator) {
            errorIndicator.remove();
          }
        }
      });

      // Appliquer les styles d'erreur
      if (
        validationResults.neotest === "❌ ÉCHEC" ||
        validationResults.frankDesmis === "❌ ÉCHEC"
      ) {
        highlightField("ficheEtabliePar");
      }

      if (validationResults.typeSaisie === "❌ ÉCHEC") {
        highlightField("typeDeSignalisationValue");
      }

      if (validationResults.serviceRattachementFormat === "❌ ÉCHEC") {
        highlightField("serviceRattachement");
      }

      if (validationResults.serviceSignalisationFormat === "❌ ÉCHEC") {
        highlightField("serviceInitiateur"); // Utilise le sélecteur pour Service initiateur/signalisation
      }

      if (validationResults.unaFormat === "❌ ÉCHEC") {
        highlightField("una");
      }

      logInfo("Mise en évidence des champs terminée");
    } catch (error) {
      logInfo(
        `Erreur lors de la mise en évidence des champs: ${error.message}`,
        error
      );
    }
  }

  // Fonction pour mettre en évidence un champ spécifique
  function highlightField(field) {
    const selector = getSelector(`#formValidationCorrection\\:${field}`, field);
    const element = document.querySelector(selector);

    if (element) {
      // Sauvegarder les styles originaux
      const originalBorder = element.style.border;
      const originalBackground = element.style.backgroundColor;

      // Appliquer les styles d'erreur
      element.style.border = "2px solid #FF4136";
      element.style.backgroundColor = "#FFF5F5";

      // Ajouter un indicateur d'erreur
      const parent = element.parentNode;
      const errorIndicator = document.createElement("div");
      errorIndicator.id = `${selector.replace(/[\\:]/g, "")}-error-indicator`;
      errorIndicator.innerHTML = "⚠️";
      errorIndicator.style.cssText = `
                display: inline-block;
                margin-left: 8px;
                color: #FF4136;
                font-size: 16px;
            `;
      parent.appendChild(errorIndicator);

      // Ajouter une info-bulle sur l'indicateur d'erreur
      errorIndicator.title = "Ce champ contient une erreur";

      logInfo(`Champ mis en évidence: ${selector}`);
    } else {
      logInfo(`Champ introuvable pour mise en évidence: ${selector}`);

      // Essayer de trouver un élément alternatif si l'élément direct n'est pas trouvé
      if (field === "serviceInitiateur") {
        const altSelector =
          "#formValidationCorrection\\:tabViewValidationFiche\\:ServiceSignalisationListeActive_input";
        const altElement = document.querySelector(altSelector);
        if (altElement) {
          altElement.style.border = "2px solid #FF4136";
          altElement.style.backgroundColor = "#FFF5F5";
          logInfo(`Alternative utilisée pour mise en évidence: ${altSelector}`);
        }
      } else if (field === "una") {
        const altSelector =
          "#formValidationCorrection\\:tabViewValidationFiche\\:NumeroProcedure";
        const altElement = document.querySelector(altSelector);
        if (altElement) {
          altElement.style.border = "2px solid #FF4136";
          altElement.style.backgroundColor = "#FFF5F5";
          logInfo(`Alternative utilisée pour mise en évidence: ${altSelector}`);
        }
      } else if (field === "serviceRattachement") {
        const altSelector =
          "#formValidationCorrection\\:tabViewValidationFiche\\:ServiceRattachement";
        const altElement = document.querySelector(altSelector);
        if (altElement) {
          altElement.style.border = "2px solid #FF4136";
          altElement.style.backgroundColor = "#FFF5F5";
          logInfo(`Alternative utilisée pour mise en évidence: ${altSelector}`);
        }
      } else if (field === "typeDeSignalisationValue") {
        const altSelector =
          "#formValidationCorrection\\:tabViewValidationFiche\\:typeDeSignalisationValue";
        const altElement = document.querySelector(altSelector);
        if (altElement) {
          altElement.style.border = "2px solid #FF4136";
          altElement.style.backgroundColor = "#FFF5F5";
          logInfo(`Alternative utilisée pour mise en évidence: ${altSelector}`);
        }
      }
    }
  }

  // Fonctions pour l'automatisation (intégrées depuis contentScript.js)
  // Fonction pour attendre un élément ou un fallback
  async function waitForElementOrFallback(
    selector,
    fallbackSelector,
    callback,
    timeout = 5000
  ) {
    // Vérifier d'abord si l'indicateur de chargement est présent
    if (isLoadingIndicatorPresent()) {
      logInfo(
        `🔄 Indicateur de chargement détecté, mise en attente avant de chercher ${selector} ou ${fallbackSelector}`
      );
      await waitForLoadingToComplete();
      waitForElementOrFallbackInternal(
        selector,
        fallbackSelector,
        callback,
        timeout
      );
    } else {
      waitForElementOrFallbackInternal(
        selector,
        fallbackSelector,
        callback,
        timeout
      );
    }
  }

  // Fonction interne pour attendre un élément ou un fallback
  function waitForElementOrFallbackInternal(
    selector,
    fallbackSelector,
    callback,
    timeout = 5000,
    onTimeout = null
  ) {
    const startTime = Date.now();
    const interval = setInterval(async () => {
      try {
        // Vérifier à nouveau l'indicateur de chargement pendant la recherche de l'élément
        if (isLoadingIndicatorPresent()) {
          clearInterval(interval);
          logInfo(
            `🔄 Indicateur de chargement détecté pendant la recherche de ${selector} ou ${fallbackSelector}, reprise de l'attente`
          );
          await waitForLoadingToComplete();
          waitForElementOrFallbackInternal(
            selector,
            fallbackSelector,
            callback,
            timeout - (Date.now() - startTime),
            onTimeout
          );
          return;
        }

        const element = document.querySelector(selector);
        const fallbackElement = fallbackSelector
          ? document.querySelector(fallbackSelector)
          : null;

        if (
          (element &&
            !element.disabled &&
            element.getAttribute("aria-disabled") !== "true") ||
          fallbackElement
        ) {
          clearInterval(interval);
          callback(element, fallbackElement);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(interval);
          logInfo(
            `Aucun élément trouvé pour les sélecteurs : ${selector}, ${fallbackSelector}`
          );
          if (onTimeout) {
            onTimeout(new Error(`Timeout: aucun élément trouvé pour ${selector} ou ${fallbackSelector} après ${timeout}ms`));
          }
        }
      } catch (error) {
        clearInterval(interval);
        logInfo("Erreur dans waitForElementOrFallback :", error);
        if (onTimeout) {
          onTimeout(error);
        }
      }
    }, 100);
  }

  // Fonction pour attendre un élément
  async function waitForElement(selector, callback, timeout = 5000) {
    // Vérifier d'abord si l'indicateur de chargement est présent
    if (isLoadingIndicatorPresent()) {
      logInfo(
        `🔄 Indicateur de chargement détecté, mise en attente avant de chercher ${selector}`
      );
      await waitForLoadingToComplete();
      waitForElementInternal(selector, callback, timeout);
    } else {
      waitForElementInternal(selector, callback, timeout);
    }
  }

  // Fonction interne pour attendre un élément
  function waitForElementInternal(selector, callback, timeout = 5000, onTimeout = null) {
    const startTime = Date.now();
    const interval = setInterval(async () => {
      try {
        // Vérifier à nouveau l'indicateur de chargement pendant la recherche de l'élément
        if (isLoadingIndicatorPresent()) {
          clearInterval(interval);
          logInfo(
            `🔄 Indicateur de chargement détecté pendant la recherche de ${selector}, reprise de l'attente`
          );
          await waitForLoadingToComplete();
          waitForElementInternal(
            selector,
            callback,
            timeout - (Date.now() - startTime),
            onTimeout
          );
          return;
        }

        const element = document.querySelector(selector);
        if (element) {
          clearInterval(interval);
          callback(element);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(interval);
          logInfo(`Élément introuvable : ${selector}`);
          if (onTimeout) {
            onTimeout(new Error(`Timeout: élément ${selector} introuvable après ${timeout}ms`));
          }
        }
      } catch (error) {
        clearInterval(interval);
        logInfo("Erreur dans waitForElement :", error);
        if (onTimeout) {
          onTimeout(error);
        }
      }
    }, 100);
  }

  // Fonction pour exécuter les étapes contenant plusieurs actions
  async function executeMultipleActions(actions, sendResponse, actionIndex = 0) {
    if (isLoadingIndicatorPresent()) {
      logInfo(
        `🔄 Indicateur de chargement détecté avant l'exécution de l'action ${actionIndex}, mise en attente`
      );
      await waitForLoadingToComplete();
      executeMultipleActionsInternal(actions, sendResponse, actionIndex);
    } else {
      executeMultipleActionsInternal(actions, sendResponse, actionIndex);
    }
  }

  // Fonction interne pour exécuter plusieurs actions
  function executeMultipleActionsInternal(
    actions,
    sendResponse,
    actionIndex = 0
  ) {
    if (actionIndex >= actions.length) {
      logInfo("Toutes les actions de l'étape ont été exécutées.");
      currentStepIndex++;
      // Envoyer l'état mis à jour au popup
      // DEBUG: Vérifier sequenceStartTime avant calcul elapsedTime pour stepCompleted
      logInfo(
        `DEBUG: (multi-actions) sequenceStartTime avant calcul stepCompleted: ${sequenceStartTime}`
      );
      const elapsedTime = sequenceStartTime
        ? Date.now() - sequenceStartTime
        : 0;
      // DEBUG: Vérifier elapsedTime pour stepCompleted
      logInfo(
        `DEBUG: (multi-actions) elapsedTime pour stepCompleted: ${elapsedTime}`
      );
      browser.runtime
        .sendMessage({
          status: "stepCompleted",
          nextStepIndex: currentStepIndex,
          elapsedTime: elapsedTime,
        })
        .catch((err) => {
          console.error(
            "Erreur envoi stepCompleted depuis multi-actions:",
            err
          );
        });
      return;
    }

    const action = actions[actionIndex];
    logInfo(`Exécution de l'action : ${action.description}`);

    // Vérifier spécifiquement si c'est l'action sur l'onglet Portraits
    if (
      action.description.includes("Vérifier et cliquer sur l'onglet Portraits")
    ) {
      const portraitTabSelector = action.selector;
      const portraitTab = document.querySelector(portraitTabSelector);

      if (portraitTab) {
        const liParent = portraitTab.closest("li");
        const isDisabled =
          liParent && liParent.classList.contains("ui-state-disabled");

        if (isDisabled) {
          logInfo(
            "Onglet Portraits désactivé détecté avant de tenter le clic, passage à l'étape suivante"
          );
          // Terminer cette étape et passer à la suivante
          currentStepIndex++;
          // Envoyer l'état mis à jour au popup
          // DEBUG: Vérifier sequenceStartTime avant calcul elapsedTime pour stepCompleted
          logInfo(
            `DEBUG: (onglet portraits) sequenceStartTime avant calcul stepCompleted: ${sequenceStartTime}`
          );
          const elapsedTime = sequenceStartTime
            ? Date.now() - sequenceStartTime
            : 0;
          // DEBUG: Vérifier elapsedTime pour stepCompleted
          logInfo(
            `DEBUG: (onglet portraits) elapsedTime pour stepCompleted: ${elapsedTime}`
          );
          browser.runtime
            .sendMessage({
              status: "stepCompleted",
              nextStepIndex: currentStepIndex,
              elapsedTime: elapsedTime,
            })
            .catch((err) => {
              console.error(
                "Erreur envoi stepCompleted depuis onglet portraits:",
                err
              );
            });
          return;
        }
      }
    }

    waitForElement(action.selector, (element) => {
      try {
        action.action(element);
        logInfo(`Action terminée : ${action.description}`);
        executeMultipleActions(actions, sendResponse, actionIndex + 1); // Passer à l'action suivante
      } catch (error) {
        logInfo(
          `Erreur lors de l'exécution de l'action : ${action.description}`,
          error
        );
        if (sendResponse) {
          sendResponse({ status: "error", step: action.description });
        }
      }
    });
  }

  // Fonction pour exécuter une étape
  async function executeNextStep(sendResponse) {
    if (isLoadingIndicatorPresent()) {
      logInfo(
        "🔄 Indicateur de chargement détecté avant l'exécution de l'étape suivante, mise en attente"
      );
      await waitForLoadingToComplete();
      executeNextStepInternal(sendResponse);
    } else {
      executeNextStepInternal(sendResponse);
    }
  }

  // Nouvelle fonction contenant la logique d'activation de base
  function activateScriptInternalLogic() {
    logInfo("🚀 Logique interne d'activation...");
    isActive = true;
    currentStepIndex = 0; // Assurer la réinitialisation
    sequenceStartTime = null; // Assurer la réinitialisation
    domFormat = detectDOMFormat();
    if (domFormat === "notFound") {
      logInfo("Format DOM inconnu, vérification des champs...");
      diagnoseDOMIssues();
    }
    logInfo("État interne activé.");
  }

  // Fonction interne pour exécuter l'étape suivante
  function executeNextStepInternal(sendResponse) {
    // Si le script n'est pas actif et que c'est la première étape, activer l'état interne
    if (!isActive && currentStepIndex === 0) {
      logInfo("Activation automatique du script via nextStep pour l'étape 0.");
      activateScriptInternalLogic(); // Active l'état (isActive=true, reset Cpt/Time)
    }

    // Enregistrer l'heure de début lors de la première étape de la séquence active
    if (isActive && currentStepIndex === 0 && sequenceStartTime === null) {
      sequenceStartTime = Date.now();
      logInfo(
        `Début de la séquence à ${new Date(sequenceStartTime).toISOString()}`
      );
      // DEBUG: Confirmer que sequenceStartTime est bien défini
      logInfo(`DEBUG: sequenceStartTime initialisé à: ${sequenceStartTime}`);
    } else if (
      isActive &&
      currentStepIndex === 0 &&
      sequenceStartTime !== null
    ) {
      // DEBUG: Cas où l'étape 0 est ré-exécutée sans réinitialisation?
      logInfo(
        `DEBUG: Avertissement - Étape 0 rencontrée mais sequenceStartTime déjà défini: ${sequenceStartTime}`
      );
    }

    if (currentStepIndex >= steps.length) {
      logInfo("Toutes les étapes d'automatisation ont été exécutées.");
      // DEBUG: Vérifier sequenceStartTime juste avant le calcul final
      logInfo(
        `DEBUG: sequenceStartTime avant calcul final: ${sequenceStartTime}`
      );
      const elapsedTime = sequenceStartTime
        ? Date.now() - sequenceStartTime
        : 0;
      // DEBUG: Vérifier elapsedTime final
      logInfo(
        `DEBUG: elapsedTime final calculé: ${elapsedTime} (Now: ${Date.now()}, Start: ${sequenceStartTime})`
      );
      const delayNeeded = Math.max(0, MIN_SEQUENCE_DURATION - elapsedTime);

      if (delayNeeded > 0) {
        logInfo(
          `Séquence terminée en ${elapsedTime}ms. Ajout d'un délai de ${delayNeeded}ms pour atteindre ${MIN_SEQUENCE_DURATION}ms.`
        );
        // Envoyer le message pour démarrer l'attente finale UNIQUEMENT si un délai est nécessaire
        logInfo("Envoi du statut 'startFinalWait' au popup.");
        browser.runtime
          .sendMessage({ status: "startFinalWait" })
          .catch((err) => {
            console.error(
              "Erreur lors de l'envoi de startFinalWait au runtime:",
              err
            );
          });

        // Démarrer le délai
        setTimeout(() => {
          logInfo(
            `Délai minimum de ${MIN_SEQUENCE_DURATION}ms atteint. Séquence réellement terminée.`
          );
          // Réinitialiser pour une éventuelle prochaine exécution
          currentStepIndex = 0;
          sequenceStartTime = null;
          // Envoyer 'done' APRÈS le délai avec la progression réelle
          const progressPercentage = calculateProgressPercentage();
          logInfo(
            `Envoi du statut 'done' au popup (après délai) avec progression: ${progressPercentage}%.`
          );
          browser.runtime
            .sendMessage({
              status: "done",
              progressPercentage: progressPercentage,
            })
            .catch((err) => {
              console.error(
                "Erreur lors de l'envoi de done au runtime (après délai):",
                err
              );
            });
        }, delayNeeded);
      } else {
        logInfo(
          `Séquence terminée en ${elapsedTime}ms (>= ${MIN_SEQUENCE_DURATION}ms). Pas de délai supplémentaire.`
        );
        // Réinitialiser pour une éventuelle prochaine exécution
        currentStepIndex = 0;
        sequenceStartTime = null;
        // Envoyer 'done' immédiatement si le délai est déjà écoulé avec la progression réelle
        const progressPercentage = calculateProgressPercentage();
        logInfo(
          `Envoi du statut 'done' au popup (immédiat) avec progression: ${progressPercentage}%.`
        );
        browser.runtime
          .sendMessage({
            status: "done",
            progressPercentage: progressPercentage,
          })
          .catch((err) => {
            console.error(
              "Erreur lors de l'envoi de done au runtime (pas de délai):",
              err
            );
          });
      }
      // Important: Ne PAS utiliser sendResponse ici pour 'done' ou 'startFinalWait'
      // car l'appelant (probablement le popup via nextStep) attend peut-être une réponse différente.
      // La communication de l'état final se fait via browser.runtime.sendMessage.
      return; // Important de sortir ici
    }

    const step = steps[currentStepIndex];
    logInfo(`Exécution de l'étape : ${step.name}`);

    if (step.actions) {
      // Étape avec plusieurs actions
      executeMultipleActions(step.actions, sendResponse);
    } else if (step.fallbackSelector) {
      // Étape avec fallback
      waitForElementOrFallback(
        step.selector,
        step.fallbackSelector,
        (element, fallbackElement) => {
          try {
            step.action(element, fallbackElement);
            logInfo(`Étape terminée : ${step.name}`);
            currentStepIndex++;
            // Envoyer l'état mis à jour au popup
            // DEBUG: Vérifier sequenceStartTime avant calcul elapsedTime pour stepCompleted
            logInfo(
              `DEBUG: (fallback) sequenceStartTime avant calcul stepCompleted: ${sequenceStartTime}`
            );
            const elapsedTime = sequenceStartTime
              ? Date.now() - sequenceStartTime
              : 0;
            // DEBUG: Vérifier elapsedTime pour stepCompleted
            logInfo(
              `DEBUG: (fallback) elapsedTime pour stepCompleted: ${elapsedTime}`
            );
            browser.runtime
              .sendMessage({
                status: "stepCompleted",
                nextStepIndex: currentStepIndex,
                elapsedTime: elapsedTime,
              })
              .catch((err) => {
                console.error(
                  "Erreur envoi stepCompleted depuis fallback:",
                  err
                );
              });
          } catch (error) {
            logInfo(
              `Erreur lors de l'exécution de l'étape : ${step.name}`,
              error
            );
            if (sendResponse) {
              sendResponse({ status: "error", step: step.name });
            }
          }
        }
      );
    } else {
      // Étape classique
      waitForElement(step.selector, (element) => {
        try {
          step.action(element);
          logInfo(`Étape terminée : ${step.name}`);
          currentStepIndex++;
          // Envoyer l'état mis à jour au popup
          // DEBUG: Vérifier sequenceStartTime avant calcul elapsedTime pour stepCompleted
          logInfo(
            `DEBUG: (classique) sequenceStartTime avant calcul stepCompleted: ${sequenceStartTime}`
          );
          const elapsedTime = sequenceStartTime
            ? Date.now() - sequenceStartTime
            : 0;
          // DEBUG: Vérifier elapsedTime pour stepCompleted
          logInfo(
            `DEBUG: (classique) elapsedTime pour stepCompleted: ${elapsedTime}`
          );
          browser.runtime
            .sendMessage({
              status: "stepCompleted",
              nextStepIndex: currentStepIndex,
              elapsedTime: elapsedTime,
            })
            .catch((err) => {
              console.error(
                "Erreur envoi stepCompleted depuis étape classique:",
                err
              );
            });
        } catch (error) {
          logInfo(
            `Erreur lors de l'exécution de l'étape : ${step.name}`,
            error
          );
          if (sendResponse) {
            sendResponse({ status: "error", step: step.name });
          }
        }
      });
    }
  }

  // Fonction pour activer le script (appelée par startScript)
  async function activateScript() {
    // if (isActive) { // Supprimer cette vérification
    //   logInfo("Le script est déjà actif.");
    //   return false; // Déjà actif
    // }

    // Toujours appeler la logique interne pour forcer la réinitialisation de l'état
    // à chaque commande startScript.
    logInfo(
      "startScript reçu: Forçage de la réinitialisation et activation..."
    );
    activateScriptInternalLogic();

    logInfo(
      "Script activé/réactivé et prêt à exécuter les vérifications (via startScript)"
    );

    // Vérification immédiate des données
    logInfo("Lancement de la vérification des données...");
    const validationSuccess = await verifyAlphaNumericData(); // Doit être await ici

    if (validationSuccess) {
      logInfo("✅✅✅ DONNÉES VALIDÉES AVEC SUCCÈS (activateScript) ✅✅✅");
      // Si on n'est pas en mode boucle, et que activateScript est appelé (ex: clic icône pour vérif unique),
      // on ne lance pas runAutomatedSteps ici. On se contente de la validation.
      // La popup recevra le résultat de la validation via le sendResponse de la commande startScript.
      // Si loopProcessingActive est true, verifyAlphaNumericData aura déjà appelé runAutomatedSteps.
      // Le sendResponse de startScript est géré dans le listener de message.
    } else {
      logInfo(
        "❌❌❌ ÉCHEC DE LA VALIDATION DES DONNÉES (activateScript) ❌❌❌"
      );
      // Si la validation échoue ici (hors boucle), loopProcessingActive aura déjà été mis à false si besoin.
    }
    return validationSuccess; // Retourner le résultat de la validation
  }

  // Fonction pour désactiver le script
  function deactivateScript() {
    logInfo("🛑 Désactivation du script alphaMatchers...");
    isActive = false;
    currentStepIndex = 0; // Réinitialiser l'index
    sequenceStartTime = null; // Réinitialiser le temps de début
  }

  // Écouter les messages du background script ou popup
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command === "ping") {
      sendResponse({ pong: true, version: "2.1.0" });
      return true;
    } else if (message.command === "testMessaging") {
      sendResponse({
        success: true,
        receivedTimestamp: message.timestamp,
        responseTimestamp: Date.now(),
      });
      return true;
    } else if (
      message.command === "startScript" &&
      message.script === "alphaMatchers"
    ) {
      const result = activateScript();
      sendResponse({ success: true, result });
      return true;
    } else if (
      message.command === "stopScript" &&
      message.script === "alphaMatchers"
    ) {
      deactivateScript();
      sendResponse({ success: true });
      return true;
    } else if (message.command === "checkAlphaNumeric") {
      if (!isControleDeFichePage()) {
        sendResponse({
          success: false,
          result: false,
          error: "Not on 'CONTROLE DE LA FICHE' page",
        });
        return true; // Indique une réponse asynchrone
      }
      verifyAlphaNumericData()
        .then((result) => {
          sendResponse({ success: true, result });
        })
        .catch((err) => {
          logInfo(
            "Erreur lors de verifyAlphaNumericData pour checkAlphaNumeric:",
            err
          );
          sendResponse({ success: false, result: false, error: err.message });
        });
      return true;
    } else if (message.command === "nextStep") {
      logInfo("Commande d'exécution d'étape reçue");
      executeNextStep(sendResponse);
      return true;
    } else if (message.command === "reset") {
      logInfo("Réinitialisation demandée.");
      deactivateScript(); // Désactive et réinitialise
      activateScript(); // Réactive proprement
      sendResponse({ status: "resetComplete" });
    } else if (message.command === "verify") {
      logInfo("Vérification manuelle demandée...");
      performVerification()
        .then((validationResults) => {
          logInfo("Résultats de la vérification manuelle :", validationResults);
          if (validationResults.errors.length > 0) {
            highlightErrorFields(validationResults, validationResults.errors);
            showErrorWindow(validationResults.errors); // Afficher la fenêtre d'erreur même en manuel
            sendResponse({
              status: "error",
              details: validationResults.errors,
            });
          } else {
            // Peut-être mettre l'icône en vert ou afficher un message succès ?
            logInfo("Aucune erreur détectée lors de la vérification manuelle.");
            sendResponse({ status: "verified" });
          }
        })
        .catch((error) => {
          logInfo("Erreur lors de la vérification manuelle :", error);
          sendResponse({
            status: "error",
            details: [error.message || "Erreur inconnue"],
          });
        });
      return true; // Indique une réponse asynchrone
    } else if (message.command === "startLoopProcessing") {
      // Vérifier sur quelle page nous sommes
      const isOnControleFiche = isControleDeFichePage();
      const isOnEcranAccueil = isEcranAccueilPage();

      if (!isOnControleFiche && !isOnEcranAccueil) {
        loopProcessingActive = false;
        browser.storage.local.set({ loopProcessingActive: false });
        sendResponse({
          success: false,
          error: "Not on a recognized page (CONTROLE DE LA FICHE or ECRAN D'ACCUEIL)",
          validationResult: false,
        });
        return true;
      }

      loopProcessingActive = true;
      browser.storage.local
        .set({ loopProcessingActive: true })
        .then(() => {
          // Réinitialiser les états pour une nouvelle session de boucle
          currentStepIndex = 0;
          sequenceStartTime = Date.now();

          // Démarrer le timer pour envoyer des mises à jour de progression
          if (progressUpdateTimer) {
            clearInterval(progressUpdateTimer);
          }
          progressUpdateTimer = setInterval(sendProgressUpdate, 2000); // Envoyer une mise à jour toutes les 2 secondes

          // Lancer le traitement approprié selon la page
          if (isOnEcranAccueil) {
            logInfo("Démarrage du traitement ECRAN D'ACCUEIL");
            retryCountEcranAccueil = 0; // Réinitialiser le compteur de retry
            runEcranAccueilSteps();
            sendResponse({ success: true, validationResult: true, pageType: "ecranAccueil" });
          } else if (isOnControleFiche) {
            logInfo("Démarrage du traitement CONTROLE DE LA FICHE");
            // Lancer la vérification pour la première fiche de la boucle
            verifyAlphaNumericData().then((result) =>
              sendResponse({ success: true, validationResult: result, pageType: "controleFiche" })
            );
          }
        })
        .catch((err) => {
          logInfo("Erreur lors de la sauvegarde de loopProcessingActive:", err);
          sendResponse({ success: false, error: err.message });
        });
      return true; // Indique une réponse asynchrone
    } else if (message.command === "stopLoopProcessing") {
      logInfo("Commande stopLoopProcessing reçue.");
      loopProcessingActive = false;

      // Arrêter le timer de mise à jour de progression
      if (progressUpdateTimer) {
        clearInterval(progressUpdateTimer);
        progressUpdateTimer = null;
      }

      browser.storage.local
        .set({ loopProcessingActive: false })
        .then(() => {
          logInfo("Mode boucle désactivé et sauvegardé.");
          // Optionnel: arrêter toute action en cours si nécessaire
          // Pour l'instant, cela empêchera juste le redémarrage sur la prochaine fiche
          // et l'enchaînement automatique des étapes pour la fiche en cours.
          deactivateScript(); // Peut-être utile pour stopper les étapes en cours
          sendResponse({ success: true });
        })
        .catch((err) => {
          logInfo("Erreur lors de la sauvegarde de loopProcessingActive:", err);
          sendResponse({ success: false, error: err.message });
        });
      return true; // Indique une réponse asynchrone
    }

    // Envoyer une réponse par défaut si aucune condition ne correspond
    // sendResponse({ status: "unknownCommand", received: message });
    // Il vaut mieux ne rien envoyer si la commande n'est pas reconnue pour éviter des erreurs.
    return false; // Indique qu'aucune réponse asynchrone n'est attendue ou que la commande n'est pas gérée.
  });

  // Initialisation lors de l'injection du script
  logInfo("Script alphaMatchers injecté et initialisé.");

  // Lire l'état du mode boucle au démarrage du script
  browser.storage.local
    .get("loopProcessingActive")
    .then(async (data) => {
      // Ajout de async ici
      if (data.loopProcessingActive === true) {
        loopProcessingActive = true;
        logInfo("Mode boucle détecté comme actif à l'initialisation.");

        // Déterminer sur quelle page nous sommes
        const isOnControleFiche = isControleDeFichePage();
        const isOnEcranAccueil = isEcranAccueilPage();

        if (!isOnControleFiche && !isOnEcranAccueil) {
          logInfo(
            "Désactivation du mode boucle car pas sur une page reconnue (ni CONTROLE DE LA FICHE, ni ECRAN D'ACCUEIL)."
          );
          loopProcessingActive = false;
          await browser.storage.local.set({ loopProcessingActive: false });
          // Envoyer un message à la popup pour qu'elle mette à jour son UI si elle est ouverte
          browser.runtime
            .sendMessage({
              command: "loopProcessingStopped",
              reason: "initialization_not_on_recognized_page",
            })
            .catch((e) =>
              console.warn(
                "Erreur envoi message loopProcessingStopped (init):",
                e
              )
            );
          return;
        }

        // Ne pas relancer si une modale d'erreur est déjà présente (indique un arrêt précédent)
        if (!document.getElementById("t41-error-window")) {
          logInfo(
            "Aucune erreur précédente détectée, tentative de relance automatique."
          );
          // Attendre un peu pour s'assurer que la page est stable
          setTimeout(() => {
            // Réinitialiser les états pour la nouvelle page
            currentStepIndex = 0;
            sequenceStartTime = Date.now();
            retryCountEcranAccueil = 0; // Réinitialiser le compteur de retry

            if (isOnEcranAccueil) {
              logInfo("Lancement du traitement de l'ECRAN D'ACCUEIL");
              runEcranAccueilSteps();
            } else if (isOnControleFiche) {
              logInfo("Lancement du traitement de CONTROLE DE LA FICHE");
              verifyAlphaNumericData(); // Pas besoin de then/catch ici, la fonction gère ses erreurs
            }
          }, 1500); // Délai augmenté à 1.5s pour plus de stabilité
        } else {
          logInfo(
            "Une fenêtre d'erreur est présente, la boucle ne sera pas relancée automatiquement. Désactivation du mode boucle."
          );
          loopProcessingActive = false;
          browser.storage.local.set({ loopProcessingActive: false });
        }
      } else {
        loopProcessingActive = false;
      }
    })
    .catch((err) => {
      logInfo(
        "Erreur lors de la lecture de loopProcessingActive depuis le stockage:",
        err
      );
      loopProcessingActive = false; // Assurer un état par défaut sûr
    });

  // Nouvelle fonction pour gérer l'exécution séquentielle et automatique des étapes
  async function runAutomatedSteps() {
    // Attendre la fin de tout chargement avant de commencer l'étape
    await waitForLoadingToComplete();

    if (currentStepIndex >= steps.length) {
      logInfo(
        "Toutes les étapes de la fiche sont terminées (runAutomatedSteps)."
      );
      if (currentProcessOutcome) {
         incrementStat(currentProcessOutcome);
         currentProcessOutcome = null;
      }
      // Informer la popup
      browser.runtime
        .sendMessage({
          command: "actionsComplete",
          finalStepIndex: currentStepIndex - 1,
          allStepsCount: steps.length,
        })
        .catch((e) => console.warn("Erreur envoi message actionsComplete:", e));
      // En mode boucle, la prochaine itération sera déclenchée par le rechargement de la page
      // et la logique d'initialisation du script.
      return;
    }

    const step = steps[currentStepIndex];
    logInfo(
      `Exécution automatique de l'étape ${currentStepIndex}: ${step.name}`
    );

    try {
      if (step.actions) {
        // Gérer plusieurs actions dans une étape
        await executeStepActionsAutomated(step.actions);
      } else if (step.selector) {
        // Gérer une action unique dans une étape
        await executeSingleActionAutomated(step);
      } else {
        logInfo(
          `L'étape ${currentStepIndex} n'a ni action unique ni actions multiples définies.`
        );
        // Passer à l'étape suivante si celle-ci est mal définie
        moveToNextStepAutomated();
        return;
      }

      // Si l'action/les actions de l'étape ont réussi (pas d'erreur levée):
      logInfo(`Étape ${currentStepIndex} terminée avec succès.`);
      // Informer la popup du progrès
      browser.runtime
        .sendMessage({
          command: "stepCompleted",
          stepIndex: currentStepIndex,
          stepName: step.name,
          nextStepIndex: currentStepIndex + 1, // Prochaine étape à venir
          elapsedTime: Date.now() - sequenceStartTime,
        })
        .catch((e) => console.warn("Erreur envoi message stepCompleted:", e));

      moveToNextStepAutomated();
    } catch (error) {
      if (error && error.message && error.message.includes("Erreur RDK détectée")) {
          incrementStat("fingerErrors");
      }
      logInfo(
        `Erreur lors de l'exécution de l'étape ${currentStepIndex} (${step.name}): ${error.message}`,
        error
      );
      // En cas d'erreur à une étape, arrêter la boucle
      if (loopProcessingActive) {
        logInfo(
          "Erreur pendant les étapes automatiques. Désactivation du mode boucle."
        );
        loopProcessingActive = false;
        await browser.storage.local.set({ loopProcessingActive: false });
        browser.runtime
          .sendMessage({
            command: "loopProcessingStopped",
            reason: "error_during_step",
            details: error.message,
          })
          .catch((e) =>
            console.warn(
              "Erreur envoi message loopProcessingStopped (step error):",
              e
            )
          );
      }
      // Afficher l'erreur (peut-être une modale spécifique ou un log important)
      // Pour l'instant, on logue et on arrête la séquence pour cette fiche.
      // La modale d'erreur principale est pour les erreurs de validation alphanumérique.
      // On pourrait envisager une notification d'erreur pour les étapes d'action ici.
      showErrorWindow([`Erreur à l'étape '${step.name}': ${error.message}`]);
    }
  }

  async function moveToNextStepAutomated() {
    // Ajout de async
    currentStepIndex++;
    if (loopProcessingActive) {
      // Continuer seulement si le mode boucle est toujours actif
      // Attendre la fin de tout chargement avant de programmer la prochaine étape
      await waitForLoadingToComplete();
      setTimeout(() => {
        runAutomatedSteps();
      }, 1000); // Conserver le délai de 1s avant la prochaine étape pour un rythme visible
    }
  }

  // Fonction adaptée pour exécuter une action unique et retourner une promesse
  async function executeSingleActionAutomated(stepConfig) {
    return new Promise((resolve, reject) => {
      const actionFn = (element, fallbackElement) => {
        try {
          if (stepConfig.action) {
            stepConfig.action(element, fallbackElement);
            resolve();
          } else {
            element.click(); // Action par défaut si non spécifiée
            resolve();
          }
        } catch (e) {
          reject(e);
        }
      };

      if (stepConfig.fallbackSelector) {
        waitForElementOrFallbackInternal(
          stepConfig.selector,
          stepConfig.fallbackSelector,
          actionFn,
          5000,
          reject
        );
      } else {
        waitForElementInternal(stepConfig.selector, actionFn, 5000, reject);
      }
    });
  }

  // Fonction adaptée pour exécuter plusieurs actions et retourner une promesse
  async function executeStepActionsAutomated(actionsConfig, actionIndex = 0) {
    if (actionIndex >= actionsConfig.length) {
      return Promise.resolve(); // Toutes les actions de l'étape sont terminées
    }

    const currentActionConfig = actionsConfig[actionIndex];
    logInfo(`   Exécution de l'action: ${currentActionConfig.description}`);

    return new Promise((resolve, reject) => {
      const actionFn = (element) => {
        try {
          currentActionConfig.action(element);
          // Passer à l'action suivante de cette étape
          executeStepActionsAutomated(actionsConfig, actionIndex + 1)
            .then(resolve)
            .catch(reject);
        } catch (e) {
          reject(e);
        }
      };
      waitForElementInternal(
        currentActionConfig.selector,
        actionFn,
        5000,
        reject
      );
    });
  }

  // Nouvelle fonction pour gérer l'exécution séquentielle et automatique des étapes de l'écran d'accueil
  async function runEcranAccueilSteps() {
    // Attendre la fin de tout chargement avant de commencer l'étape
    await waitForLoadingToComplete();

    if (currentStepIndex >= stepsEcranAccueil.length) {
      logInfo(
        "Toutes les étapes de l'écran d'accueil sont terminées (runEcranAccueilSteps)."
      );
      // Informer la popup
      browser.runtime
        .sendMessage({
          command: "actionsComplete",
          finalStepIndex: currentStepIndex - 1,
          allStepsCount: stepsEcranAccueil.length,
          pageType: "ecranAccueil",
        })
        .catch((e) => console.warn("Erreur envoi message actionsComplete:", e));
      // En mode boucle, la prochaine itération sera déclenchée par le rechargement de la page
      // et la logique d'initialisation du script.
      return;
    }

    const step = stepsEcranAccueil[currentStepIndex];
    logInfo(
      `[ÉCRAN ACCUEIL] Exécution automatique de l'étape ${currentStepIndex}: ${step.name}`
    );

    try {
      if (step.actions) {
        // Gérer plusieurs actions dans une étape
        await executeStepActionsAutomated(step.actions);
      } else if (step.selector) {
        // Gérer une action unique dans une étape
        await executeSingleActionAutomated(step);
      } else {
        logInfo(
          `L'étape ${currentStepIndex} n'a ni action unique ni actions multiples définies.`
        );
        // Passer à l'étape suivante si celle-ci est mal définie
        moveToNextStepEcranAccueil();
        return;
      }

      // Si l'action/les actions de l'étape ont réussi (pas d'erreur levée):
      logInfo(`[ÉCRAN ACCUEIL] Étape ${currentStepIndex} terminée avec succès.`);
      // Informer la popup du progrès
      browser.runtime
        .sendMessage({
          command: "stepCompleted",
          stepIndex: currentStepIndex,
          stepName: step.name,
          nextStepIndex: currentStepIndex + 1, // Prochaine étape à venir
          elapsedTime: Date.now() - sequenceStartTime,
          pageType: "ecranAccueil",
        })
        .catch((e) => console.warn("Erreur envoi message stepCompleted:", e));

      moveToNextStepEcranAccueil();
    } catch (error) {
      logInfo(
        `Erreur lors de l'exécution de l'étape ${currentStepIndex} (${step.name}): ${error.message}`,
        error
      );
      // En cas d'erreur à une étape, arrêter la boucle
      if (loopProcessingActive) {
        logInfo(
          "Erreur pendant les étapes automatiques de l'écran d'accueil. Désactivation du mode boucle."
        );
        loopProcessingActive = false;
        await browser.storage.local.set({ loopProcessingActive: false });
        browser.runtime
          .sendMessage({
            command: "loopProcessingStopped",
            reason: "error_during_step_ecran_accueil",
            details: error.message,
          })
          .catch((e) =>
            console.warn(
              "Erreur envoi message loopProcessingStopped (step error):",
              e
            )
          );
      }
      // Afficher l'erreur
      showErrorWindow([`Erreur à l'étape '${step.name}': ${error.message}`]);
    }
  }

  async function moveToNextStepEcranAccueil() {
    currentStepIndex++;
    if (loopProcessingActive) {
      // Continuer seulement si le mode boucle est toujours actif
      // Attendre la fin de tout chargement avant de programmer la prochaine étape
      await waitForLoadingToComplete();
      setTimeout(() => {
        runEcranAccueilSteps();
      }, 1000); // Conserver le délai de 1s avant la prochaine étape pour un rythme visible
    }
  }

  // Fonction pour récupérer l'information "Dossier en cours"
  function getDossierProgress() {
    try {
      // Chercher l'élément par ID spécifique
      const dossierInput = document.querySelector(
        "#formValidationCorrection\\:j_idt465"
      );

      let dossierValue = null;

      // Chercher par label si l'ID spécifique ne fonctionne pas
      if (!dossierInput) {
        const labels = Array.from(document.querySelectorAll("label"));
        const dossierLabel = labels.find((label) =>
          label.textContent.trim().includes("Dossier en cours")
        );

        if (dossierLabel) {
          // Trouver l'input suivant l'étiquette
          const inputId = dossierLabel.getAttribute("for");
          if (inputId) {
            dossierValue = document.getElementById(inputId)?.value || null;
          }

          // Si l'attribut "for" n'est pas disponible, essayer de trouver l'input adjacent
          const parentRow = dossierLabel.closest("tr");
          if (parentRow) {
            dossierValue =
              parentRow.querySelector("input[type='text']")?.value || null;
          }
        }
      } else {
        dossierValue = dossierInput.value;
      }

      if (!dossierValue)
        return { current: null, total: null, dossierValue: null };

      // Format attendu: "2/4"
      const parts = dossierValue.split("/");
      if (parts.length !== 2)
        return { current: null, total: null, dossierValue: dossierValue };

      const current = parseInt(parts[0], 10);
      const total = parseInt(parts[1], 10);

      if (isNaN(current) || isNaN(total) || total === 0)
        return { current: null, total: null, dossierValue: dossierValue };

      return { current, total, dossierValue };
    } catch (error) {
      logInfo("Erreur lors de la récupération du dossier en cours:", error);
      return { current: null, total: null, dossierValue: null };
    }
  }

  // Fonction pour envoyer la progression actuelle au popup
  function sendProgressUpdate() {
    try {
      const { current, total, dossierValue } = getDossierProgress();
      const progressPercentage = calculateProgressPercentage(current, total);

      if (progressPercentage !== null) {
        logInfo(
          `Envoi de la mise à jour de progression: ${progressPercentage}% (Dossier: ${dossierValue})`
        );

        // Envoyer au popup
        browser.runtime
          .sendMessage({
            command: "progressUpdate",
            progressPercentage: progressPercentage,
            currentDossier: current,
            totalDossiers: total,
            dossierText: dossierValue,
          })
          .catch((err) => {
            console.error(
              "Erreur lors de l'envoi de la mise à jour de progression:",
              err
            );
          });
      }
    } catch (error) {
      console.error("Erreur dans sendProgressUpdate:", error);
    }
  }

  // Fonction pour calculer le pourcentage de progression à partir de la valeur "Dossier en cours"
  function calculateProgressPercentage(current, total) {
    if (
      current === null ||
      total === null ||
      total === 0 ||
      isNaN(current) ||
      isNaN(total) ||
      typeof current !== "number" ||
      typeof total !== "number"
    ) {
      return null;
    }

    // Calculer le pourcentage et le limiter entre 0 et 100
    const percentage = Math.round((current / total) * 100);
    return Math.max(0, Math.min(100, percentage));
  }

  // Exposer les fonctions pour le script progressBar.js
})(); // Fin de l'IIFE
