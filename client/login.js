document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const MAX_ATTEMPTS = 3;
    const LOCKOUT_TIME = 30000; // 30 segundos de bloqueo

    // Función para crear una ventana emergente personalizada
    function createPopup(message) {
        let popup = document.createElement('div');
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.padding = '20px';
        popup.style.backgroundColor = 'white';
        popup.style.border = '1px solid #ccc';
        popup.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
        popup.style.zIndex = '1000';
        popup.style.textAlign = 'center';
        popup.style.fontFamily = 'Arial, sans-serif';

        popup.innerHTML = `<p>${message}</p>`;

        let button = document.createElement('button');
        button.innerText = 'OK';
        button.onclick = function () {
            document.body.removeChild(popup);  // Cerrar la ventana emergente
        };

        popup.appendChild(button);
        document.body.appendChild(popup);
    }

    function getFailedAttempts() {
        return parseInt(localStorage.getItem('failedAttempts') || '0');
    }

    function incrementFailedAttempts() {
        let attempts = getFailedAttempts();
        attempts += 1;
        localStorage.setItem('failedAttempts', attempts);

        if (attempts >= MAX_ATTEMPTS) {
            localStorage.setItem('lockout', Date.now());
        }
    }

    function isLockedOut() {
        const lockoutTime = parseInt(localStorage.getItem('lockout') || '0');
        if (lockoutTime && Date.now() - lockoutTime < LOCKOUT_TIME) {
            return true;
        }
        return false;
    }

    function resetFailedAttempts() {
        localStorage.removeItem('failedAttempts');
        localStorage.removeItem('lockout');
    }

    // Verificar si el usuario ya está autenticado
    const userDID = localStorage.getItem('userDID');
    if (userDID) {
        // Si ya está autenticado, redirigir directamente al dashboard
        window.location.href = 'dashboard.html';
        return;
    }

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (isLockedOut()) {
            createPopup('Too many failed attempts. Please try again later.');
            return;
        }

        const address = document.getElementById('address').value;
        const privateKey = document.getElementById('privateKey').value;

        try {
            // Crear una wallet con ethers.js
            const wallet = new ethers.Wallet(privateKey);

            // Verificar que la dirección proporcionada sea correcta
            if (wallet.address.toLowerCase() !== address.toLowerCase()) {
                incrementFailedAttempts();
                createPopup('Warning. Check your address or your private key and try again.');
                return;
            }

            localStorage.setItem('privateKey', privateKey.trim());

            // Generar un mensaje para firmar
            const message = `Authenticate as ${address}`;
            const signature = await wallet.signMessage(message);

            // Generar el DID a partir de la dirección Ethereum
            const did = `did:ethr:${wallet.address}`;

            // Enviar la firma y el DID al servidor
            const response = await fetch('/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    address: wallet.address,
                    did: did,
                    signature: signature
                })
            });

            const result = await response.json();
            if (result.success) {
                resetFailedAttempts();
                localStorage.setItem('userDID', did);
                window.location.href = 'dashboard.html';  // Redirigir al dashboard
            } else {
                incrementFailedAttempts();
                createPopup('Authentication failed: ' + result.message);
            }
        } catch (error) {
            incrementFailedAttempts();
            createPopup('Error during authentication. Please try again.');
        }
    });
});