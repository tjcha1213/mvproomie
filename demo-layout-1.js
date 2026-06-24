const listings = [
  {
    id: 1,
    type: "Studio",
    title: "Cozy Studio Unit",
    location: "Katipunan, Quezon City",
    city: "Katipunan, QC",
    price: "₱6,000 / month",
    bed: "1",
    bath: "1",
    size: "20",
    description:
      "Cozy and fully furnished studio unit in a quiet and safe area near Ateneo. Perfect for students and young professionals, with fast Wi-Fi, ref, microwave, and laundry area.",
    gradient: "linear-gradient(135deg, #e7d8c6, #b08b67)"
  },
  {
    id: 2,
    type: "1BR Apartment",
    title: "1BR Apartment",
    location: "Cubao, Quezon City",
    city: "Cubao, QC",
    price: "₱13,500 / month",
    bed: "1",
    bath: "1",
    size: "34",
    description:
      "Bright one-bedroom apartment with better storage, stronger privacy, and easy rail access. Good for solo renters who want more separation between rest and work.",
    gradient: "linear-gradient(135deg, #d9e6d8, #9fb39a)"
  },
  {
    id: 3,
    type: "Studio",
    title: "Modern Studio",
    location: "Timog, Quezon City",
    city: "Timog, QC",
    price: "₱7,000 / month",
    bed: "1",
    bath: "1",
    size: "18",
    description:
      "Modern compact studio in a lively district with furnished essentials and strong day-to-day convenience for young renters.",
    gradient: "linear-gradient(135deg, #efe5da, #bda68d)"
  },
  {
    id: 4,
    type: "Bedspace",
    title: "Male Bedspace",
    location: "España, Manila",
    city: "España, Manila",
    price: "₱2,600 / month",
    bed: "1",
    bath: "1 shared",
    size: "10",
    description:
      "Affordable bedspace option near schools and transport corridors, suitable for demand testing among student renters.",
    gradient: "linear-gradient(135deg, #d7d1c5, #8c8378)"
  },
  {
    id: 5,
    type: "Apartment",
    title: "2BR Apartment",
    location: "Ortigas, Pasig",
    city: "Ortigas, Pasig",
    price: "₱18,000 / month",
    bed: "2",
    bath: "1",
    size: "42",
    description:
      "A larger unit near major business access, useful as a comparison case against smaller-format listings in the Roomie flow.",
    gradient: "linear-gradient(135deg, #ece7e0, #aba39a)"
  }
];

const listingGrid = document.querySelector("#listing-grid");
const savedStack = document.querySelector("#saved-stack");
const detailHero = document.querySelector("#detail-hero");
const detailType = document.querySelector("#detail-type");
const detailTitle = document.querySelector("#detail-title");
const detailLocation = document.querySelector("#detail-location");
const detailPrice = document.querySelector("#detail-price");
const detailBed = document.querySelector("#detail-bed");
const detailBath = document.querySelector("#detail-bath");
const detailSize = document.querySelector("#detail-size");
const detailDescription = document.querySelector("#detail-description");

let activeId = 1;
let savedIds = new Set([1, 2, 3, 4, 5]);

function renderListings() {
  listingGrid.innerHTML = "";
  listings.forEach((listing) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "demo-listing-card";
    if (listing.id === activeId) {
      card.classList.add("selected");
    }
    card.innerHTML = `
      <div class="demo-thumb" style="background:${listing.gradient}"></div>
      <div class="heart-btn">${savedIds.has(listing.id) ? "♥" : "♡"}</div>
      <div class="mini-pill">${listing.type}</div>
      <h4>${listing.title}</h4>
      <p>${listing.city}</p>
      <strong>${listing.price}</strong>
    `;
    card.addEventListener("click", () => {
      activeId = listing.id;
      renderListings();
      renderDetail();
    });
    listingGrid.appendChild(card);
  });
}

function renderSaved() {
  savedStack.innerHTML = "";
  listings
    .filter((listing) => savedIds.has(listing.id))
    .forEach((listing) => {
      const row = document.createElement("div");
      row.className = "saved-row";
      row.innerHTML = `
        <div class="saved-thumb" style="background:${listing.gradient}"></div>
        <div class="saved-copy">
          <div class="mini-pill">${listing.type}</div>
          <h4>${listing.title}</h4>
          <p>${listing.city}</p>
          <strong>${listing.price}</strong>
        </div>
        <button class="saved-heart" type="button" aria-label="saved">♥</button>
      `;
      row.querySelector(".saved-heart").addEventListener("click", () => {
        savedIds.delete(listing.id);
        if (savedIds.size === 0) {
          savedIds = new Set([activeId]);
        }
        renderListings();
        renderSaved();
      });
      savedStack.appendChild(row);
    });
}

function renderDetail() {
  const listing = listings.find((item) => item.id === activeId);
  detailHero.style.background = listing.gradient;
  detailType.textContent = listing.type;
  detailTitle.textContent = listing.title;
  detailLocation.textContent = listing.location;
  detailPrice.textContent = listing.price;
  detailBed.textContent = listing.bed;
  detailBath.textContent = listing.bath;
  detailSize.textContent = listing.size;
  detailDescription.textContent = listing.description;
}

renderListings();
renderSaved();
renderDetail();
