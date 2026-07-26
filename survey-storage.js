const SURVEY_STORAGE_KEY = "roomie-survey-responses-v1";
const MOCK_PROFILE_STORAGE_KEY = "roomie.mock-user-profile";
const SESSION_METADATA_FIELDS = {
  name: "name",
  contact: "contact",
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

const OPTIONAL_SURVEY_FIELDS = new Set(["occupation", "session_notes"]);

const PROFILE_ROUTE_BY_MVP = {
  "Tenant MVP 1": "mvp1/?tab=profile",
  "Tenant MVP 2": "mvp2/?tab=profile",
  "Tenant MVP 3": "mvp3/?tab=profile",
  "Host MVP 1": "host/?tab=profile",
  "Host MVP 2": "host2/?tab=profile",
  "Host MVP 3": "host3/?tab=profile",
};

const SURVEY_FIELDS = [
  "response_id",
  "submitted_at",
  "name",
  "contact",
  "bio",
  "participant_id",
  "participant_role_detail",
  "tested_route",
  "participant_role",
  "mvp_route",
  "other_services_ranking",
  "other_services_ranking_ids",
  "occupation",
  "session_notes",
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
  "most_clear",
  "most_confusing",
  "trust_feedback",
  "priority_change",
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

function getSessionMetadata(profile) {
  if (!profile || typeof profile !== "object") return null;

  const participantId = typeof profile.participantId === "string" ? profile.participantId.trim() : "";
  const role = typeof profile.role === "string" ? profile.role.trim() : "";
  const roleDetail = typeof profile.participantRoleDetail === "string"
    ? profile.participantRoleDetail.trim()
    : role;
  const name = typeof profile.name === "string" ? profile.name.trim() : "";
  const contact = typeof profile.contact === "string" ? profile.contact.trim() : "";
  const bio = typeof profile.bio === "string" ? profile.bio.trim() : "";
  const mvpRoute = typeof profile.mvpRoute === "string" ? profile.mvpRoute.trim() : "";
  const testedRoute = mvpRoute;
  const servicePreferences = Array.isArray(profile.servicePreferences)
    ? profile.servicePreferences.filter((item) => typeof item === "string")
    : [];
  const otherServicesRanking = servicePreferences
    .map((serviceId, index) => `${index + 1}. ${SERVICE_LABELS[serviceId] || serviceId}`)
    .join(" | ");
  const otherServicesRankingIds = servicePreferences.join(",");

  if (!participantId && !role && !roleDetail && !mvpRoute && !name && !contact && !bio && !otherServicesRanking) {
    return null;
  }

  return {
    [SESSION_METADATA_FIELDS.name]: name,
    [SESSION_METADATA_FIELDS.contact]: contact,
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
    Object.assign(payload, lockedValues);
  }

  return payload;
}

function getCurrentSessionMetadata() {
  return getSessionMetadata(readMockProfile());
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
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.value = value;
        element.readOnly = true;
        element.dataset.locked = "true";
      } else if (element instanceof HTMLSelectElement) {
        element.value = value;
        element.disabled = true;
        element.dataset.locked = "true";
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
    }
  });
}

function setActiveSurveyTab(activeTab) {
  document.querySelectorAll(".survey-section-tabs .subhead-tab").forEach((tab) => {
    const isActive = tab === activeTab;
    tab.classList.toggle("active", isActive);
    if (isActive) {
      tab.setAttribute("aria-current", "true");
    } else {
      tab.removeAttribute("aria-current");
    }
  });
}

function initSurveySectionTabs() {
  const tabs = Array.from(document.querySelectorAll(".survey-section-tabs .subhead-tab")).filter(
    (tab) => tab instanceof HTMLAnchorElement
  );
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    if (tab.classList.contains("active")) {
      tab.setAttribute("aria-current", "true");
    }
    tab.addEventListener("click", () => setActiveSurveyTab(tab));
  });

  const sections = tabs
    .map((tab) => {
      const sectionId = tab.hash ? tab.hash.slice(1) : "";
      const section = sectionId ? document.getElementById(sectionId) : null;
      return section ? { tab, section } : null;
    })
    .filter(Boolean);

  if (!("IntersectionObserver" in window) || !sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
      if (!visibleEntry) return;

      const activeSection = sections.find(({ section }) => section === visibleEntry.target);
      if (activeSection) {
        setActiveSurveyTab(activeSection.tab);
      }
    },
    {
      root: document.querySelector(".survey-scroll-area"),
      threshold: [0.35, 0.65],
    }
  );

  sections.forEach(({ section }) => observer.observe(section));
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

function renderAdminTable(responses) {
  const countNode = document.querySelector("[data-response-count]");
  const emptyNode = document.querySelector("[data-empty-state]");
  const tableWrap = document.querySelector("[data-response-table-wrap]");
  const tableBody = document.querySelector("[data-response-table-body]");

  if (!countNode || !emptyNode || !tableWrap || !tableBody) return;

  countNode.textContent = `${responses.length} stored response${responses.length === 1 ? "" : "s"}`;
  tableBody.innerHTML = "";

  if (!responses.length) {
    emptyNode.hidden = false;
    tableWrap.hidden = true;
    return;
  }

  emptyNode.hidden = true;
  tableWrap.hidden = false;

  responses
    .slice()
    .reverse()
    .forEach((response) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${response.response_id || ""}</td>
        <td>${response.submitted_at || ""}</td>
        <td>${response.name || ""}</td>
        <td>${response.participant_id || ""}</td>
        <td>${response.participant_role_detail || ""}</td>
        <td>${response.tested_route || ""}</td>
        <td>${response.mvp_route || ""}</td>
        <td>${response.participant_role || ""}</td>
        <td>${response.other_services_ranking || ""}</td>
        <td>${response.recommendation || ""}</td>
      `;
      tableBody.appendChild(row);
    });
}

function initSurveyPage() {
  const saveButton = document.querySelector("[data-save-survey]");
  const statusNode = document.querySelector("[data-save-status]");
  if (!saveButton || !statusNode) return;

  normalizeOptionalFields();
  applyLockedSessionMetadata(readMockProfile());

  saveButton.addEventListener("click", () => {
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

    statusNode.textContent = `Saved locally as ${payload.response_id}. Administrators can export it later as CSV.`;
    statusNode.dataset.state = "success";
  });
}

function initAdminPage() {
  const exportCsvButton = document.querySelector("[data-export-csv]");
  const exportJsonButton = document.querySelector("[data-export-json]");
  const refreshButton = document.querySelector("[data-refresh-responses]");
  if (!exportCsvButton || !exportJsonButton || !refreshButton) return;

  const render = () => renderAdminTable(getResponsesForExport());

  exportCsvButton.addEventListener("click", () => {
    const responses = getResponsesForExport();
    downloadBlob(
      `roomie-survey-responses-${new Date().toISOString().slice(0, 10)}.csv`,
      responsesToCsv(responses),
      "text/csv;charset=utf-8"
    );
  });

  exportJsonButton.addEventListener("click", () => {
    const responses = getResponsesForExport();
    downloadBlob(
      `roomie-survey-responses-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(responses, null, 2),
      "application/json;charset=utf-8"
    );
  });

  refreshButton.addEventListener("click", render);
  render();
}

document.addEventListener("DOMContentLoaded", () => {
  initSurveyBackLinks();
  initSurveySectionTabs();
  initSurveyPage();
  initAdminPage();
});
