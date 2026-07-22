const SURVEY_STORAGE_KEY = "roomie-survey-responses-v1";
const MOCK_PROFILE_STORAGE_KEY = "roomie.mock-user-profile";
const SESSION_METADATA_FIELDS = {
  name: "name",
  contact: "contact",
  bio: "bio",
  participant_id: "participant_id",
  participant_role: "participant_role",
};

const SURVEY_FIELDS = [
  "response_id",
  "submitted_at",
  "name",
  "contact",
  "bio",
  "participant_id",
  "tested_route",
  "participant_role",
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
  const name = typeof profile.name === "string" ? profile.name.trim() : "";
  const contact = typeof profile.contact === "string" ? profile.contact.trim() : "";
  const bio = typeof profile.bio === "string" ? profile.bio.trim() : "";

  if (!participantId && !role && !name && !contact && !bio) {
    return null;
  }

  return {
    [SESSION_METADATA_FIELDS.name]: name,
    [SESSION_METADATA_FIELDS.contact]: contact,
    [SESSION_METADATA_FIELDS.bio]: bio,
    [SESSION_METADATA_FIELDS.participant_id]: participantId,
    [SESSION_METADATA_FIELDS.participant_role]: role,
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
        <td>${response.tested_route || ""}</td>
        <td>${response.participant_role || ""}</td>
        <td>${response.recommendation || ""}</td>
      `;
      tableBody.appendChild(row);
    });
}

function initSurveyPage() {
  const saveButton = document.querySelector("[data-save-survey]");
  const statusNode = document.querySelector("[data-save-status]");
  if (!saveButton || !statusNode) return;

  const lockedValues = applyLockedSessionMetadata(readMockProfile());

  saveButton.addEventListener("click", () => {
    const payload = buildSurveyPayload(document, lockedValues);
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

  const render = () => renderAdminTable(getStoredResponses());

  exportCsvButton.addEventListener("click", () => {
    const responses = getStoredResponses();
    downloadBlob(
      `roomie-survey-responses-${new Date().toISOString().slice(0, 10)}.csv`,
      responsesToCsv(responses),
      "text/csv;charset=utf-8"
    );
  });

  exportJsonButton.addEventListener("click", () => {
    const responses = getStoredResponses();
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
  initSurveyPage();
  initAdminPage();
});
