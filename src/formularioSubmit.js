import { API_ENDPOINT } from './env-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('proposal-form');
    const statusEl = document.getElementById('form-status');

    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
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
        };

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
                }
                return;
            }

            if (statusEl) {
                statusEl.textContent = 'Solicitud enviada con éxito. Gracias.';
                statusEl.className = 'text-sm text-accent';
            }
            form.reset();
        } catch (error) {
            if (statusEl) {
                statusEl.textContent = 'No se pudo conectar con el servidor. Comprueba el backend y CORS.';
                statusEl.className = 'text-sm text-red-400';
            }
            console.error('Error enviando propuesta:', error);
        }
    });
});
