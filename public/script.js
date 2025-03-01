// TODO: Wire up the app's behavior here.
document.addEventListener('DOMContentLoaded', () => {
  const themeSwitch = document.getElementById('themeSwitch');
  const courseSelect = document.getElementById('course');
  const uvuIdInput = document.getElementById('uvuId');
  const logsContainer = document.querySelector('[data-cy="logs"]');
  const uvuIdDisplay = document.getElementById('uvuIdDisplay');
  const logTextarea = document.querySelector('[data-cy="log_textarea"]');
  const addLogBtn = document.querySelector('[data-cy="add_log_btn"]');

  const BASE_URL = 'http://localhost:3000';

  //theme dark/light
  function getUserPref() {
    return localStorage.getItem('theme') || 'unknown';
  }

  function getBrowserPref() {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches)
      return 'dark';
    if (window.matchMedia('(prefers-color-scheme: light)').matches)
      return 'light';
    return 'unknown';
  }

  function getOSPref() {
    return window.matchMedia ? getBrowserPref() : 'unknown';
  }

  function applyTheme(theme) {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    themeSwitch.checked = theme === 'dark';
  }

  let userPref = getUserPref();
  let browserPref = getBrowserPref();
  let osPref = getOSPref();
  let finalTheme =
    userPref !== 'unknown'
      ? userPref
      : browserPref !== 'unknown'
      ? browserPref
      : osPref !== 'unknown'
      ? osPref
      : 'light';

  console.log(`User Pref: ${userPref}`);
  console.log(`Browser Pref: ${browserPref}`);
  console.log(`OS Pref: ${osPref}`);

  applyTheme(finalTheme);

  themeSwitch.addEventListener('change', () => {
    const newTheme = themeSwitch.checked ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
    console.log(`User Pref: ${userPref}`);
    console.log(`Browser Pref: ${browserPref}`);
    console.log(`OS Pref: ${osPref}`);
  });

  //Fetch course list and populate the select dropdown

  async function fetchCourses() {
    try {
      const response = await axios.get(`${BASE_URL}/courses`);
      courseSelect.innerHTML =
        '<option selected value="">Choose Course</option>';
      response.data.forEach((course) => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = course.display;
        courseSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  }

  //Fetch logs based on the selected course and valid UVU ID

  async function fetchLogs(courseId, uvuId) {
    try {
      const response = await axios.get(`${BASE_URL}/logs`, {
        params: { courseId, uvuId },
      });
      displayLogs(response.data, uvuId);
    } catch (error) {
      logsContainer.innerHTML = `<li style="color: red;">Error fetching logs.</li>`;
      console.error('Error loading logs:', error);
    }
  }

  //Display fetched logs in the UI

  function displayLogs(logs, uvuId) {
    logsContainer.innerHTML = '';
    uvuIdDisplay.textContent = `Student Logs for ${uvuId}`;

    logs.forEach((log) => {
      const listItem = document.createElement('li');
      listItem.innerHTML = `
        <div><small>${log.date}</small></div>
        <pre><p>${log.text}</p></pre>
      `;
      listItem.addEventListener('click', () => {
        const logText = listItem.querySelector('pre');
        logText.style.display =
          logText.style.display === 'none' ? 'block' : 'none';
      });
      logsContainer.appendChild(listItem);
    });

    logTextarea.disabled = false;
    addLogBtn.disabled = logTextarea.value.trim() === '';
  }

  //Handle course selection logic

  courseSelect.addEventListener('change', () => {
    if (courseSelect.value) {
      uvuIdInput.disabled = false;
    } else {
      uvuIdInput.value = '';
      uvuIdInput.disabled = true;
      logsContainer.innerHTML = '';
      logTextarea.disabled = true;
      addLogBtn.disabled = true;
    }
  });

  //Handle UVU ID input logic

  uvuIdInput.addEventListener('input', () => {
    let inputVal = uvuIdInput.value.replace(/\D/g, '').slice(0, 8);
    uvuIdInput.value = inputVal;

    if (inputVal.length === 8) {
      fetchLogs(courseSelect.value, inputVal);
    } else {
      logsContainer.innerHTML = '';
      logTextarea.disabled = true;
      addLogBtn.disabled = true;
    }
  });

  //Enable/disable Add Log button based on textarea input

  logTextarea.addEventListener('input', () => {
    addLogBtn.disabled = logTextarea.value.trim() === '';
  });

  //Submit new log

  addLogBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    if (addLogBtn.disabled) return;

    const newLog = {
      courseId: courseSelect.value,
      uvuId: uvuIdInput.value,
      text: logTextarea.value.trim(),
      date: new Date().toLocaleString(),
    };

    try {
      const response = await fetch(`${BASE_URL}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog),
      });

      if (!response.ok) throw new Error('Failed to add log.');
      logTextarea.value = '';
      addLogBtn.disabled = true;
      fetchLogs(newLog.courseId, newLog.uvuId);
    } catch (error) {
      console.error('Error adding log:', error);
    }
  });

  fetchCourses();
});
