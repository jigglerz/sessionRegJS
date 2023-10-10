function uploadFile() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];  // Get the selected file

  if (!file) {
    console.error('No file selected.');
    return;
  }

  const reader = new FileReader();

  reader.onload = function(event) {
    const contents = event.target.result;
    parseCSV(contents);
  };

  // Read the file as text
  reader.readAsText(file);
}

function parseCSV(contents) {
  Papa.parse(contents, {
    header: true,
    complete: function(results) {
      // Extract session IDs and ticket numbers
      const data = {};
      results.data.forEach(row => {
        const sessionId = row['Session ID'];
        if (!sessionId) {
          console.error('Row without Session ID found:', row);
          return;
        }

        // Remove 'Session ID' key from the row
        delete row['Session ID'];

        // Extract ticket numbers
        const ticketNumbers = Object.values(row).filter(value => value);
        
        // Add session ID and ticket numbers to the data dictionary
        if (!(sessionId in data)) {
          data[sessionId] = [];
        }
        data[sessionId].push(...ticketNumbers);
      });

      // Log the parsed data
      console.log('Parsed data:', data);
    }
  });
}
