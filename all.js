let results;
let failedResults = [];
let bearerToken;

function openFile() {
  console.log("test");
  const fileInput = document.getElementById('fileInput');
  fileInput.click();
}

async function processFile(contents) {
  const workbook = XLSX.read(contents, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  return processData(data);
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    const outputDiv = document.getElementById('output');
  
    if (file) {
      const reader = new FileReader();
  
      reader.onload = function(e) {
        const contents = e.target.result;
        const workbook = XLSX.read(contents, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
        results = processData(data); // Populate results here
        console.log('Results:', results); // Ensure results are populated
  
        outputDiv.textContent = JSON.stringify(results, null, 2);
  
      };
  
      reader.readAsArrayBuffer(file);
    } else {
      outputDiv.textContent = 'No file selected.';
    }
  }

function processData(data) {
  const sessionIds = data[0];
  const result = {};

  for (let i = 1; i < data.length; i++) {
    const ticketIds = data[i];
    for (let j = 0; j < ticketIds.length; j++) {
      const sessionId = sessionIds[j];
      const ticketId = ticketIds[j];

      if (sessionId) {
        if (!result[sessionId]) {
          result[sessionId] = [];
        }
        result[sessionId].push(ticketId);
      }
    }
  }

  return result;
}

// ==========================================================================================================================================

async function runSendAPIRequests() {
    try {
      bearerToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ikp2ZnlwclFjeDd1WUxrX2RNdVhyVCJ9.eyJodHRwczovL2JpenphYm8uY29tL2FjY291bnQvaWQiOiIxNzE0NDUiLCJodHRwczovL2JpenphYm8uY29tL2FjY291bnQvYXBpS2V5IjoieFpQckE2MVF6eHdUcmovMTJmVHUzMUZYM2YyaWJkVjljUk1KQU5EZWUvZFJ5MGlFUWp2R1M5M0VoTjNCbThqKzNwZy9meGh2T09NUUxMQllpdXlMRGYzV25IWTJDSXltUnAwcHFrUXZZZmFyRkthVSIsImh0dHBzOi8vYml6emFiby5jb20vcHJpbmNpcGFsL2F1dGhpbmZvIjp7ImF1dGhSZWFsbSI6eyJ0eXBlIjoiTUFDSElORSJ9fSwiaXNzIjoiaHR0cHM6Ly9hdXRoLmJpenphYm8uY29tLyIsInN1YiI6ImxZRjF0SnFucFcycVRyRENTdkJFQjc2d0dZQVU5aWRSQGNsaWVudHMiLCJhdWQiOiJodHRwczovL2FwaS5iaXp6YWJvLmNvbS9hcGkiLCJpYXQiOjE2OTc0NjI5NjcsImV4cCI6MTY5NzU0OTM2NywiYXpwIjoibFlGMXRKcW5wVzJxVHJEQ1N2QkVCNzZ3R1lBVTlpZFIiLCJndHkiOiJjbGllbnQtY3JlZGVudGlhbHMifQ.PY2yUV3FsBFMAmFuXXfu-nvCZZwo7BnXb3IeZsUyT_5-vH7kPppSNuKscxnkDsPUeMBh0sHKI1IVItQye0yeuBDiMu-2xSBD2_Zo0Eb3FMD-r6COzFsch6Ywv_dOBly6y3dU-EjPQgIj12gfbWy08Y7SFFys2AOoUx8QZZbzHTGrEvLgcDDBxeWZaFCJkOWqihMZsbUbGdLhTML7nEhswTeb9NThFBY3wFStoIcvw4Qrdd61CDS4gf_wROLbEYVj9cYKpr3D5vFIdHdMPzm66oghr61Tkk4rETVMCqGdEv7TuU1uiNb5-Wf1MR446nCIT_m7onqQ4s288iDldffM_g';
      console.log('Bearer Token1:', bearerToken);
  
      const eventId = document.getElementById('eventId').value;
  
      // Check if results is not null or undefined
      if (results && Object.keys(results).length > 0) {
        await Promise.all(Object.keys(results).map(sessionId =>
          Promise.all(results[sessionId].map(async ticketId => {
            const url = `https://api.bizzabo.com/v1/events/${eventId}/agenda/sessions/${sessionId}/registrations/${ticketId}`;
            try {
              const response = await sendRequest(url, bearerToken);
              displayResult(url, response.status, response.statusText);
            } catch (error) {
              displayResult(url, 'Error', error.message);
              failedResults.push({ sessionId, ticketId });
            }
          }))
        ));
      } else {
        console.error('Results object is empty or undefined.');
      }
  
      setTimeout(() => {
        const saveToExcel = confirm('Do you want to save the failed results to an Excel file?');
        if (saveToExcel) {
          saveFailedResultsToExcel();
        }
      }, 2000);
    } catch (error) {
      console.error('Error running API requests:', error);
    }
  }

async function sendRequest(url, bearerToken) {
  const headers = {
    'Authorization': 'Bearer ${bearerToken}',
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    method: 'PUT',
    headers: headers,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response;
}

function displayResult(url, status, statusText) {
    const outputTextarea = document.getElementById('output');
    outputTextarea.value += `URL: ${url}, Status: ${status} - ${statusText}\n`;
}
  

function saveFailedResultsToExcel() {
  const headers = ['Session ID', 'Ticket ID'];
  const data = failedResults.map(({ sessionId, ticketId }) => [sessionId, ticketId]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Failed Results');
  const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  saveAsExcelFile(excelBuffer, 'failed_results.xlsx');
}

function saveAsExcelFile(buffer, fileName) {
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
}

async function getAccessToken(client_id, client_secret, account_id) {
  const url = 'https://auth.bizzabo.com/oauth/token';
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  const payload = {
    grant_type: 'client_credentials',
    client_id: client_id,
    client_secret: client_secret,
    audience: 'https://api.bizzabo.com/api',
    account_id: account_id
  };

  try {
    const response = await axios.post(url, new URLSearchParams(payload), {
      headers: headers
    });

    if (response.status === 200) {
      return response.data.access_token;
    } else {
      return '';
    }
  } catch (error) {
    console.error('Error getting access token:', error);
    return '';
  }
}

async function getToken() {
    const clientId = document.getElementById('clientId').value;
    const clientSecret = document.getElementById('clientSecret').value;
    const accountId = document.getElementById('accountId').value;

    accessToken = await getAccessToken(clientId, clientSecret, accountId);

    const outputTextarea = document.getElementById('outputToken');
    outputTextarea.value = accessToken;
}
