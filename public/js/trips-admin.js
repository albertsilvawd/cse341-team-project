document.addEventListener('DOMContentLoaded', () => {
  const tripsContainer = document.querySelector('#trips-admin-list');
  const feedback = document.querySelector('#trip-feedback');
  const cardTemplate = document.querySelector('#trip-card-template');
  const editTemplate = document.querySelector('#trip-edit-template');
  let tripsMap = new Map();
  let availableStations = [];
  let availableSchedules = [];

  function showMessage(msg, isError = false) {
    if (!feedback) return;
    feedback.textContent = msg;
    feedback.style.color = isError ? '#d32f2f' : '#2e7d32';
  }

  function getIdentifier(trip) {
    return trip._id || trip.id;
  }

  function renderList() {
    const fragment = document.createDocumentFragment();
    for (const trip of tripsMap.values()) {
      const clone = cardTemplate.content.cloneNode(true);
      const article = clone.querySelector('.trip-admin-card');
      const tripId = getIdentifier(trip);
      article.dataset.tripId = tripId;

      const origin = trip.startStation || trip.origin || 'N/A';
      const destination = trip.endStation || trip.destination || 'N/A';

      clone.querySelector('.trip-name').textContent = trip.name || 'Unnamed Trip';
      clone.querySelector('.trip-route').textContent = `Route: ${origin} → ${destination}`;
      clone.querySelector('.trip-distance').textContent = `Distance: ${trip.distance || 0} km`;
      clone.querySelector('.trip-price').textContent = `Base Price: ¥${Number(trip.basePrice || 0).toLocaleString()}`;
      fragment.append(clone);
    }
    tripsContainer.replaceChildren(fragment);
  }

  async function loadAuxiliaryData() {
    try {
      const [stationsRes, schedulesRes] = await Promise.allSettled([
        fetch('/api/stations'),
        fetch('/api/schedules')
      ]);

      if (stationsRes.status === 'fulfilled' && stationsRes.value.ok) {
        const data = await stationsRes.value.json();
        availableStations = Array.isArray(data) ? data : (data.stations || data.data || []);
      }
      if (schedulesRes.status === 'fulfilled' && schedulesRes.value.ok) {
        const data = await schedulesRes.value.json();
        availableSchedules = Array.isArray(data) ? data : (data.schedules || data.data || []);
      }
    } catch (err) {
      console.warn('Could not load station/schedule options for admin edit form:', err);
    }
  }

  async function loadTrips() {
    try {
      const res = await fetch('/api/trips');
      if (!res.ok) throw new Error('Could not retrieve trips from server.');

      const payload = await res.json();
      const tripsArray = Array.isArray(payload) ? payload : (payload.trips || payload.data || []);

      tripsMap = new Map(tripsArray.map((t) => [String(getIdentifier(t)), t]));
      renderList();
    } catch (err) {
      showMessage(err.message, true);
    }
  }

  function populateSelect(selectEl, items, selectedValue, defaultLabel) {
    selectEl.innerHTML = `<option value="">${defaultLabel}</option>`;
    items.forEach((item) => {
      const val = item.code || item.id || item._id || item.name || item;
      const text = item.name || item.code || item.title || val;
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = text;
      if (String(val).toLowerCase() === String(selectedValue).toLowerCase()) {
        opt.selected = true;
      }
      selectEl.appendChild(opt);
    });

    // If current value is not in fetched list, retain it as an option
    if (selectedValue && !Array.from(selectEl.options).some(o => o.value === selectedValue)) {
      const opt = document.createElement('option');
      opt.value = selectedValue;
      opt.textContent = selectedValue;
      opt.selected = true;
      selectEl.appendChild(opt);
    }
  }

  function showEditor(card, trip) {
    const clone = editTemplate.content.cloneNode(true);
    const form = clone.querySelector('form');
    const tripId = String(getIdentifier(trip));
    form.dataset.tripId = tripId;

    form.elements.name.value = trip.name || '';
    form.elements.distance.value = trip.distance || 0;
    form.elements.basePrice.value = trip.basePrice || 0;

    const currentOrigin = trip.startStation || trip.origin || '';
    const currentDest = trip.endStation || trip.destination || '';
    const currentSchedule = trip.schedule || (Array.isArray(trip.schedules) ? trip.schedules[0] : '');

    populateSelect(form.elements.startStation, availableStations, currentOrigin, 'Select Start Station');
    populateSelect(form.elements.endStation, availableStations, currentDest, 'Select End Station');
    populateSelect(form.elements.schedule, availableSchedules, currentSchedule, 'Select Schedule (Optional)');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const startStation = form.elements.startStation.value.trim();
      const endStation = form.elements.endStation.value.trim();
      const scheduleVal = form.elements.schedule.value.trim();

      const updateData = {
        name: form.elements.name.value.trim(),
        startStation,
        endStation,
        origin: startStation,
        destination: endStation,
        distance: Number(form.elements.distance.value),
        basePrice: Number(form.elements.basePrice.value)
      };

      if (scheduleVal) {
        updateData.schedules = [scheduleVal];
      }

      try {
        const response = await fetch(`/api/trips/${encodeURIComponent(tripId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || 'Failed to update trip.');
        }
        const updated = await response.json();
        tripsMap.set(tripId, updated);
        renderList();
        showMessage(`Successfully updated "${updated.name}".`);
      } catch (error) {
        showMessage(error.message, true);
      }
    });

    card.replaceWith(clone);
  }

  tripsContainer.addEventListener('click', async (e) => {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    const card = button.closest('[data-trip-id]');
    const tripId = card.dataset.tripId;
    const trip = tripsMap.get(tripId);

    if (button.dataset.action === 'edit') {
      showEditor(card, trip);
    } else if (button.dataset.action === 'cancel') {
      renderList();
    } else if (button.dataset.action === 'delete') {
      if (!window.confirm(`Are you sure you want to delete the trip "${trip.name}"?`)) {
        return;
      }
      try {
        const response = await fetch(`/api/trips/${encodeURIComponent(tripId)}`, {
          method: 'DELETE'
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || 'Failed to delete trip.');
        }
        tripsMap.delete(tripId);
        renderList();
        showMessage(`Trip "${trip.name}" was deleted.`);
      } catch (error) {
        showMessage(error.message, true);
      }
    }
  });

  (async () => {
    await loadAuxiliaryData();
    await loadTrips();
  })();
});
