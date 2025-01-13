socket.on('ntp-error', (data) => {
    const resultDiv = document.getElementById('result');
    resultDiv.innerText = `Error: ${data.message}`;
    resultDiv.style.color = 'red';
});
