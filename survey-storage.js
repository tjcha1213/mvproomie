const SURVEY_STORAGE_KEY = "roomie-survey-responses-v1";
const SURVEY_DRAFT_STORAGE_KEY = "roomie-survey-drafts-v1";
const MOCK_PROFILE_STORAGE_KEY = "roomie.mock-user-profile";
const THEME_STORAGE_KEY = "roomie-primary";
const THEME_COLOR_BY_PREFERENCE = {
  "roomie-teal": "#15BDB6",
  "deep-ocean-blue": "#1D4ED8",
  "warm-mango": "#FFB000",
  "sunset-orange": "#FF5A1F",
};
const SESSION_METADATA_FIELDS = {
  name: "name",
  contact: "contact",
  birthdate: "birthdate",
  bio: "bio",
  participant_id: "participant_id",
  participant_role_detail: "participant_role_detail",
  participant_role: "participant_role",
  tested_route: "tested_route",
  mvp_route: "mvp_route",
  other_services_ranking: "other_services_ranking",
  other_services_ranking_ids: "other_services_ranking_ids",
};

const SERVICE_LABELS = {
  cleaning: "Cleaning",
  moving: "Moving",
  furniture: "Furniture",
  legal: "Legal",
  repairs: "Repairs",
  utilities: "Utilities",
};

const OPTIONAL_SURVEY_FIELDS = new Set(["occupation_other", "session_notes", "brand_notes"]);

const PROFILE_ROUTE_BY_MVP = {
  "Tenant MVP 1": "mvp1/?tab=profile&surveyReturn=profile",
  "Tenant MVP 2": "mvp2/?tab=profile&surveyReturn=profile",
  "Tenant MVP 3": "mvp3/?tab=profile&surveyReturn=profile",
  "Host MVP 1": "host/?tab=profile&surveyReturn=profile",
  "Host MVP 2": "host2/?tab=profile&surveyReturn=profile",
  "Host MVP 3": "host3/?tab=profile&surveyReturn=profile",
};

const SURVEY_FIELDS = [
  "response_id",
  "submitted_at",
  "name",
  "contact",
  "birthdate",
  "bio",
  "participant_id",
  "participant_role_detail",
  "tested_route",
  "participant_role",
  "mvp_route",
  "other_services_ranking",
  "other_services_ranking_ids",
  "occupation",
  "occupation_other",
  "session_notes",
  "priority_rank_1",
  "priority_rank_2",
  "priority_rank_3",
  "recommendation",
  "nps_reason",
  "sus_1",
  "sus_2",
  "sus_3",
  "sus_4",
  "sus_5",
  "sus_6",
  "sus_7",
  "sus_8",
  "sus_9",
  "sus_10",
  "logo_preference",
  "color_theme_preference",
  "color_theme_notes",
  "company_name_preference",
  "domain_name_preference",
  "brand_notes",
  "current_housing_platforms",
  "current_platform_reasons",
  "metro_manila_housing_priorities",
  "location_context_feedback",
  "task_find_contact_listing",
  "task_listing_details_clarity",
  "mvp_best_overall_rank_1",
  "mvp_best_overall_rank_2",
  "mvp_best_overall_rank_3",
  "mvp_best_overall_reason",
  "most_clear",
  "most_confusing",
  "trust_feedback",
  "listing_trust_requirements",
  "listing_distrust_triggers",
  "missing_feature_expectation",
  "parent_student_housing_comfort",
  "priority_change",
  "survey_terms_agreement",
  "nda_agreement",
];

