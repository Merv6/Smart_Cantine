export interface Arrondissement {
  name: string;
}

export interface Commune {
  name: string;
  arrondissements: string[];
}

export interface Department {
  name: string;
  communes: Commune[];
}

export const BENIN_GEO_DATA: Department[] = [
  {
    name: "Atlantique",
    communes: [
      {
        name: "Abomey-Calavi",
        arrondissements: ["Abomey-Calavi", "Akassato", "Godomey", "Glo-Djigbé", "Hevié", "Kpanroun", "Ouèdo", "Togba", "Zinvié"]
      },
      {
        name: "Ouidah",
        arrondissements: ["Ouidah I", "Ouidah II", "Ouidah III", "Ouidah IV", "Gakpé", "Houakpé-Daho", "Pahou", "Savi", "Djégbadji", "Ahouicodji"]
      }
    ]
  },
  {
    name: "Littoral",
    communes: [
      {
        name: "Cotonou",
        arrondissements: ["1er Arrondissement", "2ème Arrondissement", "3ème Arrondissement", "4ème Arrondissement", "5ème Arrondissement", "6ème Arrondissement", "7ème Arrondissement", "8ème Arrondissement", "9ème Arrondissement", "10ème Arrondissement", "11ème Arrondissement", "12ème Arrondissement", "13ème Arrondissement"]
      }
    ]
  },
  {
    name: "Ouémé",
    communes: [
      {
        name: "Porto-Novo",
        arrondissements: ["1er Arrondissement", "2ème Arrondissement", "3ème Arrondissement", "4ème Arrondissement", "5ème Arrondissement"]
      },
      {
        name: "Akpro-Missérété",
        arrondissements: ["Akpro-Missérété", "Gomè-Sota", "Katagon", "Vakon", "Zoungbomè"]
      }
    ]
  },
  {
    name: "Borgou",
    communes: [
      {
        name: "Parakou",
        arrondissements: ["1er Arrondissement", "2ème Arrondissement", "3ème Arrondissement"]
      }
    ]
  }
  // Data can be extended as needed
];
