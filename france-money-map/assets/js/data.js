const DATA_ROOT = new URL("../data/", import.meta.url);

let dataCache;

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
