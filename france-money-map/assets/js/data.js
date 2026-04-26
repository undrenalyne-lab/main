const DATA_ROOT = new URL("../data/", import.meta.url);

let dataCache;
let sourceExtrasCache;
let homeModelCache;

async function loadJson(filename) {
  const response = await fetch(new URL(filename, DATA_ROOT));
  if (!response.ok) {
    throw new Error(`Impossible de charger ${filename}`);
  }
  return response.json();
}

export async function loadAllData() {
  if (!dataCache) {
    dataCache = Promise.all([
      loadJson("lanes.json"),
      loadJson("tickets.json"),
      loadJson("employers.json"),
      loadJson("compensation_rules.json"),
      loadJson("sources.json"),
      loadJson("sectors.json"),
      loadJson("glossary.json"),
      loadJson("research_panels.json"),
    ]).then(
      ([
        lanes,
        tickets,
        employers,
        compensationRules,
        sources,
        sectors,
        glossary,
        researchPanels,
      ]) => ({
        lanes,
        tickets,
        employers,
        compensationRules,
        sources,
        sectors,
        glossary,
        researchPanels,
        laneMap: new Map(lanes.map((item) => [item.id, item])),
        ticketMap: new Map(tickets.map((item) => [item.id, item])),
        employerMap: new Map(employers.map((item) => [item.id, item])),
        compensationMap: new Map(
          compensationRules.map((item) => [item.laneId, item]),
        ),
        sourceMap: new Map(sources.map((item) => [item.id, item])),
        sectorMap: new Map(sectors.map((item) => [item.id, item])),
      }),
    );
  }

  return dataCache;
}

export async function loadSourceExtras() {
  if (!sourceExtrasCache) {
    sourceExtrasCache = Promise.all([
      loadJson("australia_panels.json"),
      loadJson("australia_playbooks.json"),
      loadJson("australia_guide.json"),
    ]).then(([australiaPanels, australiaPlaybooks, australiaGuide]) => ({
      australiaPanels,
      australiaPlaybooks,
      australiaGuide,
    }));
  }

  return sourceExtrasCache;
}

export async function loadHomeModel() {
  if (!homeModelCache) {
    homeModelCache = Promise.all([
      loadJson("home_onboarding_schema.json"),
      loadJson("home_country_configs.json"),
      loadJson("world_markets.json"),
      loadSourceExtras(),
    ]).then(([schema, countryConfigData, worldMarketData, extras]) => {
      const countries = countryConfigData.countries || [];
      const fields = schema.fields || [];
      const worldMarkets = worldMarketData.markets || [];

      return {
        schema,
        defaults: schema.defaults || {},
        fields,
        fieldMap: new Map(fields.map((field) => [field.id, field])),
        countries,
        countryMap: new Map(countries.map((country) => [country.id, country])),
        worldMarkets,
        worldMarketMap: new Map(worldMarkets.map((market) => [market.id, market])),
        australiaPanels: extras.australiaPanels,
        australiaPlaybooks: extras.australiaPlaybooks,
        australiaGuide: extras.australiaGuide,
        australiaPlaybookMap: new Map(
          extras.australiaPlaybooks.map((playbook) => [playbook.title, playbook]),
        ),
      };
    });
  }

  return homeModelCache;
}
