import CodeForNLID from './CodeForNLID.mjs';
import { renderTemplate, templates } from './utils/templating.mjs';

export default class UserManager {
    constructor(userStatusEl) {
        this.userStatusEl = userStatusEl;
    }

    updateUserStatus() {
        const currentUsername = CodeForNLID.getCurrentUsername();
        const isAnonymous = !CodeForNLID.isLoggedIn();

        if (isAnonymous) {
            this.userStatusEl.innerHTML = renderTemplate(templates.userStatusLoggedOut, {
                username: currentUsername
            });
        } else {
            const pubkey = CodeForNLID.getPublicKey();
            const avatarDataURL = pubkey ? CodeForNLID.getAvatarDataURL(pubkey, 48) : '';
            const needsBackup = CodeForNLID.needsBackup();

            this.userStatusEl.innerHTML = renderTemplate(templates.userStatusLoggedIn, {
                username: currentUsername,
                avatarDataURL,
                needsBackup
            });
        }

        this._attachEventListeners();
    }

    _attachEventListeners() {
        const downloadKeyBtn = this.userStatusEl.querySelector('.download-key-btn');
        const logoutBtn = this.userStatusEl.querySelector('.logout-btn');
        const importKeyBtn = this.userStatusEl.querySelector('.import-key-btn');
        const newAccountBtn = this.userStatusEl.querySelector('.new-account-btn');

        if (downloadKeyBtn) {
            downloadKeyBtn.addEventListener('click', () => {
                try {
                    const currentUsername = CodeForNLID.getCurrentUsername();
                    CodeForNLID.downloadBackupImage(`code-for-nl-id-${currentUsername}.png`);
                } catch (error) {
                    alert(error.message);
                }
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                const needsBackup = CodeForNLID.needsBackup();
                let shouldLogout = true;

                if (needsBackup) {
                    shouldLogout = confirm('Weet je zeker dat je wilt uitloggen? Je verliest je chat identiteit.');
                }

                if (shouldLogout) {
                    CodeForNLID.logout();
                    location.reload();
                }
            });
        }

        if (importKeyBtn) {
            importKeyBtn.addEventListener('click', () => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.png,.jpg,.jpeg';
                fileInput.style.display = 'none';
                document.body.appendChild(fileInput);

                fileInput.addEventListener('change', async (event) => {
                    const file = event.target.files[0];
                    if (file) {
                        try {
                            await CodeForNLID.importIDFromImage(file);
                            location.reload();
                        } catch (error) {
                            alert('Kon Code for NL ID niet uit afbeelding halen: ' + error.message);
                        }
                    }
                    document.body.removeChild(fileInput);
                });

                fileInput.click();
            });
        }

        if (newAccountBtn) {
            newAccountBtn.addEventListener('click', async () => {
                const username = prompt('Wat is je gebruikersnaam voor de chat?');
                if (username && username.trim()) {
                    try {
                        await CodeForNLID.createNewID(username);
                        location.reload();
                    } catch (error) {
                        alert(error.message);
                    }
                }
            });
        }
    }
}
