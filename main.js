const map = new maplibregl.Map({
    container: "map", // container id
    style: "https://raw.githubusercontent.com/gtitov/basemaps/master/dark-matter-nolabels.json", // style URL
    center: [0, 0], // starting position [lng, lat]
    zoom: 1, // starting zoom
});

map.on("load", () => {
    fetch("https://docs.google.com/spreadsheets/d/1f0waZduz5CXdNig_WWcJDWWntF-p5gN2-P-CNTLxEa0/export?format=csv")
        .then((response) => response.text())
        .then((csv) => {
            const rows = Papa.parse(csv, { header: true })
                // console.log(rows)
            const geojsonFeatures = rows.data.map((row) => {
                return {
                    type: "Feature",
                    properties: row,
                    geometry: {
                        type: "Point",
                        coordinates: [row.lon, row.lat],
                    }
                }
            })
            const geojson = {
                type: "FeatureCollection",
                features: geojsonFeatures
            }

            map.addSource("vacancies", {
                type: "geojson",
                data: geojson,
                cluster: true,
                clusterRadius: 20,
            });

            map.addLayer({
                id: "clusters",
                source: "vacancies",
                type: "circle",
                paint: {
                    "circle-color": "#7EC8E3",
                    "circle-stroke-width": 1,
                    "circle-stroke-color": "#FFFFFF",
                    "circle-radius": [
                        "step", ["get", "point_count"],
                        12,
                        3,
                        20,
                        6,
                        30
                    ],
                },
            });

            map.addLayer({
                id: "clusters-labels",
                type: "symbol",
                source: "vacancies",
                layout: {
                    "text-field": ["get", "point_count"],
                    "text-size": 10,
                },
            });

            geojson.features.map((f) => {
                document.getElementById(
                    "list-all"
                ).innerHTML += `<div class="list-item">
          <h4>${f.properties["Вакансия"]}</h4>
          <a href='#' onclick="map.flyTo({center: [${f.geometry.coordinates}], zoom: 10})">Найти на карте</a>
          </div><hr>`;
            });

            map.on('moveend', () => {
                const features = map.queryRenderedFeatures({
                    layers: ["clusters"]
                });

                document.getElementById("list-selected").innerHTML = "<h2>Сейчас на карте</h2>"


                features.map(f => {
                    if (f.properties.cluster) {
                        const clusterId = f.properties.cluster_id;
                        const pointCount = f.properties.point_count;
                        map.getSource("vacancies").getClusterLeaves(clusterId, pointCount, 0)
                            .then((clusterFeatures) => {
                                clusterFeatures.map((feature) => document.getElementById("list-selected")
                                    .innerHTML += `<div class="list-item">
                    <h4>${feature.properties["Вакансия"]}</h4>
                    <a target="blank_" href='${feature.properties["Ссылка на сайте Картетики"]}'>Подробнее</a>
                    </div><hr>`)
                            });
                    } else {
                        document.getElementById("list-selected")
                            .innerHTML += `<div class="list-item">
                <h4>${f.properties["Вакансия"]}</h4>
                <a target="blank_" href='${f.properties["Ссылка на сайте Картетики"]}'>Подробнее</a>
                </div><hr>`
                    }
                })
            })
        })

    map.on("click", "clusters", function(e) {
        map.flyTo({ center: e.lngLat, zoom: 8 });
    })

    map.on("mouseenter", "clusters", function() {
        map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "clusters", function() {
        map.getCanvas().style.cursor = "";
    });
});