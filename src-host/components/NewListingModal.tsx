import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { Unit, UnitStatus } from '../data';

export interface NewListingDraft {
  title: string;
  type: Unit['type'];
  location: string;
  price: number;
  status: Extract<UnitStatus, 'Active' | 'Draft'>;
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  description: string;
  amenities: string[];
  photos: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (draft: NewListingDraft) => void;
}

const INITIAL_FORM = {
  title: '',
  type: 'Studio' as Unit['type'],
  location: '',
  price: '',
  status: 'Draft' as Extract<UnitStatus, 'Active' | 'Draft'>,
  bedrooms: '1',
  bathrooms: '1',
  sqm: '',
  description: '',
  amenities: '',
};

const OTHER_IMPORT_PLATFORM = 'Other platform';
const IMPORT_PLATFORMS = ['Airbnb', 'Facebook Marketplace', 'Rentpad', 'Lamudi', 'DormyPH/SuzyRent', 'Hoppler', OTHER_IMPORT_PLATFORM];

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function NewListingModal({ open, onClose, onCreate }: Props) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importPlatform, setImportPlatform] = useState(IMPORT_PLATFORMS[0]);
  const [otherPlatformName, setOtherPlatformName] = useState('');
  const [importHelpSent, setImportHelpSent] = useState(false);

  const photoSlots = useMemo(() => {
    const padded = [...photos];
    while (padded.length < 3) padded.push('');
    return padded.slice(0, 3);
  }, [photos]);

  if (!open) return null;

  function resetForm() {
    setForm(INITIAL_FORM);
    setPhotos([]);
    setIsUploading(false);
    setImportOpen(false);
    setImportPlatform(IMPORT_PLATFORMS[0]);
    setOtherPlatformName('');
    setImportHelpSent(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, 4);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const nextPhotos = await Promise.all(files.map(readFileAsDataUrl));
      setPhotos(nextPhotos.filter(Boolean));
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onCreate({
      title: form.title.trim(),
      type: form.type,
      location: form.location.trim(),
      price: Number(form.price),
      status: form.status,
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      sqm: Number(form.sqm),
      description: form.description.trim(),
      amenities: form.amenities
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      photos,
    });

    handleClose();
  }

  function selectImportPlatform(platform: string) {
    setImportPlatform(platform);
    setImportHelpSent(false);
  }

  function sendOtherPlatformHelpInquiry() {
    if (!otherPlatformName.trim()) return;
    setImportHelpSent(true);
  }

  return (
    <div className="listing-modal-overlay" onClick={handleClose}>
      <div
        className="listing-modal new-listing-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-listing-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="new-listing-shell">
          <div className="new-listing-head">
            <div>
              <div className="listing-modal-type">New listing</div>
              <h2 id="new-listing-title" className="listing-modal-title">Create host mock listing</h2>
              <p className="listing-modal-location">This feeds the live demo state across dashboard, listings, and recent activity.</p>
            </div>
            <button className="listing-modal-close" onClick={handleClose} aria-label="Close new listing modal">
              ×
            </button>
          </div>

          <form className="new-listing-body" onSubmit={handleSubmit}>
            <section className={`listing-import-card ${importOpen ? 'is-open' : ''}`}>
              <button
                type="button"
                className="listing-import-toggle"
                onClick={() => setImportOpen((current) => !current)}
                aria-expanded={importOpen}
              >
                <span>
                  <strong>Import listings from other platforms</strong>
                  <small>Bring listing details from another rental channel, then review before publishing.</small>
                </span>
                <span className="listing-import-chevron" aria-hidden="true">v</span>
              </button>
              {importOpen && (
                <div className="listing-import-panel">
                  <div className="listing-import-platforms" role="list" aria-label="Listing import platforms">
                    {IMPORT_PLATFORMS.map((platform) => (
                      <button
                        key={platform}
                        type="button"
                        className={`listing-import-platform ${importPlatform === platform ? 'active' : ''}`}
                        onClick={() => selectImportPlatform(platform)}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                  {importPlatform === OTHER_IMPORT_PLATFORM ? (
                    <div className="listing-import-help">
                      {importHelpSent ? (
                        <div className="listing-import-confirmation">
                          Help inquiry sent to the Roomie support team. They will respond ASAP.
                        </div>
                      ) : (
                        <>
                          <label className="listing-import-other-field">
                            <span>Platform name</span>
                            <input
                              value={otherPlatformName}
                              onChange={(event) => setOtherPlatformName(event.target.value)}
                              placeholder="Enter platform"
                            />
                          </label>
                          <button
                            type="button"
                            className="listing-import-ok"
                            onClick={sendOtherPlatformHelpInquiry}
                            disabled={!otherPlatformName.trim()}
                          >
                            OK
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <label className="new-listing-field listing-import-url">
                      <span>{importPlatform} listing link</span>
                      <input placeholder="Paste listing URL to import details" />
                    </label>
                  )}
                </div>
              )}
            </section>

            <div className="new-listing-grid">
              <label className="new-listing-field">
                <span>Listing title</span>
                <input
                  required
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Ex. Loft Studio near Katipunan"
                />
              </label>
              <label className="new-listing-field">
                <span>Location</span>
                <input
                  required
                  value={form.location}
                  onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                  placeholder="Ex. Makati, Manila"
                />
              </label>
              <label className="new-listing-field">
                <span>Type</span>
                <select value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as Unit['type'] }))}>
                  <option value="Studio">Studio</option>
                  <option value="Bedspace">Bedspace</option>
                  <option value="Apartment">Apartment</option>
                </select>
              </label>
              <label className="new-listing-field">
                <span>Status</span>
                <select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as Extract<UnitStatus, 'Active' | 'Draft'> }))}>
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                </select>
              </label>
              <label className="new-listing-field">
                <span>Monthly rent</span>
                <input
                  required
                  type="number"
                  min="1000"
                  step="100"
                  value={form.price}
                  onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                  placeholder="6500"
                />
              </label>
              <label className="new-listing-field">
                <span>Floor area (sqm)</span>
                <input
                  required
                  type="number"
                  min="8"
                  step="1"
                  value={form.sqm}
                  onChange={(event) => setForm((prev) => ({ ...prev, sqm: event.target.value }))}
                  placeholder="24"
                />
              </label>
              <label className="new-listing-field">
                <span>Bedrooms</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={form.bedrooms}
                  onChange={(event) => setForm((prev) => ({ ...prev, bedrooms: event.target.value }))}
                />
              </label>
              <label className="new-listing-field">
                <span>Bathrooms</span>
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={form.bathrooms}
                  onChange={(event) => setForm((prev) => ({ ...prev, bathrooms: event.target.value }))}
                />
              </label>
            </div>

            <label className="new-listing-field">
              <span>Description</span>
              <textarea
                required
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Short host-facing summary of the listing."
              />
            </label>

            <label className="new-listing-field">
              <span>Amenities</span>
              <input
                value={form.amenities}
                onChange={(event) => setForm((prev) => ({ ...prev, amenities: event.target.value }))}
                placeholder="Wi-Fi ready, Furnished, Laundry access"
              />
            </label>

            <div className="new-listing-field">
              <span>Add photos</span>
              <label className="new-listing-upload">
                <input type="file" accept="image/*" multiple onChange={handlePhotoChange} />
                <div className="new-listing-upload-copy">
                  <strong>{isUploading ? 'Uploading photos...' : 'Upload listing photos'}</strong>
                  <small>Up to 4 images. The first image becomes the card cover.</small>
                </div>
              </label>
              <div className="new-listing-photo-grid">
                {photoSlots.map((photo, index) => (
                  <div key={index} className={`new-listing-photo-slot ${photo ? 'has-photo' : ''}`}>
                    {photo ? <img src={photo} alt={`Listing upload ${index + 1}`} /> : <span>Photo {index + 1}</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="listing-modal-actions">
              <button type="button" className="unit-btn" onClick={handleClose}>Cancel</button>
              <button type="submit" className="unit-btn unit-btn-primary">Create mock listing</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
