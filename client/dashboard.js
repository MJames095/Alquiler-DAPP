const contractABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "string",
            "name": "model",
            "type": "string"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "price",
            "type": "uint256"
          }
        ],
        "name": "CarAdded",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "_id",
            "type": "uint256"
          }
        ],
        "name": "rentCar",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      }
      
];

const contractAddress = '0xc96a108cd7A30154353091752Fcf50807a10ADf3';

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");

// Declarar la clave privada 
const privateKey = localStorage.getItem('privateKey');

// Validar si la clave privada es válida
if (!privateKey || !privateKey.startsWith('0x') || privateKey.length !== 66) {
    alert('Invalid private key. Redirecting to login...');
    window.location.href = 'login.html';
}

// Crear wallet con la clave privada
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

function formatEtherValue(price) {
    return ethers.parseEther(price.toString());
}

document.addEventListener('DOMContentLoaded', async () => {
    const did = localStorage.getItem('userDID'); // Obtener el DID desde el almacenamiento local
    const logoutButton = document.getElementById('logout');

    if (!did) {
        alert('No session found. Redirecting to login...');
        window.location.href = 'login.html';
        return;
    }

    try {
        // Mostrar el DID en el dashboard
        document.getElementById('did').textContent = did;

        // Obtener información del balance desde el servidor
        const response = await fetch(`/balance/${did}`);
        const data = await response.json();

        if (data.success) {
            // Mostrar la dirección y el balance en el dashboard
            document.getElementById('address').textContent = data.address;
            document.getElementById('balance').textContent = data.balance;
        } else {
            alert('Failed to fetch account details.');
        }
    } catch (error) {
        console.error('Error fetching balance:', error);
        alert('Error fetching account details.');
    }

    // Lista de nombres de modelos de autos
    const carModels = [
        'Toyota Supra', 'Nissan GT-R', 'Chevrolet Camaro', 'Ford Mustang', 'Dodge Charger',
        'BMW M3', 'Audi R8', 'Mercedes AMG GT', 'Porsche 911', 'Lamborghini Huracan',
        'Ferrari 488', 'McLaren 720S', 'Aston Martin DB11', 'Jaguar F-Type', 'Mazda RX-7',
        'Subaru WRX', 'Honda NSX', 'Tesla Model S', 'Koenigsegg Agera', 'Bugatti Chiron',
        'Pagani Huayra', 'Lexus LC500', 'Alfa Romeo Giulia', 'Volkswagen Golf GTI',
        'Mitsubishi Lancer Evo', 'Hyundai Veloster N', 'Kia Stinger', 'Ford Focus RS',
        'Chevrolet Corvette', 'Dodge Viper', 'Ferrari F40', 'Lamborghini Aventador',
        'Bentley Continental GT', 'Rolls-Royce Wraith', 'Mini Cooper S', 'Jeep Grand Cherokee',
        'Range Rover Sport', 'Volvo XC90', 'Tesla Model X', 'Porsche Cayenne'
    ];

    // Generar 40 autos disponibles
    const carList = document.getElementById('car-list');
    const cars = [];

    for (let i = 1; i <= 40; i++) {
        const available = Math.random() > 0.5;
        const car = {
            id: i,
            model: carModels[i - 1],
            price: (Math.random() * (50 - 10) + 10).toFixed(3),
            available: available,
            image: `images/cars/car${i}.png`
        };
        cars.push(car);

        const carCard = document.createElement('div');
        carCard.className = 'col-md-3 mb-4';
        carCard.innerHTML = `
            <div class="card">
                <img src="${car.image}" class="card-img-top" alt="Car Image">
                <div class="card-body">
                    <h5 class="card-title">${car.model}</h5>
                    <p class="card-text">Price: ${car.price} ETH</p>
                    <p class="card-text">Available: ${car.available ? '<span style="color:green;">✔ Yes</span>' : '<span style="color:red;">✖ No</span>'}</p>
                    <button class="btn btn-primary rent-btn" data-id="${car.id}" ${!car.available ? 'disabled' : ''}>Rent</button>
                </div>
            </div>
        `;
        carList.appendChild(carCard);
    }

    //Alquilar un auto
    document.querySelectorAll('.rent-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const carId = e.target.getAttribute('data-id');
            const car = cars.find(c => c.id == carId);

            if (!car.available) {
                alert('Car is not available.');
                return;
            }

            const userDID = prompt('Enter your DID:');
            const inputDID = window.confirm(`Is this your DID? ${userDID}`);

            if (!inputDID || userDID !== did) {
                alert('Invalid DID');
                return;
            }

            try {
                const tx = await contract.rentCar(car.id, {
                    value: ethers.parseEther(car.price),
                    gasLimit: 300000
                });
                await tx.wait();

                alert(`${car.model} rented successfully!`);
                car.available = false;
                e.target.disabled = true;
                location.reload();
            } catch (error) {
                console.error('Transaction failed:', error);
                alert('Transaction failed!');
            }
        });
    });

    logoutButton.addEventListener('click', async () => {
        await fetch('/logout', { method: 'POST' });
        localStorage.clear();
        window.location.href = 'login.html';
    });
});
