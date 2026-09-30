const form = document.querySelector('#survey-form');
const progressBar = document.querySelector('#progress-bar');
const progressText = document.querySelector('#progress-text');
const recommendations = document.querySelector('#recommendations');
const activities = document.querySelector('#activities');
const materials = document.querySelector('#materials');
const charCount = document.querySelector('#char-count');
const activitiesCharCount = document.querySelector('#activities-char-count');
const materialsCharCount = document.querySelector('#materials-char-count');
const formMessage = document.querySelector('#form-message');
const modal = document.querySelector('#success-modal');
const closeModal = document.querySelector('#close-modal');

// Las preguntas de opción múltiple y las preguntas escritas 16 y 22 son obligatorias.
// La propuesta general de la pregunta 21 es opcional.
const requiredQuestions = [...document.querySelectorAll('.question-card[data-question]:not(.recommendation-card), .text-answer-card[data-question="16"], .text-answer-card[data-question="22"]')];

function isAnswered(card) {
  const input = card.querySelector('input:checked');
  if (input && input.value.trim()) return true;
  const textarea = card.querySelector('textarea');
  return textarea ? textarea.value.trim().length > 0 : false;
}

function updateProgress() {
  const answered = requiredQuestions.filter(isAnswered).length;
  progressBar.style.width = `${(answered / requiredQuestions.length) * 100}%`;
  progressText.textContent = `${answered} de ${requiredQuestions.length} respondidas`;
}

document.querySelectorAll('.question-card input, .text-answer-card textarea').forEach((input) => {
  input.addEventListener('change', () => {
    input.closest('[data-question]').classList.remove('needs-answer');
    formMessage.textContent = '';
    updateProgress();
  });
  input.addEventListener('input', () => {
    input.closest('[data-question]').classList.remove('needs-answer');
    formMessage.textContent = '';
    updateProgress();
  });
});

function updateCounter(field, counter) {
  if (field && counter) counter.textContent = `${field.value.length} / 500`;
}

recommendations?.addEventListener('input', () => updateCounter(recommendations, charCount));
activities?.addEventListener('input', () => updateCounter(activities, activitiesCharCount));
materials?.addEventListener('input', () => updateCounter(materials, materialsCharCount));

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const unanswered = requiredQuestions.filter((card) => !isAnswered(card));

  if (unanswered.length > 0) {
    unanswered.forEach((card) => card.classList.add('needs-answer'));
    formMessage.textContent = `Te falta responder ${unanswered.length} ${unanswered.length === 1 ? 'pregunta' : 'preguntas'}.`;
    unanswered[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const formData = new FormData(form);
  const answers = Object.fromEntries(formData.entries());

  try {
    formMessage.textContent = 'Guardando tus respuestas...';

    // SheetDB recibe los datos dentro de la propiedad "data".
    // Se agrega la fecha para identificar cuándo se envió cada respuesta.
    const sheetData = {
      ...answers,
      fecha: new Date().toISOString()
    };

    const response = await fetch('https://sheetdb.io/api/v1/ok25deh7oyvrj', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: sheetData })
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      throw new Error(result.error || 'No se pudieron guardar las respuestas en Google Sheets.');
    }

    formMessage.textContent = '';
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  } catch (error) {
    formMessage.textContent = error.message;
  }
});

function hideModal() {
  modal.hidden = true;
  document.body.style.overflow = '';
}

closeModal.addEventListener('click', hideModal);
modal.querySelector('.modal-backdrop').addEventListener('click', hideModal);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modal.hidden) hideModal();
});

updateProgress();
