// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract CarRental {
    struct Car {
        uint id;
        string model;
        uint price;
        bool isAvailable;
    }

    mapping(uint => Car) public cars;
    mapping(uint => address) public carRenter;
    uint public carCount = 0;

    event CarAdded(uint id, string model, uint price);
    event CarRented(uint id, address renter, uint amount);

    constructor() {
        string[40] memory carModels = [
            "Toyota Supra", "Nissan GT-R", "Chevrolet Camaro", "Ford Mustang", "Dodge Charger",
            "BMW M3", "Audi R8", "Mercedes AMG GT", "Porsche 911", "Lamborghini Huracan",
            "Ferrari 488", "McLaren 720S", "Aston Martin DB11", "Jaguar F-Type", "Mazda RX-7",
            "Subaru WRX", "Honda NSX", "Tesla Model S", "Koenigsegg Agera", "Bugatti Chiron",
            "Pagani Huayra", "Lexus LC500", "Alfa Romeo Giulia", "Volkswagen Golf GTI",
            "Mitsubishi Lancer Evo", "Hyundai Veloster N", "Kia Stinger", "Ford Focus RS",
            "Chevrolet Corvette", "Dodge Viper", "Ferrari F40", "Lamborghini Aventador",
            "Bentley Continental GT", "Rolls-Royce Wraith", "Mini Cooper S", "Jeep Grand Cherokee",
            "Range Rover Sport", "Volvo XC90", "Tesla Model X", "Porsche Cayenne"
        ];

        for (uint i = 0; i < 40; i++) {
            uint price = (uint(keccak256(abi.encodePacked(block.timestamp, i))) % 41 + 10) * 1 ether; 
            addCar(carModels[i], price);
        }
    }

    function addCar(string memory _model, uint _price) public {
        carCount++;
        cars[carCount] = Car(carCount, _model, _price, true);
        emit CarAdded(carCount, _model, _price);
    }

    function rentCar(uint _id) public payable {
        require(_id > 0 && _id <= carCount, "Car ID is invalid");
        Car storage car = cars[_id];

        require(car.isAvailable, "Car is not available");
        require(msg.value >= car.price, "Insufficient payment");

        car.isAvailable = false; // Marcar como alquilado
        carRenter[_id] = msg.sender;

        emit CarRented(_id, msg.sender, msg.value);
    }

    function getCarDetails(uint _id) public view returns (string memory, uint, bool) {
        require(_id > 0 && _id <= carCount, "Car ID is invalid");
        Car memory car = cars[_id];
        return (car.model, car.price, car.isAvailable);
    }

    function checkAvailability(uint _id) public view returns (bool) {
        require(_id > 0 && _id <= carCount, "Car ID is invalid");
        return cars[_id].isAvailable;
    }
}

