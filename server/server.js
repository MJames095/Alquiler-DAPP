const express = require('express');
const bodyParser = require('body-parser');
const { ethers } = require('ethers');
const app = express();

app.use(bodyParser.json());
app.use(express.static('client')); // Servir archivos estáticos

// Conectarse a Ganache
let provider;
try {
    provider = new ethers.JsonRpcProvider('http://127.0.0.1:7545');
    console.log('Connected to Ganache on http://127.0.0.1:7545');
} catch (error) {
    console.error('Error connecting to Ganache:', error.message);
    process.exit(1);
}

// Ruta para autenticar DID y firma
app.post('/auth', async (req, res) => {
    const { address, did, signature } = req.body;

    try {
        // Mensaje original que se firmó
        const message = `Authenticate as ${address}`;

        // Verificar la firma del mensaje
        const recoveredAddress = ethers.verifyMessage(message, signature);

        if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
            console.log('Firma verificada, autenticación exitosa.');

            // (Opcional) Emitir una Verifiable Credential (VC)
            const verifiableCredential = {
                "@context": ["https://www.w3.org/2018/credentials/v1"],
                "type": ["VerifiableCredential"],
                "issuer": did,
                "credentialSubject": {
                    "id": did,
                    "walletAddress": address
                }
            };

            // Aquí se puede firmar la VC o simplemente devolverla
            res.json({ success: true, credential: verifiableCredential });
        } else {
            res.json({ success: false, message: 'Signature verification failed' });
        }
    } catch (error) {
        console.error('Error during verification:', error);
        res.status(500).json({ success: false, message: 'Error during verification' });
    }
});

// Ruta para obtener el balance basado en el DID del usuario
app.get('/balance/:did', async (req, res) => {
    const { did } = req.params;

    try {
        // Extraer la dirección Ethereum del DID (asumiendo que el formato es 'did:ethr:{address}')
        const address = did.split(':')[2];  // La dirección está en la tercera parte del DID

        // Obtener el balance de la cuenta de Ethereum
        const balance = await provider.getBalance(address);

        // Convertir el balance a ETH legible
        const balanceInEth = ethers.formatEther(balance);

        res.json({ success: true, address: address, balance: balanceInEth });
    } catch (error) {
        console.error('Error fetching balance:', error);
        res.status(500).json({ success: false, message: 'Error fetching balance' });
    }
});

// Añadir una nueva ruta para manejar el cierre de sesión
app.post('/logout', (req, res) => {
    // Aquí se maneja cualquier lógica de cierre de sesión necesaria (limpiar sesiones, cookies, etc.)
    
    console.log('El usuario ha cerrado sesión exitosamente.');

    // Devolver una respuesta exitosa en formato JSON
    res.json({ success: true, message: 'Logout successful' });
});


// Iniciar servidor
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