function getStoredResponses() {
  try {
    return JSON.parse(localStorage.getItem(SURVEY_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setStoredResponses(responses) {
  localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(responses));
  window.dispatchEvent(new CustomEvent("roomie-survey-responses-updated"));
}

function getStoredDrafts() {
  try {
    return JSON.parse(localStorage.getItem(SURVEY_DRAFT_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function setStoredDrafts(drafts) {
  localStorage.setItem(SURVEY_DRAFT_STORAGE_KEY, JSON.stringify(drafts));
}

function readMockProfile() {
  try {
    const raw = localStorage.getItem(MOCK_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function getSurveyRouteFromQuery() {
  try {
    const route = new URLSearchParams(window.location.search).get("mvp")?.trim() || "";
    return PROFILE_ROUTE_BY_MVP[route] ? route : "";
  } catch {
    return "";
  }
}

function inferRoleFromMvpRoute(mvpRoute, fallbackRole = "", fallbackRoleDetail = "") {
  if (mvpRoute.startsWith("Tenant MVP")) {
    return { role: "tenant", roleDetail: "Tenant" };
  }
  if (mvpRoute.startsWith("Host MVP")) {
    return { role: "host", roleDetail: "Host" };
  }
  return { role: fallbackRole, roleDetail: fallbackRoleDetail || fallbackRole };
}

function getSessionMetadata(profile) {
  if (!profile || typeof profile !== "object") return null;

  const participantId = typeof profile.participantId === "string" ? profile.participantId.trim() : "";
  const profileRole = typeof profile.role === "string" ? profile.role.trim() : "";
  const profileRoleDetail = typeof profile.participantRoleDetail === "string"
    ? profile.participantRoleDetail.trim()
    : profileRole;
  const name = typeof profile.name === "string" ? profile.name.trim() : "";
  const contact = typeof profile.contact === "string" ? profile.contact.trim() : "";
  const birthdate = typeof profile.birthdate === "string" ? profile.birthdate.trim() : "";
  const bio = typeof profile.bio === "string" ? profile.bio.trim() : "";
  const queryRoute = getSurveyRouteFromQuery();
  const profileRoute = typeof profile.mvpRoute === "string" ? profile.mvpRoute.trim() : "";
  const mvpRoute = queryRoute || profileRoute;
  const testedRoute = mvpRoute;
  const { role, roleDetail } = inferRoleFromMvpRoute(mvpRoute, profileRole, profileRoleDetail);
  const servicePreferences = Array.isArray(profile.servicePreferences)
    ? profile.servicePreferences.filter((item) => typeof item === "string")
    : [];
  const otherServicesRanking = servicePreferences
    .map((serviceId, index) => `${index + 1}. ${SERVICE_LABELS[serviceId] || serviceId}`)
    .join(" | ");
  const otherServicesRankingIds = servicePreferences.join(",");

  if (!participantId && !role && !roleDetail && !mvpRoute && !name && !contact && !birthdate && !bio && !otherServicesRanking) {
    return null;
  }

  return {
    [SESSION_METADATA_FIELDS.name]: name,
    [SESSION_METADATA_FIELDS.contact]: contact,
    [SESSION_METADATA_FIELDS.birthdate]: birthdate,
    [SESSION_METADATA_FIELDS.bio]: bio,
    [SESSION_METADATA_FIELDS.participant_id]: participantId,
    [SESSION_METADATA_FIELDS.participant_role_detail]: roleDetail,
    [SESSION_METADATA_FIELDS.participant_role]: role,
    [SESSION_METADATA_FIELDS.tested_route]: testedRoute,
    [SESSION_METADATA_FIELDS.mvp_route]: mvpRoute,
    [SESSION_METADATA_FIELDS.other_services_ranking]: otherServicesRanking,
    [SESSION_METADATA_FIELDS.other_services_ranking_ids]: otherServicesRankingIds,
  };
}

function buildSurveyPayload(root = document, lockedValues = null) {
  const payload = {
    response_id: `resp-${Date.now()}`,
    submitted_at: new Date().toISOString(),
  };

  for (const field of SURVEY_FIELDS) {
    if (field in payload) continue;

    const elements = root.querySelectorAll(`[name="${field}"]`);
    if (!elements.length) {
      payload[field] = "";
      continue;
    }

    const first = elements[0];
    if (first instanceof HTMLInputElement && first.type === "radio") {
      const checked = root.querySelector(`[name="${field}"]:checked`);
      payload[field] = checked instanceof HTMLInputElement ? checked.value : "";
      continue;
    }

    if (first instanceof HTMLInputElement && first.type === "checkbox") {
      const checked = root.querySelector(`[name="${field}"]:checked`);
      payload[field] = checked instanceof HTMLInputElement ? checked.value || "checked" : "";
      continue;
    }

    if (
      first instanceof HTMLInputElement ||
      first instanceof HTMLTextAreaElement ||
      first instanceof HTMLSelectElement
    ) {
      payload[field] = first.value.trim();
      continue;
    }

    payload[field] = "";
  }

  if (lockedValues) {
    for (const [fieldName, value] of Object.entries(lockedValues)) {
      const isEditableMetadata =
        fieldName === SESSION_METADATA_FIELDS.other_services_ranking ||
        fieldName === SESSION_METADATA_FIELDS.other_services_ranking_ids;
      if (isEditableMetadata && payload[fieldName]) continue;
      payload[fieldName] = value;
    }
  }

  return payload;
}

function getCurrentSessionMetadata() {
  return getSessionMetadata(readMockProfile());
}

function writeServicePreferencesToProfile(servicePreferences) {
  const profile = readMockProfile();
  if (!profile || typeof profile !== "object") return;

  const nextProfile = {
    ...profile,
    servicePreferences,
  };

  try {
    localStorage.setItem(MOCK_PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
    window.dispatchEvent(new CustomEvent("roomie-profile-updated", { detail: nextProfile }));
  } catch {}
}

function getSurveyDraftKey() {
  const params = new URLSearchParams(window.location.search);
  const queryRoute = params.get("mvp")?.trim() || "";
  const profile = readMockProfile();
  const participantId = typeof profile?.participantId === "string" ? profile.participantId.trim() : "anonymous";
  const route = queryRoute || (typeof profile?.mvpRoute === "string" ? profile.mvpRoute.trim() : window.location.pathname);
  return `${window.location.pathname}::${route}::${participantId}`;
}

function saveSurveyDraft() {
  const draft = buildSurveyPayload(document, getCurrentSessionMetadata());
  draft.saved_at = new Date().toISOString();
  const drafts = getStoredDrafts();
  drafts[getSurveyDraftKey()] = draft;
  setStoredDrafts(drafts);
}

function clearSurveyDraft() {
  const drafts = getStoredDrafts();
  delete drafts[getSurveyDraftKey()];
  setStoredDrafts(drafts);
}

function restoreSurveyDraft() {
  const draft = getStoredDrafts()[getSurveyDraftKey()];
  if (!draft || typeof draft !== "object") return;

  for (const field of SURVEY_FIELDS) {
    if (
      field === SESSION_METADATA_FIELDS.other_services_ranking ||
      field === SESSION_METADATA_FIELDS.other_services_ranking_ids
    ) {
      continue;
    }

    const value = typeof draft[field] === "string" ? draft[field] : "";
    if (!value) continue;

    const elements = document.querySelectorAll(`[name="${field}"]`);
    elements.forEach((element) => {
      if (element.dataset.locked === "true") return;

      if (element instanceof HTMLInputElement && element.type === "radio") {
        element.checked = element.value === value;
      } else if (element instanceof HTMLInputElement && element.type === "checkbox") {
        element.checked = value === element.value || value === "true" || value === "on";
      } else if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement
      ) {
        element.value = value;
      }
    });
  }
}

function mergeMissingSessionMetadata(response, metadata) {
  if (!metadata) return response;

  const nextResponse = { ...response };
  for (const fieldName of Object.values(SESSION_METADATA_FIELDS)) {
    if (!nextResponse[fieldName] && metadata[fieldName]) {
      nextResponse[fieldName] = metadata[fieldName];
    }
  }

  return nextResponse;
}

function getResponsesForExport() {
  const metadata = getCurrentSessionMetadata();
  return getStoredResponses().map((response) => mergeMissingSessionMetadata(response, metadata));
}

function getProfileBackHref() {
  const params = new URLSearchParams(window.location.search);
  const queryRoute = params.get("mvp")?.trim() || "";
  if (PROFILE_ROUTE_BY_MVP[queryRoute]) {
    return PROFILE_ROUTE_BY_MVP[queryRoute];
  }

  const profile = readMockProfile();
  const mvpRoute = typeof profile?.mvpRoute === "string" ? profile.mvpRoute.trim() : "";
  return PROFILE_ROUTE_BY_MVP[mvpRoute] || "index.html";
}

function validateSurveyPayload(payload) {
  const missing = [];
  if (!payload.name) missing.push("name");
  if (!payload.participant_id) missing.push("participant ID");
  if (!payload.tested_route) missing.push("tested route");
  if (!payload.recommendation) missing.push("recommendation score");
  return missing;
}

function applyLockedSessionMetadata(profile) {
  const lockedValues = getSessionMetadata(profile);
  if (!lockedValues) return null;

  for (const [fieldName, value] of Object.entries(lockedValues)) {
    const elements = document.querySelectorAll(`[name="${fieldName}"]`);
    elements.forEach((element) => {
      const shouldAlwaysLock = fieldName === SESSION_METADATA_FIELDS.birthdate;
      const shouldStayEditable =
        fieldName === SESSION_METADATA_FIELDS.other_services_ranking ||
        fieldName === SESSION_METADATA_FIELDS.other_services_ranking_ids;

      if (!value) {
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
          element.readOnly = shouldAlwaysLock;
          if (shouldAlwaysLock) element.dataset.locked = "true";
          else delete element.dataset.locked;
        } else if (element instanceof HTMLSelectElement) {
          element.disabled = shouldAlwaysLock;
          if (shouldAlwaysLock) element.dataset.locked = "true";
          else delete element.dataset.locked;
        }
        return;
      }

      if (shouldStayEditable) {
        if (
          element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement ||
          element instanceof HTMLSelectElement
        ) {
          if (!element.value.trim()) {
            element.value = value;
            element.dispatchEvent(new Event("input", { bubbles: true }));
            element.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }
        return;
      }

      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.value = value;
        element.readOnly = true;
        element.dataset.locked = "true";
        element.dispatchEvent(new Event("input", { bubbles: true }));
      } else if (element instanceof HTMLSelectElement) {
        element.value = value;
        element.disabled = true;
        element.dataset.locked = "true";
        element.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }

  return lockedValues;
}

function normalizeOptionalFields() {
  OPTIONAL_SURVEY_FIELDS.forEach((fieldName) => {
    document.querySelectorAll(`[name="${fieldName}"]`).forEach((element) => {
      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement
      ) {
        element.required = false;
      }
    });
  });
}

function initSurveyBackLinks() {
  const href = getProfileBackHref();
  document.querySelectorAll("[data-survey-back]").forEach((element) => {
    if (element instanceof HTMLAnchorElement) {
      element.href = href;
      element.addEventListener("click", () => {
        saveSurveyDraft();
      });
    }
  });
}

function getFieldLabel(element) {
  const field = element.closest(".survey-field");
  const fieldLabel = field?.querySelector("span")?.textContent?.trim();
  if (fieldLabel) return fieldLabel;

  const card = element.closest(".survey-card");
  const cardLabel = card?.querySelector("legend")?.textContent?.trim();
  return cardLabel || element.name || "required field";
}

function setFieldMissing(element, missing) {
  const container = element.closest(".survey-field, .survey-card");
  if (container instanceof HTMLElement) {
    container.classList.toggle("survey-required-missing", missing);
  }
}

function isOptionalSurveyElement(element) {
  const name = element.name;
  if (!OPTIONAL_SURVEY_FIELDS.has(name)) return false;

  if (name === "occupation_other") {
    const occupation = document.querySelector('[name="occupation"]');
    return !(occupation instanceof HTMLSelectElement && occupation.value === "other");
  }

  return true;
}

function isIncompleteOtherServicesRanking(element) {
  if (element.name !== SESSION_METADATA_FIELDS.other_services_ranking_ids) return false;

  const rankingCard = element.closest("[data-services-ranking]") || element.closest(".services-ranking-card");
  const cardRoot = rankingCard instanceof HTMLElement ? rankingCard : element.closest(".survey-card");
  const serviceCards = Array.from(cardRoot?.querySelectorAll("[data-service-id]") || []).filter(
    (card) => card instanceof HTMLButtonElement
  );
  const rankedIds = String(element.value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return serviceCards.length > 0 && rankedIds.length < serviceCards.length;
}

function validateSurveyStep(step, pages, { mark = false } = {}) {
  const sections = pages.filter((page) => Number(page.dataset.surveyPage) === step);
  const missing = [];
  const seenRadioGroups = new Set();

  sections.forEach((section) => {
    const elements = Array.from(section.querySelectorAll("input[name], select[name], textarea[name]")).filter(
      (element) =>
        (element instanceof HTMLInputElement ||
          element instanceof HTMLSelectElement ||
          element instanceof HTMLTextAreaElement) &&
        !element.disabled
    );

    elements.forEach((element) => {
      if (element.dataset.locked === "true" && !element.value.trim()) {
        if (mark) setFieldMissing(element, false);
        return;
      }

      if (isOptionalSurveyElement(element)) {
        if (mark) setFieldMissing(element, false);
        return;
      }

      let isMissing = false;

      if (isIncompleteOtherServicesRanking(element)) {
        isMissing = true;
      } else if (element instanceof HTMLInputElement && element.type === "radio") {
        if (seenRadioGroups.has(element.name)) return;
        seenRadioGroups.add(element.name);
        const checked = section.querySelector(`[name="${element.name}"]:checked`);
        isMissing = !(checked instanceof HTMLInputElement);
      } else if (element instanceof HTMLInputElement && element.type === "checkbox") {
        isMissing = !element.checked;
      } else {
        isMissing = !element.value.trim();
      }

      if (mark) setFieldMissing(element, isMissing);
      if (isMissing) missing.push(getFieldLabel(element));
    });
  });

  return {
    valid: missing.length === 0,
    missing,
  };
}

function initSurveySectionTabs() {
  const tabs = Array.from(document.querySelectorAll(".survey-section-tabs .subhead-tab")).filter(
    (tab) => tab instanceof HTMLAnchorElement
  );
  const pages = Array.from(document.querySelectorAll("[data-survey-page]")).filter(
    (section) => section instanceof HTMLElement
  );
  const prevButton = document.querySelector("[data-survey-prev]");
  const nextButton = document.querySelector("[data-survey-next]");
  const stepLabel = document.querySelector("[data-survey-step-label]");
  const scrollArea = document.querySelector(".survey-scroll-area");
  const maxStep = tabs.length - 1;
  let activeStep = 0;

  if (!tabs.length || !pages.length) return;

  const setStep = (nextStep) => {
    activeStep = Math.max(0, Math.min(maxStep, nextStep));

    tabs.forEach((tab, index) => {
      const isActive = index === activeStep;
      tab.classList.toggle("active", isActive);
      if (isActive) tab.setAttribute("aria-current", "true");
      else tab.removeAttribute("aria-current");
    });

    pages.forEach((page) => {
      page.hidden = Number(page.dataset.surveyPage) !== activeStep;
    });

    if (prevButton instanceof HTMLButtonElement) {
      prevButton.disabled = activeStep === 0;
    }
    if (nextButton instanceof HTMLButtonElement) {
      nextButton.disabled = activeStep === maxStep;
    }
    if (stepLabel) {
      stepLabel.textContent = `Page ${activeStep + 1} of ${maxStep + 1}`;
    }
    if (scrollArea) {
      scrollArea.scrollTo({ top: 0, behavior: "smooth" });
    }

    updateNavState();
  };

  const canMoveToStep = (targetStep, { mark = false } = {}) => {
    if (targetStep <= activeStep) return true;
    for (let step = activeStep; step < targetStep; step += 1) {
      const result = validateSurveyStep(step, pages, { mark });
      if (!result.valid) {
        if (mark && stepLabel) {
          stepLabel.textContent = "Complete required fields first";
          stepLabel.dataset.state = "error";
        }
        return false;
      }
    }
    return true;
  };

  function updateNavState() {
    const currentStepValid = activeStep === maxStep || validateSurveyStep(activeStep, pages).valid;
    const currentSections = pages.filter((page) => Number(page.dataset.surveyPage) === activeStep);
    const hasMarkedMissingField = currentSections.some((section) =>
      section.querySelector(".survey-required-missing")
    );

    if (hasMarkedMissingField) {
      validateSurveyStep(activeStep, pages, { mark: true });
    }

    if (nextButton instanceof HTMLButtonElement) {
      nextButton.disabled = activeStep === maxStep || !currentStepValid;
    }
    if (stepLabel && stepLabel.dataset.state === "error" && currentStepValid) {
      stepLabel.dataset.state = "idle";
      stepLabel.textContent = `Page ${activeStep + 1} of ${maxStep + 1}`;
    }

    tabs.forEach((tab, index) => {
      const unavailable = index > activeStep && !canMoveToStep(index);
      tab.classList.toggle("disabled", unavailable);
      tab.setAttribute("aria-disabled", unavailable ? "true" : "false");
    });
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", (event) => {
      event.preventDefault();
      if (!canMoveToStep(index, { mark: true })) return;
      setStep(index);
    });
  });

  if (prevButton instanceof HTMLButtonElement) {
    prevButton.addEventListener("click", () => setStep(activeStep - 1));
  }
  if (nextButton instanceof HTMLButtonElement) {
    nextButton.addEventListener("click", () => {
      if (!canMoveToStep(activeStep + 1, { mark: true })) return;
      setStep(activeStep + 1);
    });
  }

  document.addEventListener("input", updateNavState);
  document.addEventListener("change", updateNavState);

  setStep(0);
}

function applySurveyThemeColor(color) {
  if (!/^#[0-9a-f]{6}$/i.test(color || "")) return;
  document.documentElement.style.setProperty("--primary", color);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, color);
  } catch {}
}

function initSurveyThemePreference() {
  const inputs = Array.from(document.querySelectorAll('[name="color_theme_preference"]')).filter(
    (input) => input instanceof HTMLInputElement && input.type === "radio"
  );
  if (!inputs.length) return;

  let storedColor = "";
  try {
    storedColor = localStorage.getItem(THEME_STORAGE_KEY) || "";
  } catch {}

  const storedPreference = Object.entries(THEME_COLOR_BY_PREFERENCE).find(
    ([, color]) => color.toLowerCase() === storedColor.toLowerCase()
  )?.[0];

  if (storedPreference) {
    inputs.forEach((input) => {
      input.checked = input.value === storedPreference;
    });
  }

  inputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) {
        applySurveyThemeColor(THEME_COLOR_BY_PREFERENCE[input.value]);
      }
    });
  });
}

function initPriorityRanking() {
  document.querySelectorAll("[data-priority-ranking]").forEach((rankingRoot) => {
    if (!(rankingRoot instanceof HTMLElement)) return;

    const cards = Array.from(rankingRoot.querySelectorAll("[data-priority-id]")).filter(
      (card) => card instanceof HTMLButtonElement
    );
    const fieldRoot = rankingRoot.closest(".survey-card") || document;
    const hiddenFields = [1, 2, 3].map((rank) => {
      const field = fieldRoot.querySelector(`[data-priority-rank="${rank}"]`);
      return field instanceof HTMLInputElement ? field : null;
    });
    let ranked = hiddenFields
      .map((field) => field?.value || "")
      .filter((value) => value && cards.some((card) => card.dataset.priorityId === value));

    const render = () => {
      hiddenFields.forEach((field, index) => {
        if (field) {
          field.value = ranked[index] || "";
          field.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });

      cards.forEach((card) => {
        const rankIndex = ranked.indexOf(card.dataset.priorityId || "");
        const selected = rankIndex >= 0;
        card.classList.toggle("active", selected);
        card.setAttribute("aria-pressed", selected ? "true" : "false");
        const badge = card.querySelector("[data-rank-badge]");
        if (badge) badge.textContent = selected ? String(rankIndex + 1) : "•";
      });
    };

    cards.forEach((card) => {
      card.addEventListener("click", () => {
        const priorityId = card.dataset.priorityId || "";
        if (!priorityId) return;

        ranked = ranked.includes(priorityId)
          ? ranked.filter((value) => value !== priorityId)
          : [...ranked, priorityId].slice(0, 3);
        render();
      });
    });

    render();
  });
}

function initMvpRanking() {
  document.querySelectorAll("[data-mvp-ranking]").forEach((rankingRoot) => {
    if (!(rankingRoot instanceof HTMLElement)) return;

    const cards = Array.from(rankingRoot.querySelectorAll("[data-mvp-id]")).filter(
      (card) => card instanceof HTMLButtonElement
    );
    const fieldRoot = rankingRoot.closest(".survey-card") || document;
    const hiddenFields = [1, 2, 3].map((rank) => {
      const field = fieldRoot.querySelector(`[data-mvp-rank="${rank}"]`);
      return field instanceof HTMLInputElement ? field : null;
    });
    let ranked = hiddenFields
      .map((field) => field?.value || "")
      .filter((value) => value && cards.some((card) => card.dataset.mvpId === value));

    const render = () => {
      hiddenFields.forEach((field, index) => {
        if (field) {
          field.value = ranked[index] || "";
          field.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });

      cards.forEach((card) => {
        const rankIndex = ranked.indexOf(card.dataset.mvpId || "");
        const selected = rankIndex >= 0;
        card.classList.toggle("active", selected);
        card.setAttribute("aria-pressed", selected ? "true" : "false");
        const badge = card.querySelector("[data-rank-badge]");
        if (badge) badge.textContent = selected ? String(rankIndex + 1) : "•";
      });
    };

    cards.forEach((card) => {
      card.addEventListener("click", () => {
        const mvpId = card.dataset.mvpId || "";
        if (!mvpId) return;

        ranked = ranked.includes(mvpId)
          ? ranked.filter((value) => value !== mvpId)
          : [...ranked, mvpId].slice(0, 3);
        render();
      });
    });

    render();
  });
}

function formatServiceRanking(serviceIds) {
  return serviceIds
    .map((serviceId, index) => `${index + 1}. ${SERVICE_LABELS[serviceId] || serviceId}`)
    .join(" | ");
}

function parseServiceRankingIds(value, cards) {
  const knownIds = new Set(cards.map((card) => card.dataset.serviceId || "").filter(Boolean));
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item && knownIds.has(item));
}

function initOtherServicesRanking() {
  document.querySelectorAll("[data-services-ranking]").forEach((rankingRoot) => {
    if (!(rankingRoot instanceof HTMLElement)) return;

    const cards = Array.from(rankingRoot.querySelectorAll("[data-service-id]")).filter(
      (card) => card instanceof HTMLButtonElement
    );
    const fieldRoot = rankingRoot.closest(".survey-card") || document;
    const rankingField = fieldRoot.querySelector('[name="other_services_ranking"]');
    const idsField = fieldRoot.querySelector('[name="other_services_ranking_ids"]');

    if (!(rankingField instanceof HTMLInputElement || rankingField instanceof HTMLTextAreaElement)) return;
    if (!(idsField instanceof HTMLInputElement || idsField instanceof HTMLTextAreaElement)) return;

    const readProfileServicePreferences = () => {
      const profile = readMockProfile();
      return Array.isArray(profile?.servicePreferences)
        ? profile.servicePreferences.filter((item) => typeof item === "string")
        : [];
    };

    let ranked = parseServiceRankingIds(idsField.value, cards);
    if (!ranked.length) {
      ranked = readProfileServicePreferences().filter((serviceId) =>
        cards.some((card) => card.dataset.serviceId === serviceId)
      );
    }

    const syncFields = ({ writeProfile = false } = {}) => {
      rankingField.value = formatServiceRanking(ranked);
      idsField.value = ranked.join(",");
      rankingField.dispatchEvent(new Event("input", { bubbles: true }));
      idsField.dispatchEvent(new Event("input", { bubbles: true }));
      if (writeProfile) {
        writeServicePreferencesToProfile(ranked);
      }
    };

    const render = (options) => {
      syncFields(options);

      cards.forEach((card) => {
        const rankIndex = ranked.indexOf(card.dataset.serviceId || "");
        const selected = rankIndex >= 0;
        card.classList.toggle("active", selected);
        card.setAttribute("aria-pressed", selected ? "true" : "false");
        const badge = card.querySelector("[data-rank-badge]");
        if (badge) badge.textContent = selected ? String(rankIndex + 1) : "•";
      });
    };

    cards.forEach((card) => {
      card.addEventListener("click", () => {
        const serviceId = card.dataset.serviceId || "";
        if (!serviceId) return;

        ranked = ranked.includes(serviceId)
          ? ranked.filter((value) => value !== serviceId)
          : [...ranked, serviceId];
        render({ writeProfile: true });
      });
    });

    window.addEventListener("storage", (event) => {
      if (event.key !== MOCK_PROFILE_STORAGE_KEY) return;
      const nextRanked = readProfileServicePreferences().filter((serviceId) =>
        cards.some((card) => card.dataset.serviceId === serviceId)
      );
      ranked = nextRanked;
      render();
    });

    render();
  });
}

function escapeCsvValue(value) {
  const stringValue = String(value ?? "");
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function responsesToCsv(responses) {
  const header = SURVEY_FIELDS.map(escapeCsvValue).join(",");
  const rows = responses.map((response) =>
    SURVEY_FIELDS.map((field) => escapeCsvValue(response[field] ?? "")).join(",")
  );
  return [header, ...rows].join("\n");
}

function responsesToTableJson(responses) {
  return {
    columns: SURVEY_FIELDS,
    rows: responses.map((response) => SURVEY_FIELDS.map((field) => response[field] ?? "")),
    records: responses.map((response) =>
      SURVEY_FIELDS.reduce((record, field) => {
        record[field] = response[field] ?? "";
        return record;
      }, {})
    ),
  };
}

function downloadBlob(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderAdminTable(responses, selectedResponseIds = new Set()) {
  const countNode = document.querySelector("[data-response-count]");
  const emptyNode = document.querySelector("[data-empty-state]");
  const tableWrap = document.querySelector("[data-response-table-wrap]");
  const tableBody = document.querySelector("[data-response-table-body]");
  const selectAllButton = document.querySelector("[data-toggle-select-all]");

  if (!countNode || !emptyNode || !tableWrap || !tableBody) return;

  const selectedCount = responses.filter((response) => selectedResponseIds.has(response.response_id)).length;
  countNode.textContent = `${responses.length} stored response${responses.length === 1 ? "" : "s"}${selectedCount ? `, ${selectedCount} selected` : ""}`;
  tableBody.innerHTML = "";
  if (selectAllButton instanceof HTMLButtonElement) {
    selectAllButton.textContent = responses.length > 0 && selectedCount === responses.length ? "Deselect all" : "Select all";
  }

  if (!responses.length) {
    emptyNode.hidden = false;
    tableWrap.hidden = true;
    return;
  }

  emptyNode.hidden = true;
  tableWrap.hidden = false;

  const formatMvpId = (value) => {
    if (value === "mvp_1") return "MVP 1";
    if (value === "mvp_2") return "MVP 2";
    if (value === "mvp_3") return "MVP 3";
    return value || "";
  };
  const formatMvpRanking = (response) =>
    [
      response.mvp_best_overall_rank_1,
      response.mvp_best_overall_rank_2,
      response.mvp_best_overall_rank_3,
    ]
      .map((value, index) => (value ? `${index + 1}. ${formatMvpId(value)}` : ""))
      .filter(Boolean)
      .join(" | ");

  responses
    .slice()
    .reverse()
    .forEach((response) => {
      const responseId = response.response_id || "";
      const row = document.createElement("tr");
      row.classList.toggle("selected", selectedResponseIds.has(responseId));
      row.innerHTML = `
        <td>
          <label class="response-select">
            <input type="checkbox" data-response-select value="${escapeHtml(responseId)}" ${selectedResponseIds.has(responseId) ? "checked" : ""} />
            <span>Select session</span>
          </label>
        </td>
        <td>${escapeHtml(response.response_id)}</td>
        <td>${escapeHtml(response.submitted_at)}</td>
        <td>${escapeHtml(response.name)}</td>
        <td>${escapeHtml(response.birthdate)}</td>
        <td>${escapeHtml(response.participant_id)}</td>
        <td>${escapeHtml(response.participant_role_detail)}</td>
        <td>${escapeHtml(response.tested_route)}</td>
        <td>${escapeHtml(response.mvp_route)}</td>
        <td>${escapeHtml(response.participant_role)}</td>
        <td>${escapeHtml(response.other_services_ranking)}</td>
        <td>${escapeHtml(formatMvpRanking(response))}</td>
        <td>${escapeHtml(response.mvp_best_overall_reason)}</td>
        <td>${escapeHtml(response.recommendation)}</td>
      `;
      tableBody.appendChild(row);
    });
}

function initSurveyPage() {
  const saveButton = document.querySelector("[data-save-survey]");
  const statusNode = document.querySelector("[data-save-status]");
  const agreement = document.querySelector("[data-survey-agree]");
  const ndaAgreement = document.querySelector('[name="nda_agreement"]');
  if (!saveButton || !statusNode) return;

  normalizeOptionalFields();
  applyLockedSessionMetadata(readMockProfile());
  restoreSurveyDraft();

  saveButton.addEventListener("click", () => {
    if (agreement instanceof HTMLInputElement && !agreement.checked) {
      statusNode.textContent = "Please agree to the user testing survey terms before saving.";
      statusNode.dataset.state = "error";
      return;
    }
    if (ndaAgreement instanceof HTMLInputElement && !ndaAgreement.checked) {
      statusNode.textContent = "Please agree to the NDA clause before saving.";
      statusNode.dataset.state = "error";
      return;
    }

    const currentMetadata = getCurrentSessionMetadata();
    applyLockedSessionMetadata(readMockProfile());
    const payload = buildSurveyPayload(document, currentMetadata);
    const missing = validateSurveyPayload(payload);

    if (missing.length) {
      statusNode.textContent = `Please complete: ${missing.join(", ")}.`;
      statusNode.dataset.state = "error";
      return;
    }

    const responses = getStoredResponses();
    responses.push(payload);
    setStoredResponses(responses);
    clearSurveyDraft();

    statusNode.textContent = "Thank you. Your response has been saved.";
    statusNode.dataset.state = "success";
  });
}

function initSurveyDraftAutosave() {
  const autosave = () => {
    saveSurveyDraft();
  };

  document.addEventListener("input", autosave);
  document.addEventListener("change", autosave);
}

function initAdminPage() {
  const exportCsvButton = document.querySelector("[data-export-csv]");
  const exportJsonButton = document.querySelector("[data-export-json]");
  const selectAllButton = document.querySelector("[data-toggle-select-all]");
  const clearButton = document.querySelector("[data-clear-responses]");
  const statusNode = document.querySelector("[data-admin-status]");
  const tableBody = document.querySelector("[data-response-table-body]");
  if (!exportCsvButton || !exportJsonButton) return;

  const selectedResponseIds = new Set();
  const getSelectedResponses = () =>
    getResponsesForExport().filter((response) => selectedResponseIds.has(response.response_id));
  const render = () => {
    const responses = getResponsesForExport();
    const currentIds = new Set(responses.map((response) => response.response_id));
    Array.from(selectedResponseIds).forEach((responseId) => {
      if (!currentIds.has(responseId)) selectedResponseIds.delete(responseId);
    });
    renderAdminTable(responses, selectedResponseIds);
  };
  const exportCsv = (responses) => {
    downloadBlob(
      `roomie-survey-responses-${new Date().toISOString().slice(0, 10)}.csv`,
      responsesToCsv(responses),
      "text/csv;charset=utf-8"
    );
  };
  const exportJson = (responses) => {
    downloadBlob(
      `roomie-survey-responses-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(responsesToTableJson(responses), null, 2),
      "application/json;charset=utf-8"
    );
  };

  exportCsvButton.addEventListener("click", () => {
    exportCsv(getResponsesForExport());
  });

  exportJsonButton.addEventListener("click", () => {
    exportJson(getResponsesForExport());
  });

  if (selectAllButton instanceof HTMLButtonElement) {
    selectAllButton.addEventListener("click", () => {
      const responses = getResponsesForExport();
      const allSelected = responses.length > 0 && responses.every((response) => selectedResponseIds.has(response.response_id));
      selectedResponseIds.clear();
      if (!allSelected) {
        responses.forEach((response) => {
          if (response.response_id) selectedResponseIds.add(response.response_id);
        });
      }
      if (statusNode) {
        statusNode.textContent = allSelected ? "All sessions deselected." : "All sessions selected.";
        statusNode.dataset.state = "idle";
      }
      render();
    });
  }

  if (tableBody instanceof HTMLElement) {
    tableBody.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.dataset.responseSelect === undefined) return;
      if (target.checked) selectedResponseIds.add(target.value);
      else selectedResponseIds.delete(target.value);
      render();
    });
  }

  if (clearButton instanceof HTMLButtonElement) {
    clearButton.addEventListener("click", () => {
      const responses = getSelectedResponses();
      if (!responses.length) {
        if (statusNode) {
          statusNode.textContent = "Select at least one log session before clearing.";
          statusNode.dataset.state = "error";
        }
        return;
      }

      const confirmed = window.confirm(
        `Are you sure you want to clear ${responses.length} selected log session${responses.length === 1 ? "" : "s"}? CSV and JSON backups for the selected sessions will download before they are cleared.`
      );
      if (!confirmed) return;

      exportCsv(responses);
      exportJson(responses);
      const selectedIds = new Set(responses.map((response) => response.response_id));
      const remainingResponses = getStoredResponses().filter((response) => !selectedIds.has(response.response_id));
      setStoredResponses(remainingResponses);
      selectedResponseIds.clear();

      if (statusNode) {
        statusNode.textContent = "Backups downloaded. Selected survey log sessions cleared.";
        statusNode.dataset.state = "success";
      }
      render();
    });
  }

  window.addEventListener("storage", (event) => {
    if (event.key === SURVEY_STORAGE_KEY) render();
  });
  window.addEventListener("roomie-survey-responses-updated", render);

  render();
}

document.addEventListener("DOMContentLoaded", () => {
  initSurveyBackLinks();
  initSurveyThemePreference();
  initSurveyPage();
  initPriorityRanking();
  initMvpRanking();
  initOtherServicesRanking();
  initSurveySectionTabs();
  initSurveyDraftAutosave();
  initAdminPage();
});
