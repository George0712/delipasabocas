export const environment = {
  production: false,
  supabaseUrl: 'https://ugeywpbymtwojvrcjcdz.supabase.co',
  supabaseAnonKey: 'sb_publishable_miOKonGtvzkYmaL4jtWqOA_Xjo1kDZW',
  whatsappNumber: '573009999999',
  business: {
    name: 'DeliPasabocas',
    city: 'Malambo, Atlántico',
    nequi: '3009999999',
    bancolombiaAccount: '123 456 78910',
    bancolombiaHolder: 'Deli Pasabocas',
    nequiQrImage: '/nequi-qr2.jpeg',
    /** Costo fijo adicional por freír cada bandeja en pedidos para eventos. */
    fryCostPerTray: 5000,
    /** Máximo de bandejas del mismo producto en pedido normal (home). */
    maxTraysPerProduct: 2,
    shipping: {
      origin: {
        lat: 10.859,
        lng: -74.774,
        label: 'DeliPasabocas, Malambo',
      },
      freeRadiusKm: 10,
      malamboReferenceCost: 3500,
      perKmBeyondFree: 450,
      maxCost: 22000,
      roundTo: 500,
    },
  },
};
