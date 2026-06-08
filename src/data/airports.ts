import { Airport } from "@/types";

export const BRAZILIAN_AIRPORTS: Airport[] = [
  // ── BRASIL ──────────────────────────────────────────────────────────────────
  { icao: "SBGR", iata: "GRU", name: "Aeroporto Internacional de Guarulhos", city: "Guarulhos", country: "Brasil", lat: -23.4356, lon: -46.4731, elevation: 750, timezoneOffset: -3 },
  { icao: "SBKP", iata: "VCP", name: "Aeroporto Internacional de Viracopos", city: "Campinas", country: "Brasil", lat: -23.0074, lon: -47.1345, elevation: 660, timezoneOffset: -3 },
  { icao: "SBGL", iata: "GIG", name: "Aeroporto Internacional do Galeão", city: "Rio de Janeiro", country: "Brasil", lat: -22.8099, lon: -43.2506, elevation: 9, timezoneOffset: -3 },
  { icao: "SBBR", iata: "BSB", name: "Aeroporto Internacional de Brasília", city: "Brasília", country: "Brasil", lat: -15.8711, lon: -47.9186, elevation: 1066, timezoneOffset: -3 },
  { icao: "SBPA", iata: "POA", name: "Aeroporto Internacional Salgado Filho", city: "Porto Alegre", country: "Brasil", lat: -29.9944, lon: -51.1713, elevation: 3, timezoneOffset: -3 },
  { icao: "SBCT", iata: "CWB", name: "Aeroporto Internacional Afonso Pena", city: "Curitiba", country: "Brasil", lat: -25.5285, lon: -49.1758, elevation: 911, timezoneOffset: -3 },
  { icao: "SBSV", iata: "SSA", name: "Aeroporto Internacional de Salvador", city: "Salvador", country: "Brasil", lat: -12.9086, lon: -38.3224, elevation: 20, timezoneOffset: -3 },
  { icao: "SBRF", iata: "REC", name: "Aeroporto Internacional do Recife", city: "Recife", country: "Brasil", lat: -8.1265, lon: -34.9231, elevation: 10, timezoneOffset: -3 },
  { icao: "SBFZ", iata: "FOR", name: "Aeroporto Internacional Pinto Martins", city: "Fortaleza", country: "Brasil", lat: -3.7762, lon: -38.5326, elevation: 25, timezoneOffset: -3 },
  { icao: "SBEG", iata: "MAO", name: "Aeroporto Internacional Eduardo Gomes", city: "Manaus", country: "Brasil", lat: -3.0386, lon: -60.05, elevation: 84, timezoneOffset: -4 },
  { icao: "SBBE", iata: "BEL", name: "Aeroporto Internacional Val-de-Cans", city: "Belém", country: "Brasil", lat: -1.3793, lon: -48.4762, elevation: 16, timezoneOffset: -3 },
  { icao: "SBFL", iata: "FLN", name: "Aeroporto Internacional Hercílio Luz", city: "Florianópolis", country: "Brasil", lat: -27.6703, lon: -48.5525, elevation: 5, timezoneOffset: -3 },

  // ── AMÉRICA DO NORTE ────────────────────────────────────────────────────────
  { icao: "KJFK", iata: "JFK", name: "John F. Kennedy International Airport", city: "New York", country: "EUA", lat: 40.6413, lon: -73.7781, elevation: 4, timezoneOffset: -5 },
  { icao: "KLAX", iata: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", country: "EUA", lat: 33.9425, lon: -118.4081, elevation: 38, timezoneOffset: -8 },
  { icao: "KORD", iata: "ORD", name: "O'Hare International Airport", city: "Chicago", country: "EUA", lat: 41.9742, lon: -87.9073, elevation: 202, timezoneOffset: -6 },
  { icao: "KATL", iata: "ATL", name: "Hartsfield-Jackson Atlanta International", city: "Atlanta", country: "EUA", lat: 33.6367, lon: -84.4281, elevation: 313, timezoneOffset: -5 },
  { icao: "KDFW", iata: "DFW", name: "Dallas/Fort Worth International Airport", city: "Dallas", country: "EUA", lat: 32.8998, lon: -97.0403, elevation: 182, timezoneOffset: -6 },
  { icao: "KSEA", iata: "SEA", name: "Seattle-Tacoma International Airport", city: "Seattle", country: "EUA", lat: 47.4502, lon: -122.3088, elevation: 131, timezoneOffset: -8 },
  { icao: "KMIA", iata: "MIA", name: "Miami International Airport", city: "Miami", country: "EUA", lat: 25.7959, lon: -80.287, elevation: 3, timezoneOffset: -5 },
  { icao: "KSFO", iata: "SFO", name: "San Francisco International Airport", city: "San Francisco", country: "EUA", lat: 37.6213, lon: -122.379, elevation: 4, timezoneOffset: -8 },
  { icao: "KBOS", iata: "BOS", name: "Logan International Airport", city: "Boston", country: "EUA", lat: 42.3656, lon: -71.0096, elevation: 6, timezoneOffset: -5 },
  { icao: "KIAD", iata: "IAD", name: "Washington Dulles International Airport", city: "Washington D.C.", country: "EUA", lat: 38.9531, lon: -77.4565, elevation: 92, timezoneOffset: -5 },
  { icao: "CYYZ", iata: "YYZ", name: "Toronto Pearson International Airport", city: "Toronto", country: "Canadá", lat: 43.6772, lon: -79.6306, elevation: 173, timezoneOffset: -5 },
  { icao: "CYVR", iata: "YVR", name: "Vancouver International Airport", city: "Vancouver", country: "Canadá", lat: 49.1947, lon: -123.1792, elevation: 4, timezoneOffset: -8 },
  { icao: "CYMX", iata: "YUL", name: "Montréal-Trudeau International Airport", city: "Montreal", country: "Canadá", lat: 45.4706, lon: -73.7408, elevation: 36, timezoneOffset: -5 },
  { icao: "MMMX", iata: "MEX", name: "Aeropuerto Internacional Benito Juárez", city: "Cidade do México", country: "México", lat: 19.4363, lon: -99.0721, elevation: 2230, timezoneOffset: -6 },
  { icao: "MPTO", iata: "PTY", name: "Aeropuerto Internacional de Tocumen", city: "Cidade do Panamá", country: "Panamá", lat: 9.0713, lon: -79.3835, elevation: 34, timezoneOffset: -5 },

  // ── AMÉRICA DO SUL ──────────────────────────────────────────────────────────
  { icao: "SAEZ", iata: "EZE", name: "Aeropuerto Internacional Ministro Pistarini", city: "Buenos Aires", country: "Argentina", lat: -34.8222, lon: -58.5358, elevation: 20, timezoneOffset: -3 },
  { icao: "SCEL", iata: "SCL", name: "Aeropuerto Internacional Arturo Merino Benítez", city: "Santiago", country: "Chile", lat: -33.3928, lon: -70.7858, elevation: 474, timezoneOffset: -4 },
  { icao: "SKBO", iata: "BOG", name: "Aeropuerto Internacional El Dorado", city: "Bogotá", country: "Colômbia", lat: 4.7016, lon: -74.1469, elevation: 2548, timezoneOffset: -5 },
  { icao: "SPJC", iata: "LIM", name: "Aeropuerto Internacional Jorge Chávez", city: "Lima", country: "Peru", lat: -12.0219, lon: -77.1143, elevation: 34, timezoneOffset: -5 },
  { icao: "SEQM", iata: "UIO", name: "Aeropuerto Internacional Mariscal Sucre", city: "Quito", country: "Equador", lat: -0.1292, lon: -78.3575, elevation: 2400, timezoneOffset: -5 },
  { icao: "SVMI", iata: "CCS", name: "Aeropuerto Internacional Simón Bolívar", city: "Caracas", country: "Venezuela", lat: 10.6012, lon: -66.9913, elevation: 72, timezoneOffset: -4 },

  // ── EUROPA ──────────────────────────────────────────────────────────────────
  { icao: "EGLL", iata: "LHR", name: "Heathrow Airport", city: "Londres", country: "Reino Unido", lat: 51.4775, lon: -0.4614, elevation: 25, timezoneOffset: 0 },
  { icao: "LFPG", iata: "CDG", name: "Aéroport Paris-Charles-de-Gaulle", city: "Paris", country: "França", lat: 49.0097, lon: 2.5478, elevation: 119, timezoneOffset: 1 },
  { icao: "EDDF", iata: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "Alemanha", lat: 50.0333, lon: 8.5706, elevation: 111, timezoneOffset: 1 },
  { icao: "EHAM", iata: "AMS", name: "Amsterdam Airport Schiphol", city: "Amsterdam", country: "Países Baixos", lat: 52.3086, lon: 4.7639, elevation: -3, timezoneOffset: 1 },
  { icao: "LEMD", iata: "MAD", name: "Aeropuerto Adolfo Suárez Madrid-Barajas", city: "Madri", country: "Espanha", lat: 40.4719, lon: -3.5626, elevation: 610, timezoneOffset: 1 },
  { icao: "LIRF", iata: "FCO", name: "Aeroporto di Roma-Fiumicino", city: "Roma", country: "Itália", lat: 41.8003, lon: 12.2389, elevation: 4, timezoneOffset: 1 },
  { icao: "EDDM", iata: "MUC", name: "Munich Airport", city: "Munique", country: "Alemanha", lat: 48.3537, lon: 11.786, elevation: 453, timezoneOffset: 1 },
  { icao: "LEBL", iata: "BCN", name: "Aeropuerto de Barcelona-El Prat", city: "Barcelona", country: "Espanha", lat: 41.2971, lon: 2.0785, elevation: 4, timezoneOffset: 1 },
  { icao: "LTFM", iata: "IST", name: "Istanbul Airport", city: "Istambul", country: "Turquia", lat: 41.2608, lon: 28.7418, elevation: 99, timezoneOffset: 3 },
  { icao: "LSZH", iata: "ZRH", name: "Zurich Airport", city: "Zurique", country: "Suíça", lat: 47.4647, lon: 8.5492, elevation: 432, timezoneOffset: 1 },
  { icao: "LOWW", iata: "VIE", name: "Vienna International Airport", city: "Viena", country: "Áustria", lat: 48.1103, lon: 16.5697, elevation: 183, timezoneOffset: 1 },
  { icao: "EIDW", iata: "DUB", name: "Dublin Airport", city: "Dublin", country: "Irlanda", lat: 53.4213, lon: -6.2701, elevation: 74, timezoneOffset: 0 },
  { icao: "LPPT", iata: "LIS", name: "Aeroporto Humberto Delgado", city: "Lisboa", country: "Portugal", lat: 38.7742, lon: -9.1342, elevation: 114, timezoneOffset: 0 },
  { icao: "EKCH", iata: "CPH", name: "Copenhagen Airport", city: "Copenhague", country: "Dinamarca", lat: 55.6180, lon: 12.6560, elevation: 5, timezoneOffset: 1 },
  { icao: "ESSA", iata: "ARN", name: "Stockholm Arlanda Airport", city: "Estocolmo", country: "Suécia", lat: 59.6519, lon: 17.9186, elevation: 42, timezoneOffset: 1 },
  { icao: "EFHK", iata: "HEL", name: "Helsinki-Vantaa Airport", city: "Helsinque", country: "Finlândia", lat: 60.3172, lon: 24.9633, elevation: 55, timezoneOffset: 2 },
  { icao: "UUEE", iata: "SVO", name: "Sheremetyevo International Airport", city: "Moscou", country: "Rússia", lat: 55.9726, lon: 37.4146, elevation: 190, timezoneOffset: 3 },
  { icao: "EPWA", iata: "WAW", name: "Warsaw Chopin Airport", city: "Varsóvia", country: "Polônia", lat: 52.1657, lon: 20.9671, elevation: 110, timezoneOffset: 1 },
  { icao: "LKPR", iata: "PRG", name: "Václav Havel Airport Prague", city: "Praga", country: "Rep. Tcheca", lat: 50.1008, lon: 14.26, elevation: 380, timezoneOffset: 1 },
  { icao: "EBBR", iata: "BRU", name: "Brussels Airport", city: "Bruxelas", country: "Bélgica", lat: 50.9014, lon: 4.4844, elevation: 58, timezoneOffset: 1 },
  { icao: "LGAV", iata: "ATH", name: "Athens International Airport", city: "Atenas", country: "Grécia", lat: 37.9364, lon: 23.9445, elevation: 94, timezoneOffset: 2 },

  // ── ORIENTE MÉDIO ───────────────────────────────────────────────────────────
  { icao: "OMDB", iata: "DXB", name: "Dubai International Airport", city: "Dubai", country: "Emirados", lat: 25.2528, lon: 55.3644, elevation: 19, timezoneOffset: 4 },
  { icao: "OOMS", iata: "MCT", name: "Muscat International Airport", city: "Mascate", country: "Omã", lat: 23.5933, lon: 58.2844, elevation: 48, timezoneOffset: 4 },
  { icao: "OTHH", iata: "DOH", name: "Hamad International Airport", city: "Doha", country: "Catar", lat: 25.2731, lon: 51.6081, elevation: 13, timezoneOffset: 3 },
  { icao: "OMAA", iata: "AUH", name: "Abu Dhabi International Airport", city: "Abu Dhabi", country: "Emirados", lat: 24.4330, lon: 54.6511, elevation: 27, timezoneOffset: 4 },
  { icao: "OERK", iata: "RUH", name: "King Khalid International Airport", city: "Riade", country: "Arábia Saudita", lat: 24.9578, lon: 46.6989, elevation: 614, timezoneOffset: 3 },
  { icao: "LLBG", iata: "TLV", name: "Ben Gurion International Airport", city: "Tel Aviv", country: "Israel", lat: 32.0114, lon: 34.8867, elevation: 41, timezoneOffset: 2 },

  // ── ÁSIA ────────────────────────────────────────────────────────────────────
  { icao: "WSSS", iata: "SIN", name: "Singapore Changi Airport", city: "Singapura", country: "Singapura", lat: 1.3644, lon: 103.9915, elevation: 7, timezoneOffset: 8 },
  { icao: "VHHH", iata: "HKG", name: "Hong Kong International Airport", city: "Hong Kong", country: "Hong Kong", lat: 22.3080, lon: 113.9185, elevation: 9, timezoneOffset: 8 },
  { icao: "RJTT", iata: "HND", name: "Tokyo Haneda Airport", city: "Tóquio", country: "Japão", lat: 35.5494, lon: 139.7798, elevation: 6, timezoneOffset: 9 },
  { icao: "RKSI", iata: "ICN", name: "Incheon International Airport", city: "Seul", country: "Coreia do Sul", lat: 37.4602, lon: 126.4407, elevation: 7, timezoneOffset: 9 },
  { icao: "ZSPD", iata: "PVG", name: "Shanghai Pudong International Airport", city: "Xangai", country: "China", lat: 31.1434, lon: 121.8052, elevation: 4, timezoneOffset: 8 },
  { icao: "ZBAA", iata: "PEK", name: "Beijing Capital International Airport", city: "Pequim", country: "China", lat: 40.0799, lon: 116.6031, elevation: 35, timezoneOffset: 8 },
  { icao: "VTBS", iata: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "Tailândia", lat: 13.6811, lon: 100.7475, elevation: 2, timezoneOffset: 7 },
  { icao: "WMKK", iata: "KUL", name: "Kuala Lumpur International Airport", city: "Kuala Lumpur", country: "Malásia", lat: 2.7456, lon: 101.7072, elevation: 21, timezoneOffset: 8 },
  { icao: "VIDP", iata: "DEL", name: "Indira Gandhi International Airport", city: "Nova Délhi", country: "Índia", lat: 28.5562, lon: 77.1, elevation: 237, timezoneOffset: 5.5 },
  { icao: "VABB", iata: "BOM", name: "Chhatrapati Shivaji Maharaj International Airport", city: "Mumbai", country: "Índia", lat: 19.0888, lon: 72.8678, elevation: 11, timezoneOffset: 5.5 },
  { icao: "WADD", iata: "DPS", name: "Ngurah Rai International Airport", city: "Bali", country: "Indonésia", lat: -8.7482, lon: 115.1672, elevation: 14, timezoneOffset: 8 },
  { icao: "WIII", iata: "CGK", name: "Soekarno-Hatta International Airport", city: "Jacarta", country: "Indonésia", lat: -6.1256, lon: 106.6559, elevation: 8, timezoneOffset: 7 },
  { icao: "VOMM", iata: "MAA", name: "Chennai International Airport", city: "Chennai", country: "Índia", lat: 12.9900, lon: 80.1693, elevation: 16, timezoneOffset: 5.5 },
  { icao: "RCTP", iata: "TPE", name: "Taiwan Taoyuan International Airport", city: "Taipei", country: "Taiwan", lat: 25.0777, lon: 121.2328, elevation: 33, timezoneOffset: 8 },
  { icao: "ZGGG", iata: "CAN", name: "Guangzhou Baiyun International Airport", city: "Guangzhou", country: "China", lat: 23.3924, lon: 113.2988, elevation: 15, timezoneOffset: 8 },

  // ── OCEANIA ─────────────────────────────────────────────────────────────────
  { icao: "YSSY", iata: "SYD", name: "Sydney Kingsford Smith Airport", city: "Sydney", country: "Austrália", lat: -33.9461, lon: 151.1772, elevation: 6, timezoneOffset: 10 },
  { icao: "YMML", iata: "MEL", name: "Melbourne Airport", city: "Melbourne", country: "Austrália", lat: -37.6733, lon: 144.8433, elevation: 132, timezoneOffset: 10 },
  { icao: "YBBN", iata: "BNE", name: "Brisbane Airport", city: "Brisbane", country: "Austrália", lat: -27.3842, lon: 153.1175, elevation: 4, timezoneOffset: 10 },
  { icao: "NZAA", iata: "AKL", name: "Auckland Airport", city: "Auckland", country: "Nova Zelândia", lat: -37.0082, lon: 174.7917, elevation: 7, timezoneOffset: 12 },

  // ── ÁFRICA ──────────────────────────────────────────────────────────────────
  { icao: "FAOR", iata: "JNB", name: "O.R. Tambo International Airport", city: "Joanesburgo", country: "África do Sul", lat: -26.1392, lon: 28.2460, elevation: 1694, timezoneOffset: 2 },
  { icao: "HECA", iata: "CAI", name: "Cairo International Airport", city: "Cairo", country: "Egito", lat: 30.1219, lon: 31.4056, elevation: 116, timezoneOffset: 2 },
  { icao: "HAAB", iata: "ADD", name: "Addis Ababa Bole International Airport", city: "Adis Abeba", country: "Etiópia", lat: 8.9778, lon: 38.7993, elevation: 2334, timezoneOffset: 3 },
  { icao: "HKJK", iata: "NBO", name: "Jomo Kenyatta International Airport", city: "Nairóbi", country: "Quênia", lat: -1.3192, lon: 36.9275, elevation: 1624, timezoneOffset: 3 },
  { icao: "GMMN", iata: "CMN", name: "Mohammed V International Airport", city: "Casablanca", country: "Marrocos", lat: 33.3675, lon: -7.5897, elevation: 206, timezoneOffset: 1 },
  { icao: "DAAG", iata: "ALG", name: "Houari Boumediene Airport", city: "Argel", country: "Argélia", lat: 36.6910, lon: 3.2154, elevation: 25, timezoneOffset: 1 },
  { icao: "FMMI", iata: "TNR", name: "Ivato International Airport", city: "Antananarivo", country: "Madagascar", lat: -18.7969, lon: 47.4788, elevation: 1278, timezoneOffset: 3 },
];

export const ALL_AIRPORTS: Airport[] = BRAZILIAN_AIRPORTS;

export const AIRPORTS_BY_ICAO: Record<string, Airport> = Object.fromEntries(
  BRAZILIAN_AIRPORTS.map((a) => [a.icao, a])
);
