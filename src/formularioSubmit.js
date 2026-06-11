import { API_ENDPOINT, PROPUESTA_URL } from './env-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('proposal-form');
    const statusEl = document.getElementById('form-status');
    const screenshot = sessionStorage.getItem('kitchen_screenshot');
    const btn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        btn.disabled = true;
        btnText.textContent = 'Enviando...';

        if (statusEl) {
            statusEl.textContent = 'Enviando solicitud...';
            statusEl.className = 'text-sm text-muted';
        }

        const payload = {
            nombre: form.name.value.trim(),
            email: form.email.value.trim(),
            telefono: (form.phone?.value || '').trim(),
            descripcion: form.message.value.trim(),
            archivo_pdf: null,
            elementos: JSON.parse(sessionStorage.getItem('kitchen_elements') || '[]'),
            imagen_diseno: screenshot
        };
        //sdlkjshadsdjh
        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (statusEl) {
                    statusEl.textContent = errorData.message || 'Error al enviar la solicitud.';
                    statusEl.className = 'text-sm text-red-400';
                    btn.disabled = false;
                    btnText.textContent = 'Enviar solicitud';
                }
                return;
            }

            if (statusEl) {
                statusEl.textContent = 'Solicitud enviada con éxito. Gracias.';
                statusEl.className = 'text-sm text-accent';
                btn.disabled = false;
                btnText.textContent = 'Enviar solicitud';
            }
            form.reset();

            sessionStorage.removeItem('kitchen_elements');
            sessionStorage.removeItem('kitchen_screenshot');

            setTimeout(() => {
                window.location.href = PROPUESTA_URL;
            }, 1000);


        } catch (error) {
            if (statusEl) {
                statusEl.textContent = 'No se pudo conectar con el servidor. Comprueba el backend y CORS.';
                statusEl.className = 'text-sm text-red-400';
                btn.disabled = false;
                btnText.textContent = 'Enviar solicitud';
            }
            console.error('Error enviando propuesta:', error);
        }
    });
});
