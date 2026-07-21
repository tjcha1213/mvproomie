import type { ChangeEvent } from 'react';
import type { Unit, UnitStatus } from '../data';

interface Draft {
  title: string;
  location: string;
  price: string;
  status: UnitStatus;
  bedrooms: string;
  bathrooms: string;
  sqm: string;
  description: string;
  amenities: string;
}

interface Props {
  open: boolean;
  unit: Unit | null;
  draft: Draft;
  photos: string[];
  onClose: () => void;
  onSave: () => void;
  onDraftChange: (next: Draft) => void;
  onPhotoUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}

export type ListingEditDraft = Draft;

export default function ListingEditModal({
  open,
  unit,
  draft,
  photos,
  onClose,
  onSave,
  onDraftChange,
  onPhotoUpload,
}: Props) {
  if (!open || !unit) return null;

  return (
    <div className="listing-modal-overlay" onClick={onClose}>
      <div className="listing-modal listing-edit-modal" onClick={(event) => event.stopPropagation()}>
        <div className="listing-modal-head">
          <div>
            <div className="listing-modal-topline">Edit listing</div>
            <h3>{unit.title}</h3>
            <p>Update the mock listing details shown across the host demo.</p>
          </div>
          <button className="listing-modal-close" onClick={onClose} aria-label="Close edit listing">
            ×
          </button>
        </div>
        <div className="listing-modal-body listing-edit-body">
          <div className="new-listing-grid">
            <label className="new-listing-field">
              <span>Listing title</span>
              <input value={draft.title} onChange={(event) => onDraftChange({ ...draft, title: event.target.value })} />
            </label>
            <label className="new-listing-field">
              <span>Location</span>
              <input value={draft.location} onChange={(event) => onDraftChange({ ...draft, location: event.target.value })} />
            </label>
            <label className="new-listing-field">
              <span>Monthly rent</span>
              <input type="number" value={draft.price} onChange={(event) => onDraftChange({ ...draft, price: event.target.value })} />
            </label>
            <label className="new-listing-field">
              <span>Status</span>
              <select value={draft.status} onChange={(event) => onDraftChange({ ...draft, status: event.target.value as UnitStatus })}>
                <option value="Active">Active</option>
                <option value="Occupied">Occupied</option>
                <option value="Draft">Draft</option>
              </select>
            </label>
            <label className="new-listing-field">
              <span>Bedrooms</span>
              <input type="number" value={draft.bedrooms} onChange={(event) => onDraftChange({ ...draft, bedrooms: event.target.value })} />
            </label>
            <label className="new-listing-field">
              <span>Bathrooms</span>
              <input type="number" value={draft.bathrooms} onChange={(event) => onDraftChange({ ...draft, bathrooms: event.target.value })} />
            </label>
            <label className="new-listing-field">
              <span>Floor area</span>
              <input type="number" value={draft.sqm} onChange={(event) => onDraftChange({ ...draft, sqm: event.target.value })} />
            </label>
            <label className="new-listing-field">
              <span>Amenities</span>
              <input value={draft.amenities} onChange={(event) => onDraftChange({ ...draft, amenities: event.target.value })} />
            </label>
          </div>
          <div className="new-listing-field">
            <span>Listing photos</span>
            <label className="new-listing-upload">
              <input type="file" accept="image/*" multiple onChange={onPhotoUpload} />
              <div className="new-listing-upload-copy">
                <strong>Replace listing photos</strong>
                <small>Upload up to 4 images. The first image becomes the cover photo.</small>
              </div>
            </label>
            <div className="new-listing-photo-grid">
              {photos.slice(0, 4).map((photo, index) => (
                <div key={`edit-photo-${index}`} className="new-listing-photo-slot has-photo">
                  <img src={photo} alt={`Listing edit photo ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>
          <label className="new-listing-field">
            <span>Description</span>
            <textarea value={draft.description} onChange={(event) => onDraftChange({ ...draft, description: event.target.value })} />
          </label>
          <div className="listing-modal-actions">
            <button className="unit-btn" onClick={onClose}>Cancel</button>
            <button className="unit-btn unit-btn-primary" onClick={onSave}>Save changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}
