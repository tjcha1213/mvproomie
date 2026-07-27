import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { AVATARS, JUAN_AVATAR } from '../avatarPool';
import { updateProfileAvatar } from './MockSession';
import './ProfilePhotoCard.css';

interface Props {
  avatar: string;
  name: string;
  onShowToast: (msg: string) => void;
}

export default function ProfilePhotoCard({ avatar, name, onShowToast }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  const choosePhoto = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast('Choose an image file');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (typeof reader.result !== 'string') return;
      updateProfileAvatar(reader.result);
      onShowToast('Profile picture updated');
    });
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const openAvatarModal = () => {
    setAvatarModalOpen(true);
  };

  const selectAvatar = (nextAvatar: string) => {
    updateProfileAvatar(nextAvatar);
    setAvatarModalOpen(false);
    onShowToast('Avatar updated');
  };

  return (
    <>
      <div className="profile-photo-card">
        <div className="profile-photo-preview">
          <img src={avatar || JUAN_AVATAR} alt={`${name} profile`} />
        </div>
        <div className="profile-photo-copy">
          <div className="profile-photo-title">Profile picture</div>
          <div className="profile-photo-subtitle">Shown in the profile circle and app header.</div>
        </div>
        <div className="profile-photo-actions">
          <button type="button" className="profile-photo-btn primary" onClick={choosePhoto}>
            Change photo
          </button>
          <button type="button" className="profile-photo-btn" onClick={openAvatarModal}>
            Use avatar
          </button>
        </div>
        <input
          ref={inputRef}
          className="profile-photo-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      {avatarModalOpen && (
        <div className="profile-avatar-modal-overlay" role="presentation" onClick={() => setAvatarModalOpen(false)}>
          <div
            className="profile-avatar-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Choose avatar"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="profile-avatar-modal-head">
              <div>
                <div className="profile-avatar-modal-title">Choose avatar</div>
                <div className="profile-avatar-modal-subtitle">Pick one to show in your profile circle.</div>
              </div>
              <button type="button" className="profile-avatar-modal-close" onClick={() => setAvatarModalOpen(false)} aria-label="Close avatar selection">
                ×
              </button>
            </div>
            <div className="profile-avatar-grid">
              {AVATARS.map((item, index) => {
                const selected = avatar === item;
                return (
                  <button
                    key={item}
                    type="button"
                    className={`profile-avatar-option ${selected ? 'selected' : ''}`}
                    onClick={() => selectAvatar(item)}
                    aria-label={`Use avatar ${index + 1}`}
                  >
                    <img src={item} alt="" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
