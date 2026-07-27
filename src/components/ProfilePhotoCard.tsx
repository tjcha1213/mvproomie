import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { JUAN_AVATAR } from '../avatarPool';
import { updateProfileAvatar } from './MockSession';
import './ProfilePhotoCard.css';

interface Props {
  avatar: string;
  name: string;
  onShowToast: (msg: string) => void;
}

export default function ProfilePhotoCard({ avatar, name, onShowToast }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

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

  const resetPhoto = () => {
    updateProfileAvatar(JUAN_AVATAR);
    onShowToast('Profile picture reset');
  };

  return (
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
        <button type="button" className="profile-photo-btn" onClick={resetPhoto}>
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
  );
}
