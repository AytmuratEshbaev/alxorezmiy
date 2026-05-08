// ============================================
// CONFIRM DIALOG — Custom branded modal
// ============================================
// Foydalanish:
//   const ok = await confirmDialog({
//     title: "O'chirish",
//     message: "Yangilikni o'chirmoqchimisiz?",
//     confirmText: "Ha, o'chirish",
//     cancelText: "Bekor qilish",
//     danger: true
//   });
//   if (ok) { ... }

(function () {
  const STYLE = `
    .ax-confirm-overlay {
      position: fixed; inset: 0; z-index: 5000;
      background: rgba(15, 23, 42, .65);
      backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
      opacity: 0; visibility: hidden;
      transition: opacity .25s ease, visibility .25s;
    }
    .ax-confirm-overlay.active { opacity: 1; visibility: visible; }
    .ax-confirm-box {
      background: white; border-radius: 16px;
      max-width: 420px; width: 100%;
      padding: 28px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, .25);
      transform: scale(.96) translateY(8px);
      transition: transform .28s cubic-bezier(.34, 1.56, .64, 1);
    }
    .ax-confirm-overlay.active .ax-confirm-box { transform: scale(1) translateY(0); }
    .ax-confirm-icon {
      width: 56px; height: 56px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%;
      margin-bottom: 16px;
      font-size: 1.6rem;
      background: rgba(99, 102, 241, .12); color: #6366F1;
    }
    .ax-confirm-icon.danger { background: rgba(239, 68, 68, .12); color: #EF4444; }
    .ax-confirm-title { font-size: 1.25rem; font-weight: 700; color: #0F172A; margin: 0 0 8px; }
    .ax-confirm-message { font-size: .95rem; color: #475569; line-height: 1.55; margin: 0 0 24px; }
    .ax-confirm-actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
    .ax-confirm-btn {
      padding: 11px 22px; border-radius: 10px;
      font-size: .9375rem; font-weight: 600;
      cursor: pointer; border: 1.5px solid transparent;
      font-family: inherit;
      transition: all .15s ease;
    }
    .ax-confirm-btn.cancel {
      background: white; color: #475569; border-color: #E2E8F0;
    }
    .ax-confirm-btn.cancel:hover { border-color: #94A3B8; }
    .ax-confirm-btn.confirm {
      background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white;
      box-shadow: 0 4px 14px rgba(99, 102, 241, .35);
    }
    .ax-confirm-btn.confirm:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(99, 102, 241, .45); }
    .ax-confirm-btn.confirm.danger {
      background: linear-gradient(135deg, #EF4444, #DC2626);
      box-shadow: 0 4px 14px rgba(239, 68, 68, .35);
    }
    .ax-confirm-btn.confirm.danger:hover { box-shadow: 0 6px 18px rgba(239, 68, 68, .45); }
  `;

  // Inject styles once
  if (!document.getElementById('ax-confirm-styles')) {
    const style = document.createElement('style');
    style.id = 'ax-confirm-styles';
    style.textContent = STYLE;
    document.head.appendChild(style);
  }

  window.confirmDialog = function (opts = {}) {
    const {
      title = 'Tasdiqlang',
      message = '',
      confirmText = 'Tasdiqlash',
      cancelText = 'Bekor qilish',
      danger = false,
      icon = danger ? '⚠️' : '❓'
    } = opts;

    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'ax-confirm-overlay';
      overlay.innerHTML = `
        <div class="ax-confirm-box" role="dialog" aria-modal="true" aria-labelledby="ax-confirm-title">
          <div class="ax-confirm-icon ${danger ? 'danger' : ''}">${icon}</div>
          <h3 class="ax-confirm-title" id="ax-confirm-title"></h3>
          <p class="ax-confirm-message"></p>
          <div class="ax-confirm-actions">
            <button class="ax-confirm-btn cancel" type="button"></button>
            <button class="ax-confirm-btn confirm ${danger ? 'danger' : ''}" type="button"></button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      overlay.querySelector('.ax-confirm-title').textContent = title;
      overlay.querySelector('.ax-confirm-message').textContent = message;
      overlay.querySelector('.ax-confirm-btn.cancel').textContent = cancelText;
      overlay.querySelector('.ax-confirm-btn.confirm').textContent = confirmText;

      requestAnimationFrame(() => overlay.classList.add('active'));

      const cleanup = (result) => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 280);
        resolve(result);
      };

      overlay.querySelector('.ax-confirm-btn.cancel').addEventListener('click', () => cleanup(false));
      overlay.querySelector('.ax-confirm-btn.confirm').addEventListener('click', () => cleanup(true));
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) cleanup(false);
      });
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          document.removeEventListener('keydown', escHandler);
          cleanup(false);
        }
      };
      document.addEventListener('keydown', escHandler);
      // Auto-focus confirm button
      setTimeout(() => overlay.querySelector('.ax-confirm-btn.confirm').focus(), 50);
    });
  };
})();
