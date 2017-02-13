var Gparams = {
    readOnly: true,
    modifyMode:'onList',//''onList'
    MaxResults: 2000,
    lang: "EN",

    profiles: {
        minimum: {
            hide: ["lang_52", "lang_62", "listDownloadButton", "div_externalRessources"],
            disable: ["listDownloadButton"]
        },
        all: {
            hide: [],
            disable: []
        }
    },
    currentProfile: "all",//minimum ,all
    navigationStyle: "",// , "jpt" // Jean Paul
    httpProxyUrl: "../http",
    neo4jProxyUrl: "/neo",
    mongoProxyUrl: "/mongo",
    storedParamsUrl: "/storedParams",
    imagesRootPath: "/files/albumPhotos/",
    forceAnimationDuration: 2000,
    maxDepthExplorationAroundNode: 3,
    // forceGraph
    circleR: 15,
    defaultNodeColor: "grey",
    nodeMaxTextLength: 40,
    user: "anonymous",
    curveOffset: 40,
    relStrokeWidth: 6,
    legendWidth: 200,
    minOpacity: .5,
    d3ForceParams: {distance: 200, charge: -500, gravity: .25},
    htmlOutputWithAttrs: true,
    showRelationNames: false,
    treeGraphVertSpacing: 35,
    bigDialogSize :{w: 800, h: 450},
    gantt: {
        name: "nom",
        startField: "datedebut",
        endField: "datefin",
    },

    palette: ['#B39BAB', '#FF78FF', '#A84F02', '#A8A302', '#0056B3',
        '#B354B3', '#FFD900', '#B37A00', '#B3B005', '#007DFF', '#F5ED02',
        '#F67502', '#B35905', '#FFFB08', '#FF7D07', '#FFDEF4',]

}

/*
 * palette : [ '#0056B3', '#007DFF', '#A84F02', '#A8A302', '#B354B3', '#B35905',
 * '#B37A00', '#B39BAB', '#B3B005', '#F5ED02', '#F67502', '#FF78FF', '#FF7D07',
 * '#FFD900', '#FFDEF4', '#FFFB08', ]
 */