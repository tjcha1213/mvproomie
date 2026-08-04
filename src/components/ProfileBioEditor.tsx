import { useEffect, useState } from 'react';
import { updateProfileBio, updateProfileBirthdate } from './MockSession';
import './ProfileBioEditor.css';

interface Props {
  bio: string;
  birthdate: string;
  onShowToast: (msg: string) => void;
}

export default function ProfileBioEditor({ bio, birthdate, onShowToast }: Props) {
  const [draft, setDraft] = useState(bio);
  const [birthdateDraft, setBirthdateDraft] = useState(birthdate);

  useEffect(() => {
    setDraft(bio);
  }, [bio]);

  useEffect(() => {
    setBirthdateDraft(birthdate);
  }, [birthdate]);

  const saveBio = () => {
    updateProfileBio(draft.trim());
    updateProfileBirthdate(birthdateDraft);
    onShowToast('Personal details updated');
  };

  return (
    <div className="profile-bio-editor">
      <label className="profile-bio-label" htmlFor="profile-birthdate-input">
        Birthdate
      </label>
      <input
        id="profile-birthdate-input"
        className="profile-bio-input profile-birthdate-input"
        type="date"
        value={birthdateDraft}
        onChange={(event) => setBirthdateDraft(event.target.value)}
      />
      <label className="profile-bio-label" htmlFor="profile-bio-input">
        Bio
      </label>
      <textarea
        id="profile-bio-input"
        className="profile-bio-input"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        rows={4}
        placeholder="Add a short personal description."
      />
      <div className="profile-bio-actions">
        <button type="button" className="profile-bio-save" onClick={saveBio}>
          Save details
        </button>
      </div>
    </div>
  );
}
