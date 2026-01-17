/* eslint-disable linebreak-style */
/* eslint-disable new-cap */
const mognoose = require('mongoose');

const carSchema = new mognoose.Schema(
  {
    model: { type: String, required: true },
    maker: { type: String, required: true },
    type: { type: String, required: true },
    seats: { type: Number, required: true, min: 1 },
    displacement: { type: Number }, // "Displacement": 999
    length: { type: Number }, // "Length": 4561
    width: { type: Number }, // "Width": 1752
    height: { type: Number }, // "Height": 1507
    wheelbase: { type: Number }, // "Wheelbase": 2651
    noOfCylinders: { type: Number }, // "No_of_Cylinders": 3
    fuel: { type: String }, // "Fuel": "Petrol"
    engineType: { type: String }, // "Engine Type": "1.0L TSI"
    transmission: { type: String }, // "Transmission": "6-Speed MT"
    frontBrake: { type: String }, // "Front Brake": "Disc"
    rearBrake: { type: String }, // "Rear Brake": "Drum"
    drive: { type: String }, // "Drive": "2WD"
    turningRadius: { type: Number }, // "Turning Radius": 5.05
    fuelTankCapacity: { type: Number }, // "Fuel Tank Capacity": 45
    bootSpace: { type: Number }, // "Boot Space": 521
    fuelEfficiency: { type: Number }, // "Fuel Efficiency": 19.4
    emissionType: { type: String }, // "Emission Type": "BS VI"
    tyreSize: { type: String }, // "Tyre Size": "205/55 R16"
    variants: { type: Number }, // "Variants": 3
    ncapRating: { type: String }, // "NCAP Rating": "Not Tested"
  },
  {
    timestamps: true,
  },
);

const carData = new mognoose.model('Car', carSchema);
module.exports = carData;
