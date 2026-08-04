const SHEET_NAME = "Survey Responses";
const ADMIN_TOKEN = "roomieadmin";

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

function getSurveySheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function ensureSurveyHeaders(sheet) {
  sheet.getRange(1, 1, 1, SURVEY_FIELDS.length).setValues([SURVEY_FIELDS]);
  sheet.setFrozenRows(1);
}

function doPost(e) {
  const sheet = getSurveySheet();
  ensureSurveyHeaders(sheet);

  const payload = JSON.parse(e.postData.contents || "{}");
  if (payload.action === "delete") {
    if (payload.token !== ADMIN_TOKEN) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: "Unauthorized" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const responseIds = Array.isArray(payload.response_ids)
      ? payload.response_ids.map(String).filter(Boolean)
      : [];
    const deleted = deleteSurveyRowsByResponseId(sheet, responseIds);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, deleted }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  sheet.appendRow(SURVEY_FIELDS.map((field) => payload[field] || ""));

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  if (e.parameter.token !== ADMIN_TOKEN) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: "Unauthorized" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = getSurveySheet();
  ensureSurveyHeaders(sheet);

  const values = sheet.getDataRange().getValues();
  const headers = values.shift() || [];
  const rows = values
    .filter((row) => row.some((cell) => cell !== ""))
    .map((row) =>
      Object.fromEntries(SURVEY_FIELDS.map((field, index) => [field, row[headers.indexOf(field) >= 0 ? headers.indexOf(field) : index] || ""]))
    );

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, rows }))
    .setMimeType(ContentService.MimeType.JSON);
}

function repairSurveyHeaders() {
  ensureSurveyHeaders(getSurveySheet());
}

function deleteSurveyRowsByResponseId(sheet, responseIds) {
  if (!responseIds.length) return 0;

  const responseIdSet = new Set(responseIds);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return 0;

  const headers = values[0];
  const responseIdColumnIndex = headers.indexOf("response_id");
  if (responseIdColumnIndex < 0) return 0;

  let deleted = 0;
  for (let rowIndex = values.length - 1; rowIndex >= 1; rowIndex -= 1) {
    const responseId = String(values[rowIndex][responseIdColumnIndex] || "");
    if (!responseIdSet.has(responseId)) continue;
    sheet.deleteRow(rowIndex + 1);
    deleted += 1;
  }

  return deleted;
}
