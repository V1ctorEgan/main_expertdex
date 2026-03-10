// config/vehicleTypes.js

const VEHICLE_TYPES = [
  {
    id: "van",
    name: "Vans",
    icon: "🚐",
    description: "Small to medium parcels",
    subtypes: [
      {
        id: "mini_van",
        name: "Mini Van",
        capacity: "1 ton",
        description: "Small parcels, food delivery",
        priceMultiplier: 1.0,
      },
      {
        id: "standard_van",
        name: "Standard Van",
        capacity: "1–1.5 tons",
        description: "Small business deliveries",
        priceMultiplier: 1.2,
      },
      {
        id: "cargo_van",
        name: "Cargo Van",
        capacity: "1.5–2 tons",
        description: "Appliances, boxed goods",
        priceMultiplier: 1.5,
      },
    ],
  },
  {
    id: "pickup",
    name: "Pickup Trucks",
    icon: "🛻",
    description: "Medium to large items",
    subtypes: [
      {
        id: "small_pickup",
        name: "Small Pickup",
        capacity: "1–2 tons",
        description: "Furniture, building materials",
        priceMultiplier: 1.3,
      },
      {
        id: "standard_pickup",
        name: "Standard Pickup",
        capacity: "2–3 tons",
        description: "Heavy equipment, bulk goods",
        priceMultiplier: 1.7,
      },
    ],
  },
  {
    id: "truck",
    name: "Trucks",
    icon: "🚚",
    description: "Heavy and bulk loads",
    subtypes: [
      {
        id: "box_truck",
        name: "Box Truck",
        capacity: "3–5 tons",
        description: "House moving, large deliveries",
        priceMultiplier: 2.0,
      },
      {
        id: "flatbed",
        name: "Flatbed Truck",
        capacity: "5–10 tons",
        description: "Construction, oversized items",
        priceMultiplier: 2.5,
      },
      {
        id: "dyna",
        name: "Dyna Truck",
        capacity: "3–7 tons",
        description: "Commercial goods, warehouse",
        priceMultiplier: 2.2,
      },
    ],
  },
  {
    id: "bike",
    name: "Motorcycles",
    icon: "🏍️",
    description: "Quick small deliveries",
    subtypes: [
      {
        id: "standard_bike",
        name: "Standard Motorcycle",
        capacity: "Up to 50kg",
        description: "Documents, small packages",
        priceMultiplier: 0.5,
      },
      {
        id: "delivery_bike",
        name: "Delivery Motorcycle",
        capacity: "Up to 100kg",
        description: "Food, parcels, express delivery",
        priceMultiplier: 0.7,
      },
    ],
  },
];

// Helper function to get vehicle type info
const getVehicleTypeInfo = (typeId) => {
  return VEHICLE_TYPES.find((type) => type.id === typeId) || null;
};

// Helper function to get subtype info
const getVehicleSubtypeInfo = (typeId, subtypeId) => {
  const type = getVehicleTypeInfo(typeId);
  if (!type) return null;

  return type.subtypes.find((subtype) => subtype.id === subtypeId) || null;
};

// Helper function to validate vehicle type and subtype
const validateVehicleType = (typeId, subtypeId) => {
  const typeInfo = getVehicleTypeInfo(typeId);
  if (!typeInfo) return false;

  const subtypeInfo = typeInfo.subtypes.find((sub) => sub.id === subtypeId);
  return !!subtypeInfo;
};

// Get all vehicle type IDs
const getVehicleTypeIds = () => {
  return VEHICLE_TYPES.map((type) => type.id);
};

module.exports = {
  VEHICLE_TYPES,
  getVehicleTypeInfo,
  getVehicleSubtypeInfo,
  validateVehicleType,
  getVehicleTypeIds,
};
