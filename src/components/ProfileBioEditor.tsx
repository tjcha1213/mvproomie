import { useEffect, useState } from 'react';
import { updateProfileBio } from './MockSession';
import './ProfileBioEditor.css';

interface Props {
  bio: string;
  onShowToast: (msg: string) => void;
}

export default function ProfileBioEditor({ bio, onShowToast }: Props) {
  const [draft, setDraft] = useState(bio);

  useEffect(() => {
    setDraft(bio);
  }, [bio]);

  const saveBio = () => {
    updateProfileBio(draft.trim());
    onShowToast('Personal bio updated');
  };

  return (
    <div className="profile-bio-editor">
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
          Save bio
        </button>
      </div>
    </div>
  );
}
